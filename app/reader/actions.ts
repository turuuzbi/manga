"use server";

import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";

/**
 * Records that a chapter was opened. Called from the reader when it mounts, so
 * it only fires on a real open (not on prefetch).
 *
 * Does two things, both behind the sign-in check because `/reader/[chapterId]`
 * redirects logged-out visitors anyway — every real open is authenticated:
 *
 * 1. Bumps the series' `viewCount`, which ranks the "Топ 10 үзэлттэй манга"
 *    rail. Counted per open rather than per unique reader: re-reads and
 *    refreshes both add. Good enough for ordering ten titles.
 * 2. Upserts the per-chapter ReadingProgress row and bumps `readAt`, driving
 *    the "Continue reading" rail and the chapter read-state on the detail page.
 */
export async function markChapterRead(chapterId: string) {
  if (!chapterId) {
    return;
  }

  const user = await syncCurrentClerkUser();

  if (!user) {
    return;
  }

  // The series comes from the chapter row, never from the caller. A server
  // action is a public endpoint: taking the client's word for which manga this
  // chapter belongs to would let anyone POST an arbitrary pair and inflate any
  // series' view count, or file reading progress under the wrong title.
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { mangaId: true },
  });

  if (!chapter) {
    return;
  }

  await prisma.$transaction([
    prisma.manga.update({
      where: { id: chapter.mangaId },
      data: { viewCount: { increment: 1 } },
    }),
    prisma.readingProgress.upsert({
      where: {
        userId_chapterId: {
          userId: user.id,
          chapterId,
        },
      },
      create: {
        userId: user.id,
        mangaId: chapter.mangaId,
        chapterId,
      },
      update: {
        readAt: new Date(),
      },
    }),
  ]);
}
