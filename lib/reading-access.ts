import { createHash } from "node:crypto";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import {
  FREE_ACCOUNTS_PER_IP_PER_DAY,
  FREE_CHAPTERS_PER_DAY,
  isPremium,
  resolvePaywalledChapters,
} from "@/lib/plans";

export type AccessReason =
  | "premium"
  | "already_read"
  | "already_today"
  | "consumed"
  | "ip_limit"
  | "quota_exhausted"
  | "latest_locked";

export type ChapterAccess = {
  allowed: boolean;
  reason: AccessReason;
  isPremium: boolean;
  /** Free unlocks left for this user today after this call (null when premium). */
  remainingFree: number | null;
};

/** "YYYY-MM-DD" for the Asia/Ulaanbaatar calendar day (free tier resets here). */
export function ulaanbaatarDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Hashed client IP (never store raw IPs). Uses Vercel's x-forwarded-for. */
export async function getClientIpHash(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    store.get("x-real-ip")?.trim() ||
    "unknown";
  const secret = process.env.IP_HASH_SECRET ?? "yume-metering-salt";
  return createHash("sha256").update(`${ip}:${secret}`).digest("hex");
}

/**
 * True when this chapter sits inside the series' subscriber-only window — the
 * newest N chapters, where N is the manga's own setting or the site default.
 * These can never be opened with a daily free unlock.
 */
export async function isPaywalledLatestChapter(chapter: {
  mangaId: string;
  chapterNumber: number;
  /** The manga's paywalledChapters column; null uses the site default. */
  paywalledChapters?: number | null;
}): Promise<boolean> {
  const windowSize = resolvePaywalledChapters(chapter.paywalledChapters);

  if (windowSize === 0) {
    return false;
  }

  const newerChapters = await prisma.chapter.count({
    where: {
      mangaId: chapter.mangaId,
      chapterNumber: { gt: chapter.chapterNumber },
    },
  });

  return newerChapters < windowSize;
}

/**
 * Decide whether `userId` may open a chapter, consuming a free unlock when
 * needed. Order:
 *   1. premium                         → allow (unlimited)
 *   2. already read this chapter        → allow (free re-read)
 *   3. already unlocked today           → allow (idempotent)
 *   4. one of the newest chapters       → block (subscriber-only window)
 *   5. free tier:
 *      - each account may unlock FREE_CHAPTERS_PER_DAY new chapters a day
 *      - at most FREE_ACCOUNTS_PER_IP_PER_DAY accounts per IP a day use it
 *        (an anti-abuse ceiling; shared IPs stay usable)
 *   6. otherwise                        → block (paywall)
 *
 * Steps 2–3 come first on purpose: a chapter someone has already opened stays
 * open to them even after it is inside the paywalled window.
 *
 * Writes (claim + usage) happen here, so only call it on a real chapter open.
 */
export async function resolveChapterAccess({
  userId,
  chapter,
  premiumUntil,
}: {
  userId: string;
  chapter: {
    id: string;
    mangaId: string;
    chapterNumber: number;
    /** The manga's paywalledChapters column; null uses the site default. */
    paywalledChapters?: number | null;
  };
  premiumUntil: Date | null;
}): Promise<ChapterAccess> {
  const chapterId = chapter.id;

  if (isPremium({ premiumUntil })) {
    return { allowed: true, reason: "premium", isPremium: true, remainingFree: null };
  }

  // Already read before → always free.
  const priorRead = await prisma.readingProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
    select: { id: true },
  });
  if (priorRead) {
    return {
      allowed: true,
      reason: "already_read",
      isPremium: false,
      remainingFree: await remainingFreeToday(userId),
    };
  }

  const dayKey = ulaanbaatarDayKey();

  // Already unlocked today (covers refreshes without double-charging).
  const alreadyToday = await prisma.freeReadUsage.findUnique({
    where: { userId_dayKey_chapterId: { userId, dayKey, chapterId } },
    select: { id: true },
  });
  if (alreadyToday) {
    return {
      allowed: true,
      reason: "already_today",
      isPremium: false,
      remainingFree: await remainingFreeToday(userId, dayKey),
    };
  }

  // The newest chapters are subscriber-only: they are never payable with a
  // free unlock, so this check sits in front of the whole free-tier path.
  if (await isPaywalledLatestChapter(chapter)) {
    return {
      allowed: false,
      reason: "latest_locked",
      isPremium: false,
      remainingFree: await remainingFreeToday(userId, dayKey),
    };
  }

  const ipHash = await getClientIpHash();

  // Check and consume as one serialized step. The advisory locks make a
  // concurrent open (a double tap, two tabs) wait for this one and then see
  // its row, so two chapters cannot both pass the daily check and two
  // accounts cannot both take the IP's last place. The IP lock is always
  // taken first, so two requests cannot deadlock. The insert is also
  // ON CONFLICT DO NOTHING, so even a request that got past the locks could
  // not turn a duplicate into an error page.
  return prisma.$transaction(
    async (tx): Promise<ChapterAccess> => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`free-ip:${ipHash}:${dayKey}`}))`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`free-user:${userId}:${dayKey}`}))`;

      const usedToday = await tx.freeReadUsage.count({
        where: { userId, dayKey },
      });

      // The request we waited for may have just unlocked this very chapter.
      const unlockedMeanwhile = await tx.freeReadUsage.findUnique({
        where: { userId_dayKey_chapterId: { userId, dayKey, chapterId } },
        select: { id: true },
      });
      if (unlockedMeanwhile) {
        return {
          allowed: true,
          reason: "already_today",
          isPremium: false,
          remainingFree: Math.max(0, FREE_CHAPTERS_PER_DAY - usedToday),
        };
      }

      if (usedToday >= FREE_CHAPTERS_PER_DAY) {
        return {
          allowed: false,
          reason: "quota_exhausted",
          isPremium: false,
          remainingFree: 0,
        };
      }

      if (await ipLimitReached(tx, { ipHash, dayKey, userId })) {
        return { allowed: false, reason: "ip_limit", isPremium: false, remainingFree: 0 };
      }

      // Consume one free unlock.
      await tx.freeReadUsage.createMany({
        data: [{ userId, ipHash, dayKey, chapterId }],
        skipDuplicates: true,
      });

      return {
        allowed: true,
        reason: "consumed",
        isPremium: false,
        remainingFree: Math.max(0, FREE_CHAPTERS_PER_DAY - (usedToday + 1)),
      };
    },
    { maxWait: 5_000, timeout: 10_000 },
  );
}

