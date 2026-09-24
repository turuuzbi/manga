import prisma from "@/lib/db";

/**
 * Completion rewards: a series with a reward background set (МАНГА ЗАСАХ →
 * "Бэлэг background") gives it, once, to every signed-in reader who has opened
 * each of its published chapters. Reading is tracked per user per chapter in
 * ReadingProgress already, so "finished" is simply "no published chapter of
 * this series without a ReadingProgress row".
 *
 * Idempotent by construction: UserReward is unique on (userId, mangaId), and
 * the reward and its МЭДЭЭ notice are written in one transaction, so re-reads,
 * refreshes or two chapters finishing at once can never create a second grant
 * or a second notice. scripts/grant-completion-rewards.mjs applies the same
 * rule to readers who finished before a reward was configured.
 */

export const REWARD_NOTICE_HREF = "/profile#backgrounds";

/** The МЭДЭЭ notice text, exactly as the owner specified it. */
export function rewardNoticeMessage(mangaName: string) {
  return `${mangaName} бүх бүлгийг уншиж дууссан тул background бэлгэнд ирлээ`;
}

type RewardManga = {
  id: string;
  mangaName: string;
  rewardBackgroundUrl: string | null;
  rewardBackgroundOriginalUrl: string | null;
};

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Grants the series' reward if this reader has now read every published
 * chapter. Returns true only when a new reward was created. Cheap to call on
 * every chapter open: a series without a reward returns at once, and one the
 * reader already earned costs a single indexed lookup.
 */
export async function grantCompletionRewardIfEarned(
  userId: string,
  manga: RewardManga,
): Promise<boolean> {
  if (!manga.rewardBackgroundUrl) {
    return false;
  }

  const existing = await prisma.userReward.findUnique({
    where: { userId_mangaId: { userId, mangaId: manga.id } },
    select: { id: true },
  });

  if (existing) {
    return false;
  }

  // "Published" = out already and actually readable (a chapter with no pages
  // cannot be opened in the reader, so it can never be completed).
  const [progress] = await prisma.$queryRaw<Array<{ total: number; unread: number }>>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 FROM "public"."ReadingProgress" rp
          WHERE rp."userId" = ${userId} AND rp."chapterId" = c.id
        )
      )::int AS unread
    FROM "public"."Chapter" c
    WHERE c."mangaId" = ${manga.id}
      AND c."publishedAt" <= now()
      AND EXISTS (SELECT 1 FROM "public"."Page" p WHERE p."chapterId" = c.id)
  `;

  if (!progress || progress.total === 0 || progress.unread > 0) {
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const reward = await tx.userReward.create({
        data: {
          userId,
          mangaId: manga.id,
          mangaName: manga.mangaName,
          imageUrl: manga.rewardBackgroundUrl as string,
          originalUrl:
            manga.rewardBackgroundOriginalUrl ?? (manga.rewardBackgroundUrl as string),
        },
        select: { id: true },
      });

      await tx.userNotification.create({
        data: {
          userId,
          kind: "REWARD",
          message: rewardNoticeMessage(manga.mangaName),
          href: REWARD_NOTICE_HREF,
          rewardId: reward.id,
        },
      });
    });

    return true;
  } catch (error) {
    // A concurrent open granted it first — exactly the outcome we want.
    if (isUniqueViolation(error)) {
      return false;
    }

    throw error;
  }
}
