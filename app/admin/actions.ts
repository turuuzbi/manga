"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  downloadGoogleDriveFile,
  extractGoogleDriveFolderId,
  inspectGoogleDriveFolder,
  listGoogleDriveFolders,
  listGoogleDriveImages,
} from "@/lib/google-drive";
import { deleteFromR2, getR2KeyFromUrl, uploadToR2 } from "@/lib/r2";

export type AdminActionState = {
  ok: boolean;
  message: string;
  createdMangaId?: string;
};

const allowedStatuses = new Set(["ONGOING", "COMPLETED", "HIATUS"]);

type IngestionInput = {
  mangaName: string;
  description: string;
  author: string;
  artist: string;
  genreInput: string;
  chapterTitle: string;
  chapterNumberValue: number;
  rawStatus: string;
};

type UploadAsset = {
  name: string;
  contentType: string;
  buffer: Buffer;
  width?: number | null;
  height?: number | null;
};

type DriveImportMode =
  | "new_manga_from_chapter"
  | "existing_manga_chapter"
  | "bulk_parent_folder";

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function parseGenres(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function parseIngestionInput(formData: FormData): IngestionInput {
  return {
    mangaName: String(formData.get("mangaName") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim(),
    artist: String(formData.get("artist") ?? "").trim(),
    genreInput: String(formData.get("genres") ?? ""),
    chapterTitle: String(formData.get("chapterTitle") ?? "").trim(),
    chapterNumberValue: Number(formData.get("chapterNumber")),
    rawStatus: String(formData.get("status") ?? "ONGOING").toUpperCase(),
  };
}

function parseMangaMetadataInput(formData: FormData) {
  return {
    mangaId: String(formData.get("mangaId") ?? "").trim(),
    mangaName: String(formData.get("mangaName") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim(),
    artist: String(formData.get("artist") ?? "").trim(),
    genreInput: String(formData.get("genres") ?? ""),
    rawStatus: String(formData.get("status") ?? "ONGOING").toUpperCase(),
  };
}

function parseDriveImportMode(formData: FormData): DriveImportMode {
  const mode = String(formData.get("driveImportMode") ?? "new_manga_from_chapter");

  if (
    mode === "existing_manga_chapter" ||
    mode === "bulk_parent_folder" ||
    mode === "new_manga_from_chapter"
  ) {
    return mode;
  }

  return "new_manga_from_chapter";
}

function parseChapterNumberFromFolderName(name: string) {
  const match = name.trim().match(/(\d+(\.\d+)?)/);

  return match ? Number(match[1]) : NaN;
}

function deriveChapterTitleFromFolderName(name: string) {
  const trimmed = name.trim();
  const withoutLeadingNumber = trimmed.replace(/^\d+(\.\d+)?[\s._-]*/, "").trim();

  return withoutLeadingNumber.length > 0 ? withoutLeadingNumber : null;
}

function validateIngestionInput(
  input: IngestionInput,
  pageCount: number,
): AdminActionState | null {
  if (!input.mangaName) {
    return { ok: false, message: "Series title is required." };
  }

  if (!Number.isFinite(input.chapterNumberValue) || input.chapterNumberValue <= 0) {
    return { ok: false, message: "Chapter number must be greater than 0." };
  }

  if (!allowedStatuses.has(input.rawStatus)) {
    return { ok: false, message: "Choose a valid manga status." };
  }

  if (pageCount === 0) {
    return {
      ok: false,
      message: "Add at least one manga page so the chapter can be created.",
    };
  }

  return null;
}

function validateChapterAppendInput(
  chapterNumber: number,
  pageCount: number,
): AdminActionState | null {
  if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) {
    return { ok: false, message: "Chapter number must be greater than 0." };
  }

  if (pageCount === 0) {
    return {
      ok: false,
      message: "Add at least one manga page so the chapter can be created.",
    };
  }

  return null;
}

async function createMangaRecord(input: IngestionInput) {
  const genres = parseGenres(input.genreInput);

  return prisma.manga.create({
    data: {
      mangaName: input.mangaName,
      description: input.description || null,
      author: input.author || null,
      artist: input.artist || null,
      status: input.rawStatus as "ONGOING" | "COMPLETED" | "HIATUS",
      genres:
        genres.length > 0
          ? {
              create: genres.map((name) => ({
                genre: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
            }
          : undefined,
    },
  });
}

async function attachCoverToManga({
  mangaId,
  mangaName,
  coverAsset,
}: {
  mangaId: string;
  mangaName: string;
  coverAsset?: UploadAsset | null;
}) {
  if (!coverAsset) {
    return null;
  }

  const coverKey = `manga/${mangaId}/cover/${slugifySegment(coverAsset.name || mangaName) || "cover"}`;
  const { url } = await uploadToR2(
    coverAsset.buffer,
    coverKey,
    coverAsset.contentType || "application/octet-stream",
  );

  await prisma.manga.update({
    where: { id: mangaId },
    data: { coverImage: url },
  });

  return url;
}

async function createChapterWithPages({
  mangaId,
  mangaName,
  chapterNumber,
  chapterTitle,
  pageAssets,
}: {
  mangaId: string;
  mangaName: string;
  chapterNumber: number;
  chapterTitle?: string | null;
  pageAssets: UploadAsset[];
}) {
  const chapter = await prisma.chapter.create({
    data: {
      mangaId,
      chapterNumber,
      title: chapterTitle || null,
    },
  });

  const pagesToCreate = [];

  for (const [index, pageAsset] of pageAssets.entries()) {
    const pageNumber = index + 1;
    const pageKey = `manga/${mangaId}/chapters/${chapter.id}/${String(pageNumber).padStart(3, "0")}-${slugifySegment(pageAsset.name) || `page-${pageNumber}`}`;
    const { url } = await uploadToR2(
      pageAsset.buffer,
      pageKey,
      pageAsset.contentType || "application/octet-stream",
    );

    pagesToCreate.push({
      chapterId: chapter.id,
      pageNumber,
      imageUrl: url,
      width: pageAsset.width ?? null,
      height: pageAsset.height ?? null,
    });
  }

  await prisma.page.createMany({
    data: pagesToCreate,
  });

  revalidatePath("/admin");

  return {
    mangaId,
    mangaName,
    chapterId: chapter.id,
    pageCount: pagesToCreate.length,
  };
}

async function createMangaIngestion({
  input,
  coverAsset,
  pageAssets,
}: {
  input: IngestionInput;
  coverAsset?: UploadAsset | null;
  pageAssets: UploadAsset[];
}) {
  const manga = await createMangaRecord(input);

  await attachCoverToManga({
    mangaId: manga.id,
    mangaName: input.mangaName,
    coverAsset,
  });

  return createChapterWithPages({
    mangaId: manga.id,
    mangaName: input.mangaName,
    chapterNumber: input.chapterNumberValue,
    chapterTitle: input.chapterTitle || null,
    pageAssets,
  });
}

async function appendChapterToManga({
  mangaId,
  chapterNumber,
  chapterTitle,
  pageAssets,
  setCoverFromFirstPage,
}: {
  mangaId: string;
  chapterNumber: number;
  chapterTitle?: string | null;
  pageAssets: UploadAsset[];
  setCoverFromFirstPage?: boolean;
}) {
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    select: {
      id: true,
      mangaName: true,
      coverImage: true,
    },
  });

  if (!manga) {
    throw new Error("Selected manga could not be found.");
  }

  const existingChapter = await prisma.chapter.findUnique({
    where: {
      mangaId_chapterNumber: {
        mangaId,
        chapterNumber,
      },
    },
    select: { id: true },
  });

  if (existingChapter) {
    throw new Error(`Chapter ${chapterNumber} already exists for this manga.`);
  }

  if (setCoverFromFirstPage && !manga.coverImage && pageAssets[0]) {
    await attachCoverToManga({
      mangaId: manga.id,
      mangaName: manga.mangaName,
      coverAsset: pageAssets[0],
    });
  }

  return createChapterWithPages({
    mangaId: manga.id,
    mangaName: manga.mangaName,
    chapterNumber,
    chapterTitle,
    pageAssets,
  });
}

async function buildDrivePageAssets(folderId: string) {
  const driveImages = await listGoogleDriveImages(folderId);

  const pageAssets: UploadAsset[] = [];

  for (const image of driveImages) {
    const buffer = await downloadGoogleDriveFile(image.id);

    pageAssets.push({
      name: image.name,
      contentType: image.mimeType,
      buffer,
      width: image.width,
      height: image.height,
    });
  }

  return { driveImages, pageAssets };
}

function formatDriveFolderDebugMessage(summary: {
  folderName: string;
  childCount: number;
  folderCount: number;
  imageCount: number;
  sampleItems: Array<{
    name: string;
    mimeType: string;
  }>;
}) {
  const sampleItems =
    summary.sampleItems.length > 0
      ? summary.sampleItems
          .map((item) => `${item.name} (${item.mimeType})`)
          .join(", ")
      : "none";

  if (summary.folderCount === 0 && summary.imageCount > 0) {
    return `Google Drive can read "${summary.folderName}", but it contains direct image files instead of chapter folders. Use the single-chapter import mode for this folder. Visible items: ${sampleItems}.`;
  }

  if (summary.childCount === 0) {
    return `Google Drive can open "${summary.folderName}", but the service account cannot see any child items inside it. Re-share the copied parent folder with the service account email and make sure the chapter folders are not private-only shortcuts.`;
  }

  return `Google Drive can read "${summary.folderName}", but none of the visible child items resolved to chapter folders. Visible items: ${sampleItems}.`;
}

async function deleteR2AssetsFromUrls(urls: string[]) {
  const keys = urls
    .map((url) => getR2KeyFromUrl(url))
    .filter((key): key is string => Boolean(key));

  for (const key of keys) {
    await deleteFromR2(key);
  }
}

export async function ingestMangaAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for manual uploads.",
      };
    }

    const input = parseIngestionInput(formData);
    const coverImage = formData.get("coverImage");
    const pageFiles = formData.getAll("pages").filter(isUploadFile);
    const validationError = validateIngestionInput(input, pageFiles.length);

    if (validationError) {
      return validationError;
    }

    const sortedPages = [...pageFiles].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const pageAssets = await Promise.all(
      sortedPages.map(async (pageFile) => ({
        name: pageFile.name,
        contentType: pageFile.type || "application/octet-stream",
        buffer: Buffer.from(await pageFile.arrayBuffer()),
      })),
    );

    const coverAsset = isUploadFile(coverImage)
      ? {
          name: coverImage.name,
          contentType: coverImage.type || "application/octet-stream",
          buffer: Buffer.from(await coverImage.arrayBuffer()),
        }
      : null;

    const result = await createMangaIngestion({
      input,
      coverAsset,
      pageAssets,
    });

    return {
      ok: true,
      message: `Uploaded ${result.pageCount} pages to R2 and created "${input.mangaName}" in Neon.`,
      createdMangaId: result.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Upload failed before the manga could be fully ingested.",
    };
  }
}