/**
 * True when this IP already has FREE_ACCOUNTS_PER_IP_PER_DAY other accounts
 * using free chapters today. An account already among them keeps its place.
 */
async function ipLimitReached(
  db: Pick<typeof prisma, "freeReadUsage">,
  { ipHash, dayKey, userId }: { ipHash: string; dayKey: string; userId: string },
): Promise<boolean> {
  const accounts = await db.freeReadUsage.findMany({
    where: { ipHash, dayKey },
    distinct: ["userId"],
    select: { userId: true },
  });

  return (
    accounts.length >= FREE_ACCOUNTS_PER_IP_PER_DAY &&
    !accounts.some((row) => row.userId === userId)
  );
}

async function remainingFreeToday(
  userId: string,
  dayKey: string = ulaanbaatarDayKey(),
): Promise<number> {
  const used = await prisma.freeReadUsage.count({ where: { userId, dayKey } });
  return Math.max(0, FREE_CHAPTERS_PER_DAY - used);
}

export type FreeReadState = {
  isPremium: boolean;
  used: number;
  remaining: number;
  /** True when this IP's free-reader places are all taken today. */
  ipLimitReached: boolean;
};

/** Read-only snapshot of the user's free-tier standing today (no writes). */
export async function getFreeReadState(user: {
  id: string;
  premiumUntil: Date | null;
}): Promise<FreeReadState> {
  if (isPremium(user)) {
    return { isPremium: true, used: 0, remaining: 0, ipLimitReached: false };
  }

  const dayKey = ulaanbaatarDayKey();
  const ipHash = await getClientIpHash();

  const [used, ipFull] = await Promise.all([
    prisma.freeReadUsage.count({ where: { userId: user.id, dayKey } }),
    ipLimitReached(prisma, { ipHash, dayKey, userId: user.id }),
  ]);

  const remaining = ipFull ? 0 : Math.max(0, FREE_CHAPTERS_PER_DAY - used);

  return { isPremium: false, used, remaining, ipLimitReached: ipFull };
}

/**
 * Which of `chapterIds` would spend one of the reader's daily free unlocks on
 * their next open — i.e. not already read, not already unlocked today, and not
 * inside the subscriber-only window. Read-only: it never consumes anything, so
 * the UI can put a confirmation in front of the spend.
 */
export async function getFreeSpendChapterIds({
  user,
  chapterIds,
  readChapterIds,
  paywalledChapterIds,
}: {
  user: { id: string; premiumUntil: Date | null } | null;
  chapterIds: string[];
  readChapterIds: Set<string>;
  paywalledChapterIds: Set<string>;
}): Promise<Set<string>> {
  if (!user || isPremium(user) || chapterIds.length === 0) {
    return new Set();
  }

  const candidates = chapterIds.filter(
    (chapterId) =>
      !readChapterIds.has(chapterId) && !paywalledChapterIds.has(chapterId),
  );

  if (candidates.length === 0) {
    return new Set();
  }

  const unlockedToday = await prisma.freeReadUsage.findMany({
    where: {
      userId: user.id,
      dayKey: ulaanbaatarDayKey(),
      chapterId: { in: candidates },
    },
    select: { chapterId: true },
  });
  const unlockedIds = new Set(unlockedToday.map((row) => row.chapterId));

  return new Set(
    candidates.filter((chapterId) => !unlockedIds.has(chapterId)),
  );
}
