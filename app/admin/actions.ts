"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  downloadGoogleDriveFile,
  extractGoogleDriveFolderId,
  listGoogleDriveImages,
} from "@/lib/google-drive";
import { uploadToR2 } from "@/lib/r2";

export type AdminActionState = {
  ok: boolean;
  message: string;
  createdMangaId?: string;
};

export const initialAdminActionState: AdminActionState = {
  ok: false,
  message: "",
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

async function createMangaIngestion({
  input,
  coverAsset,
  pageAssets,
}: {
  input: IngestionInput;
  coverAsset?: UploadAsset | null;
  pageAssets: UploadAsset[];
}) {
  const genres = parseGenres(input.genreInput);

  const manga = await prisma.manga.create({
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

  if (coverAsset) {
    const coverKey = `manga/${manga.id}/cover/${slugifySegment(coverAsset.name || input.mangaName) || "cover"}`;
    const { url } = await uploadToR2(
      coverAsset.buffer,
      coverKey,
      coverAsset.contentType || "application/octet-stream",
    );

    await prisma.manga.update({
      where: { id: manga.id },
      data: { coverImage: url },
    });
  }

  const chapter = await prisma.chapter.create({
    data: {
      mangaId: manga.id,
      chapterNumber: input.chapterNumberValue,
      title: input.chapterTitle || null,
    },
  });

  const pagesToCreate = [];

  for (const [index, pageAsset] of pageAssets.entries()) {
    const pageNumber = index + 1;
    const pageKey = `manga/${manga.id}/chapters/${chapter.id}/${String(pageNumber).padStart(3, "0")}-${slugifySegment(pageAsset.name) || `page-${pageNumber}`}`;
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
    mangaId: manga.id,
    pageCount: pagesToCreate.length,
  };
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
    const folderValue = String(formData.get("driveFolder") ?? "");
    const folderId = extractGoogleDriveFolderId(folderValue);
    const useFirstPageAsCover =
      String(formData.get("useFirstPageAsCover") ?? "") === "on";

    if (!folderId) {
      return {
        ok: false,
        message: "Paste a Google Drive folder URL or folder ID.",
      };
    }

    const driveImages = await listGoogleDriveImages(folderId);
    const validationError = validateIngestionInput(input, driveImages.length);

    if (validationError) {
      return validationError;
    }

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

    const coverAsset = useFirstPageAsCover ? pageAssets[0] : null;
    const result = await createMangaIngestion({
      input,
      coverAsset,
      pageAssets,
    });

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