export async function importGoogleDriveFolderAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for Google Drive imports.",
      };
    }

    const input = parseIngestionInput(formData);
    const driveImportMode = parseDriveImportMode(formData);
    const folderValue = String(formData.get("driveFolder") ?? "");
    const folderId = extractGoogleDriveFolderId(folderValue);
    const existingMangaId = String(formData.get("existingMangaId") ?? "").trim();
    const useFirstPageAsCover =
      String(formData.get("useFirstPageAsCover") ?? "") === "on";

    if (!folderId) {
      return {
        ok: false,
        message: "Paste a Google Drive folder URL or folder ID.",
      };
    }

    if (driveImportMode === "bulk_parent_folder") {
      if (!input.mangaName) {
        return { ok: false, message: "Series title is required." };
      }

      if (!allowedStatuses.has(input.rawStatus)) {
        return { ok: false, message: "Choose a valid manga status." };
      }

      const chapterFolders = await listGoogleDriveFolders(folderId);

      if (chapterFolders.length === 0) {
        const summary = await inspectGoogleDriveFolder(folderId);

        return {
          ok: false,
          message: formatDriveFolderDebugMessage(summary),
        };
      }

      const manga = await createMangaRecord(input);
      let importedChapters = 0;
      let importedPages = 0;

      for (const [folderIndex, chapterFolder] of chapterFolders.entries()) {
        const chapterNumber = parseChapterNumberFromFolderName(chapterFolder.name);

        if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) {
          throw new Error(
            `Could not read a chapter number from folder "${chapterFolder.name}".`,
          );
        }

        const { driveImages, pageAssets } = await buildDrivePageAssets(
          chapterFolder.id,
        );

        if (driveImages.length === 0) {
          continue;
        }

        if (folderIndex === 0 && useFirstPageAsCover && pageAssets[0]) {
          await attachCoverToManga({
            mangaId: manga.id,
            mangaName: manga.mangaName,
            coverAsset: pageAssets[0],
          });
        }

        await createChapterWithPages({
          mangaId: manga.id,
          mangaName: manga.mangaName,
          chapterNumber,
          chapterTitle: deriveChapterTitleFromFolderName(chapterFolder.name),
          pageAssets,
        });

        importedChapters += 1;
        importedPages += pageAssets.length;
      }

      if (importedChapters === 0) {
        await prisma.manga.delete({
          where: {
            id: manga.id,
          },
        });

        return {
          ok: false,
          message:
            "Google Drive found chapter folders, but none of them contained readable images for import.",
        };
      }

      revalidatePath("/");
      revalidatePath(`/manga/${manga.id}`);

      return {
        ok: true,
        message: `Imported ${importedChapters} chapters and ${importedPages} pages into "${manga.mangaName}".`,
        createdMangaId: manga.id,
      };
    }

    const { driveImages, pageAssets } = await buildDrivePageAssets(folderId);

    if (driveImportMode === "existing_manga_chapter") {
      const appendValidationError = validateChapterAppendInput(
        input.chapterNumberValue,
        driveImages.length,
      );

      if (appendValidationError) {
        return appendValidationError;
      }

      if (!existingMangaId) {
        return {
          ok: false,
          message: "Choose an existing manga before importing a new chapter.",
        };
      }

      const result = await appendChapterToManga({
        mangaId: existingMangaId,
        chapterNumber: input.chapterNumberValue,
        chapterTitle: input.chapterTitle || null,
        pageAssets,
        setCoverFromFirstPage: useFirstPageAsCover,
      });

      revalidatePath("/");
      revalidatePath(`/manga/${existingMangaId}`);

      return {
        ok: true,
        message: `Imported chapter ${input.chapterNumberValue} with ${result.pageCount} pages into the existing manga.`,
        createdMangaId: existingMangaId,
      };
    }

    const validationError = validateIngestionInput(input, driveImages.length);

    if (validationError) {
      return validationError;
    }

    const coverAsset = useFirstPageAsCover ? pageAssets[0] : null;
    const result = await createMangaIngestion({
      input,
      coverAsset,
      pageAssets,
    });

    revalidatePath("/");
    revalidatePath(`/manga/${result.mangaId}`);

    return {
      ok: true,
      message: `Imported ${result.pageCount} Google Drive images into R2 and created "${input.mangaName}" in Neon.`,
      createdMangaId: result.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Google Drive import failed.",
    };
  }
}

