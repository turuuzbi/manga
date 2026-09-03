"use server";

import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";

/**
 * Records that a chapter was opened. Called from the reader when it mounts, so
 * it only fires on a real open (not on prefetch).
 *
 * Does three things, all behind the sign-in check because `/reader/[chapterId]`
 * redirects logged-out visitors anyway — every real open is authenticated:
 *
 * 1. Bumps the series' `viewCount`, which ranks the "Топ 10 үзэлттэй манга"
 *    rail. Counted per open rather than per unique reader: re-reads and
 *    refreshes both add. Good enough for ordering ten titles.
 * 2. Upserts the per-chapter ReadingProgress row and bumps `readAt`, driving
 *    the "Continue reading" rail and the chapter read-state on the detail page.
 * 3. Recomputes `readerCount` when this open is the reader's first chapter of
 *    the series, so the detail page's reader total never needs a COUNT DISTINCT
 *    to render.
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

  const { mangaId } = chapter;

  await prisma.$transaction(async (tx) => {
    await tx.manga.update({
      where: { id: mangaId },
      data: { viewCount: { increment: 1 } },
    });

    await tx.readingProgress.upsert({
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

    // The row written above is this reader's only one for the series, so they
    // just became a new reader of it. Every later chapter finds a count above 1
    // and skips the work, which is what keeps this off the per-open path.
    const chaptersReadHere = await tx.readingProgress.count({
      where: { userId: user.id, mangaId },
    });

    if (chaptersReadHere !== 1) {
      return;
    }

    // Recomputed rather than incremented. An increment would be permanent if it
    // ever fired twice — two chapters of an unread series opened in the same
    // instant could both see a count of 1 — whereas setting the true value is
    // idempotent, so a double fire converges instead of drifting. Served by the
    // (mangaId, userId) index, and only ever runs once per reader per series.
    await tx.$executeRaw`
      UPDATE "Manga"
      SET "readerCount" = (
        SELECT COUNT(DISTINCT "userId")::int
        FROM "ReadingProgress"
        WHERE "mangaId" = ${mangaId}
      )
      WHERE id = ${mangaId}
    `;
  });
}
