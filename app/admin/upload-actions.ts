"use server";

import { requireAdminUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { generateId } from "@/lib/ids";
import { createPresignedUpload } from "@/lib/r2";
import { buildUploadKey } from "@/lib/uploads";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  UPLOAD_CONTENT_TYPES,
  UPLOAD_SLOTS,
  type UploadFileRequest,
  type UploadScope,
  type UploadTargetsResult,
} from "@/lib/upload-types";

/**
 * Hands the admin browser one signed PUT URL per file, so images go straight
 * to R2 and only their URLs travel through the Server Action that saves the
 * row. Before this, the files rode inside the action body; Vercel rejects any
 * body over 4.5 MB with a plain-text 413 before the function runs, which the
 * client surfaced as "An unexpected response was received from the server."
 *
 * The browser describes each file (slot, type, size); the key is always built
 * here, from ids this function has checked.
 */
export async function requestUploadTargetsAction(
  scope: UploadScope,
  files: UploadFileRequest[],
): Promise<UploadTargetsResult> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return { ok: false, message: "Зураг оруулахад админ эрх шаардлагатай." };
    }

    if (!Array.isArray(files) || files.length === 0) {
      return { ok: false, message: "Оруулах зураг алга." };
    }

    if (files.length > MAX_UPLOAD_FILES) {
      return {
        ok: false,
        message: `Нэг удаад ${MAX_UPLOAD_FILES}-аас олон зураг оруулах боломжгүй.`,
      };
    }

    const allowedSlots: readonly string[] = UPLOAD_SLOTS[scope?.kind] ?? [];

    for (const file of files) {
      if (!allowedSlots.includes(file.slot)) {
        return { ok: false, message: "Зургийн төрөл танигдсангүй." };
      }

      if (!UPLOAD_CONTENT_TYPES[file.contentType]) {
        return {
          ok: false,
          message: `"${file.name}" — зөвхөн JPG, PNG, WEBP, GIF, AVIF зураг оруулна.`,
        };
      }

      if (!Number.isFinite(file.size) || file.size <= 0) {
        return { ok: false, message: `"${file.name}" хоосон файл байна.` };
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return {
          ok: false,
          message: `"${file.name}" хэт том байна (${Math.round(file.size / 1024 / 1024)} MB). ${MAX_UPLOAD_BYTES / 1024 / 1024} MB-аас бага зураг сонгоно уу.`,
        };
      }
    }

    let mangaId: string | undefined;
    let chapterId: string | undefined;
    let reserved: { mangaId?: string; chapterId?: string } = {};

    if (scope.kind === "manga") {
      const manga = await prisma.manga.findUnique({
        where: { id: String(scope.mangaId ?? "") },
        select: { id: true },
      });

      if (!manga) {
        return { ok: false, message: "Манга олдсонгүй." };
      }

      mangaId = manga.id;
    } else if (scope.kind === "chapter") {
      // The series comes from the chapter row, never from the browser.
      const chapter = await prisma.chapter.findUnique({
        where: { id: String(scope.chapterId ?? "") },
        select: { id: true, mangaId: true },
      });

      if (!chapter) {
        return { ok: false, message: "Бүлэг олдсонгүй." };
      }

      mangaId = chapter.mangaId;
      chapterId = chapter.id;
    } else if (scope.kind === "ingest") {
      if (scope.mangaId) {
        const manga = await prisma.manga.findUnique({
          where: { id: String(scope.mangaId) },
          select: { id: true },
        });

        if (!manga) {
          return { ok: false, message: "Сонгосон манга олдсонгүй." };
        }

        mangaId = manga.id;
      } else {
        mangaId = generateId();
        reserved.mangaId = mangaId;
      }

      chapterId = generateId();
      reserved = { ...reserved, chapterId };
    }

    let pageIndex = 0;
    const targets = await Promise.all(
      files.map(async (file) => {
        const key = buildUploadKey({
          scope: scope.kind,
          slot: file.slot,
          contentType: file.contentType,
          fileName: file.name,
          mangaId,
          chapterId,
          pageIndex: file.slot === "page" ? pageIndex++ : undefined,
        });
        const { uploadUrl, publicUrl } = await createPresignedUpload(
          key,
          file.contentType,
        );

        return {
          slot: file.slot,
          uploadUrl,
          publicUrl,
          contentType: file.contentType,
        };
      }),
    );

    return { ok: true, targets, ...reserved };
  } catch (error) {
    console.error("[admin] upload target request failed", error);

    return {
      ok: false,
      message: "Зураг оруулах холбоос үүсгэж чадсангүй. Дахин оролдоно уу.",
    };
  }
}