export async function updateMangaMetadataAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for manga updates.",
      };
    }

    const input = parseMangaMetadataInput(formData);

    if (!input.mangaId) {
      return {
        ok: false,
        message: "Choose a manga to update.",
      };
    }

    if (!input.mangaName) {
      return {
        ok: false,
        message: "Series title is required.",
      };
    }

    if (!allowedStatuses.has(input.rawStatus)) {
      return {
        ok: false,
        message: "Choose a valid manga status.",
      };
    }

    const genres = parseGenres(input.genreInput);

    await prisma.manga.update({
      where: {
        id: input.mangaId,
      },
      data: {
        mangaName: input.mangaName,
        description: input.description || null,
        author: input.author || null,
        artist: input.artist || null,
        status: input.rawStatus as "ONGOING" | "COMPLETED" | "HIATUS",
        genres: {
          deleteMany: {},
          create:
            genres.length > 0
              ? genres.map((name) => ({
                  genre: {
                    connectOrCreate: {
                      where: { name },
                      create: { name },
                    },
                  },
                }))
              : undefined,
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/manga/${input.mangaId}`);

    return {
      ok: true,
      message: `Updated "${input.mangaName}" in Neon.`,
      createdMangaId: input.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Manga update failed.",
    };
  }
}

export async function reorderChapterPagesAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for chapter page edits.",
      };
    }

    const chapterId = String(formData.get("chapterId") ?? "").trim();
    const pageOrderRaw = String(formData.get("pageOrder") ?? "").trim();

    if (!chapterId || !pageOrderRaw) {
      return {
        ok: false,
        message: "Choose a chapter and keep at least one page in the order list.",
      };
    }

    const pageOrder = JSON.parse(pageOrderRaw);

    if (
      !Array.isArray(pageOrder) ||
      pageOrder.length === 0 ||
      !pageOrder.every((entry) => typeof entry === "string")
    ) {
      return {
        ok: false,
        message: "The page order payload is invalid.",
      };
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        mangaId: true,
        chapterNumber: true,
        pages: {
          orderBy: {
            pageNumber: "asc",
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!chapter) {
      return {
        ok: false,
        message: "That chapter could not be found.",
      };
    }

    const existingPageIds = chapter.pages.map((page) => page.id).sort();
    const requestedPageIds = [...pageOrder].sort();

    if (
      existingPageIds.length !== requestedPageIds.length ||
      existingPageIds.some((pageId, index) => pageId !== requestedPageIds[index])
    ) {
      return {
        ok: false,
        message: "The page list no longer matches the latest DB state. Refresh and try again.",
      };
    }

    await prisma.$transaction(async (tx) => {
      for (const [index, pageId] of pageOrder.entries()) {
        await tx.page.update({
          where: { id: pageId },
          data: {
            pageNumber: 10_000 + index + 1,
          },
        });
      }

      for (const [index, pageId] of pageOrder.entries()) {
        await tx.page.update({
          where: { id: pageId },
          data: {
            pageNumber: index + 1,
          },
        });
      }
    });

    revalidatePath("/admin");
    revalidatePath(`/manga/${chapter.mangaId}`);
    revalidatePath(`/reader/${chapter.id}`);

    return {
      ok: true,
      message: `Updated the page order for chapter ${chapter.chapterNumber}. Reader mode will now follow the new order.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Page order update failed.",
    };
  }
}

export async function deleteChapterAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for chapter deletion.",
      };
    }

    const chapterId = String(formData.get("chapterId") ?? "").trim();

    if (!chapterId) {
      return {
        ok: false,
        message: "Choose a chapter before deleting it.",
      };
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        mangaId: true,
        chapterNumber: true,
        title: true,
        manga: {
          select: {
            mangaName: true,
          },
        },
        pages: {
          select: {
            imageUrl: true,
          },
        },
      },
    });

    if (!chapter) {
      return {
        ok: false,
        message: "That chapter could not be found.",
      };
    }

    await deleteR2AssetsFromUrls(chapter.pages.map((page) => page.imageUrl));

    await prisma.chapter.delete({
      where: {
        id: chapter.id,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/manga/${chapter.mangaId}`);

    return {
      ok: true,
      message: `Deleted chapter ${chapter.chapterNumber} from "${chapter.manga.mangaName}" and removed its page files from R2.`,
      createdMangaId: chapter.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Chapter deletion failed.",
    };
  }
}
