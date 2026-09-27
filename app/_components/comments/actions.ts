"use server";

import { revalidateTag } from "next/cache";
import { ensureDbUser } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  COMMENT_COOLDOWN_SECONDS,
  COMMENT_MAX_LENGTH,
  COMMENT_SELECT,
  RECENT_COMMENTS_TAG,
  commentLength,
  normalizeCommentBody,
  toCommentView,
  type ChapterCommentView,
} from "@/lib/chapter-comments";

export type CreateCommentResult =
  | { ok: true; comment: ChapterCommentView; total: number }
  | { ok: false; message: string };

export type DeleteCommentResult =
  | { ok: true; total: number }
  | { ok: false; message: string };

/** Posts a comment under a chapter. Signed-in readers only. */
export async function createChapterCommentAction(input: {
  chapterId: string;
  body: string;
  isSpoiler: boolean;
}): Promise<CreateCommentResult> {
  const user = await ensureDbUser();

  if (!user) {
    return { ok: false, message: "Сэтгэгдэл бичихийн тулд нэвтэрнэ үү." };
  }

  const chapterId = typeof input?.chapterId === "string" ? input.chapterId : "";
  const body = normalizeCommentBody(input?.body);
  const length = commentLength(body);

  if (length < 1) {
    return { ok: false, message: "Сэтгэгдлээ бичнэ үү." };
  }

  if (length > COMMENT_MAX_LENGTH) {
    return {
      ok: false,
      message: `Сэтгэгдэл ${COMMENT_MAX_LENGTH} тэмдэгтээс хэтрэхгүй байна.`,
    };
  }

  const chapter = chapterId
    ? await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, mangaId: true },
      })
    : null;

  if (!chapter) {
    return { ok: false, message: "Бүлэг олдсонгүй." };
  }

  // The cooldown lives in the database (serverless: no memory survives
  // between requests). The lock makes two posts sent at once take turns, so
  // the second sees the first and waits out the cooldown too.
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`comment:${user.id}`}))`;

    const last = await tx.comment.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const waitMs = last
      ? last.createdAt.getTime() + COMMENT_COOLDOWN_SECONDS * 1000 - Date.now()
      : 0;

    if (waitMs > 0) {
      return { waitSeconds: Math.ceil(waitMs / 1000) };
    }

    const created = await tx.comment.create({
      data: {
        mangaId: chapter.mangaId,
        chapterId: chapter.id,
        userId: user.id,
        body,
        isSpoiler: input?.isSpoiler === true,
      },
      select: COMMENT_SELECT,
    });

    return { created };
  });

  if ("waitSeconds" in result) {
    return {
      ok: false,
      message: `Түр хүлээгээрэй — ${result.waitSeconds} секундын дараа дахин бичих боломжтой.`,
    };
  }

  const total = await prisma.comment.count({
    where: { chapterId: chapter.id, deletedAt: null },
  });

  return { ok: true, comment: toCommentView(result.created, user), total };
}

/** Soft-deletes a chapter comment: the author's own, or any for an admin. */
export async function deleteChapterCommentAction(
  commentId: string,
): Promise<DeleteCommentResult> {
  const user = await ensureDbUser();

  if (!user) {
    return { ok: false, message: "Нэвтэрнэ үү." };
  }

  const comment =
    typeof commentId === "string" && commentId
      ? await prisma.comment.findUnique({
          where: { id: commentId },
          select: { id: true, userId: true, chapterId: true, deletedAt: true },
        })
      : null;

  if (!comment?.chapterId || comment.deletedAt) {
    return { ok: false, message: "Сэтгэгдэл олдсонгүй." };
  }

  if (comment.userId !== user.id && user.role !== "ADMIN") {
    return { ok: false, message: "Зөвхөн өөрийн сэтгэгдлийг устгах боломжтой." };
  }

  await prisma.comment.updateMany({
    where: { id: comment.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  // Take it off the homepage carousel now, not a minute from now.
  revalidateTag(RECENT_COMMENTS_TAG, { expire: 0 });

  const total = await prisma.comment.count({
    where: { chapterId: comment.chapterId, deletedAt: null },
  });

  return { ok: true, total };
}
