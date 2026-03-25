"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";
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
  return [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
}

export async function ingestMangaAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const dbUser = await syncCurrentClerkUser();

    if (!dbUser) {
      return {
        ok: false,
        message:
          "Sign in with Clerk first so the admin upload can sync your Neon user.",
      };
    }

    const mangaName = String(formData.get("mangaName") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const author = String(formData.get("author") ?? "").trim();
    const artist = String(formData.get("artist") ?? "").trim();
    const genreInput = String(formData.get("genres") ?? "");
    const chapterTitle = String(formData.get("chapterTitle") ?? "").trim();
    const chapterNumberValue = Number(formData.get("chapterNumber"));
    const rawStatus = String(formData.get("status") ?? "ONGOING").toUpperCase();
    const coverImage = formData.get("coverImage");
    const pageFiles = formData.getAll("pages").filter(isUploadFile);

    if (!mangaName) {
      return { ok: false, message: "Series title is required." };
    }

    if (!Number.isFinite(chapterNumberValue) || chapterNumberValue <= 0) {
      return { ok: false, message: "Chapter number must be greater than 0." };
    }

    if (!allowedStatuses.has(rawStatus)) {
      return { ok: false, message: "Choose a valid manga status." };
    }

    if (pageFiles.length === 0) {
      return {
        ok: false,
        message: "Add at least one manga page so the chapter can be created.",
      };
    }

    const genres = parseGenres(genreInput);

    const manga = await prisma.manga.create({
      data: {
        mangaName,
        description: description || null,
        author: author || null,
        artist: artist || null,
        status: rawStatus as "ONGOING" | "COMPLETED" | "HIATUS",
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

    if (isUploadFile(coverImage)) {
      const coverKey = `manga/${manga.id}/cover/${slugifySegment(coverImage.name || mangaName) || "cover"}`;
      const coverBuffer = Buffer.from(await coverImage.arrayBuffer());
      const { url } = await uploadToR2(
        coverBuffer,
        coverKey,
        coverImage.type || "application/octet-stream",
      );

      await prisma.manga.update({
        where: { id: manga.id },
        data: { coverImage: url },
      });
    }

    const chapter = await prisma.chapter.create({
      data: {
        mangaId: manga.id,
        chapterNumber: chapterNumberValue,
        title: chapterTitle || null,
      },
    });

    const sortedPages = [...pageFiles].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const pagesToCreate = [];

    for (const [index, pageFile] of sortedPages.entries()) {
      const pageNumber = index + 1;
      const pageKey = `manga/${manga.id}/chapters/${chapter.id}/${String(pageNumber).padStart(3, "0")}-${slugifySegment(pageFile.name) || `page-${pageNumber}`}`;
      const pageBuffer = Buffer.from(await pageFile.arrayBuffer());
      const { url } = await uploadToR2(
        pageBuffer,
        pageKey,
        pageFile.type || "application/octet-stream",
      );

      pagesToCreate.push({
        chapterId: chapter.id,
        pageNumber,
        imageUrl: url,
      });
    }

    await prisma.page.createMany({
      data: pagesToCreate,
    });

    revalidatePath("/admin");

    return {
      ok: true,
      message: `Uploaded ${pagesToCreate.length} pages to R2 and created "${mangaName}" in Neon.`,
      createdMangaId: manga.id,
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
