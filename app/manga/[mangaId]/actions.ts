"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";

export type CommentActionState = {
  ok: boolean;
  message: string;
};

export type PosterChoiceResult = {
  ok: boolean;
  message: string;
};

/**
 * Saves the current user's chosen poster for a manga. The posterUrl must be one
 * of the manga's curated `posterOptions` — arbitrary URLs are rejected.
 */
export async function setPosterChoiceAction(
  mangaId: string,
  posterUrl: string,
): Promise<PosterChoiceResult> {
  try {
    const user = await syncCurrentClerkUser();

    if (!user) {
      return { ok: false, message: "Sign in to choose a poster." };
    }

    const cleanMangaId = mangaId.trim();
    const cleanPosterUrl = posterUrl.trim();

    if (!cleanMangaId || !cleanPosterUrl) {
      return { ok: false, message: "Poster reference is missing." };
    }

    const manga = await prisma.manga.findUnique({
      where: { id: cleanMangaId },
      select: {
        id: true,
        posterOptions: true,
        chapters: {
          where: { coverImage: { not: null } },
          select: { chapterNumber: true, coverImage: true },
        },
      },
    });

    if (!manga) {
      return { ok: false, message: "That manga could not be found." };
    }

    if (!manga.posterOptions.includes(cleanPosterUrl)) {
      return { ok: false, message: "That poster is not available." };
    }

    // Spoiler gate: if the poster is a chapter cover, the user must have read
    // up to that chapter. Enforced here so a crafted request can't pick a
    // locked poster.
    const sourceChapter = manga.chapters.find(
      (chapter) => chapter.coverImage === cleanPosterUrl,
    )?.chapterNumber;

    if (typeof sourceChapter === "number") {
      const readAtOrPast = await prisma.readingProgress.findFirst({
        where: {
          userId: user.id,
          mangaId: cleanMangaId,
          chapter: { chapterNumber: { gte: sourceChapter } },
        },
        select: { id: true },
      });

      if (!readAtOrPast) {
        return {
          ok: false,
          message: "Энэ постерийн бүлгийг уншаагүй байна.",
        };
      }
    }

    await prisma.userPosterChoice.upsert({
      where: {
        userId_mangaId: {
          userId: user.id,
          mangaId: cleanMangaId,
        },
      },
      create: {
        userId: user.id,
        mangaId: cleanMangaId,
        posterUrl: cleanPosterUrl,
      },
      update: {
        posterUrl: cleanPosterUrl,
      },
    });

    revalidatePath(`/manga/${cleanMangaId}`);

    return { ok: true, message: "Poster updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not save your poster.",
    };
  }
}

const maxCommentLength = 1000;

function parseCommentBody(formData: FormData) {
  return String(formData.get("body") ?? "").trim();
}

export async function createMangaCommentAction(
  _prevState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  try {
    const user = await syncCurrentClerkUser();

    if (!user) {
      return {
        ok: false,
        message: "Sign in to leave a comment.",
      };
    }

    const mangaId = String(formData.get("mangaId") ?? "").trim();
    const parentId = String(formData.get("parentId") ?? "").trim();
    const body = parseCommentBody(formData);

    if (!mangaId) {
      return {
        ok: false,
        message: "Manga reference is missing.",
      };
    }

    if (body.length < 2) {
      return {
        ok: false,
        message: "Write at least 2 characters before posting.",
      };
    }

    if (body.length > maxCommentLength) {
      return {
        ok: false,
        message: `Comments must stay under ${maxCommentLength} characters.`,
      };
    }

    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { id: true },
    });

    if (!manga) {
      return {
        ok: false,
        message: "That manga could not be found.",
      };
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          mangaId: true,
          parentId: true,
        },
      });

      if (!parentComment || parentComment.mangaId !== mangaId) {
        return {
          ok: false,
          message: "That reply target could not be found.",
        };
      }

      if (parentComment.parentId) {
        return {
          ok: false,
          message: "Replies can only be added to top-level comments.",
        };
      }
    }

    await prisma.comment.create({
      data: {
        mangaId,
        userId: user.id,
        parentId: parentId || null,
        body,
      },
    });

    revalidatePath(`/manga/${mangaId}`);

    return {
      ok: true,
      message: parentId ? "Reply added." : "Comment added.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not save your comment.",
    };
  }
}

export async function deleteMangaCommentAction(
  _prevState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  try {
    const user = await syncCurrentClerkUser();

    if (!user) {
      return {
        ok: false,
        message: "Sign in to delete your comment.",
      };
    }

    const mangaId = String(formData.get("mangaId") ?? "").trim();
    const commentId = String(formData.get("commentId") ?? "").trim();

    if (!mangaId || !commentId) {
      return {
        ok: false,
        message: "Comment reference is missing.",
      };
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        mangaId: true,
        userId: true,
      },
    });

    if (!comment || comment.mangaId !== mangaId) {
      return {
        ok: false,
        message: "That comment could not be found.",
      };
    }

    if (comment.userId !== user.id) {
      return {
        ok: false,
        message: "You can only delete your own comments.",
      };
    }

    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    revalidatePath(`/manga/${mangaId}`);

    return {
      ok: true,
      message: "Comment deleted.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not delete your comment.",
    };
  }
}
