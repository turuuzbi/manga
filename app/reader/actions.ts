"use server";

import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";

/**
 * Records that the current user has opened a chapter. Called from the reader
 * when it mounts, so it only fires on a real open (not on prefetch). Upserts a
 * per-chapter ReadingProgress row and bumps `readAt`, which drives the
 * "Continue reading" rail and the chapter read-state on the detail page.
 */
export async function markChapterRead(chapterId: string, mangaId: string) {
  if (!chapterId || !mangaId) {
    return;
  }

  const user = await syncCurrentClerkUser();

  if (!user) {
    return;
  }

  await prisma.readingProgress.upsert({
    where: {
      userId_chapterId: {
        userId: user.id,
        chapterId,
      },
    },
    create: {
      userId: user.id,
      mangaId,
      chapterId,
    },
    update: {
      readAt: new Date(),
    },
  });
}
