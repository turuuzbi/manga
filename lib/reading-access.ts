import { createHash } from "node:crypto";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { FREE_CHAPTERS_PER_DAY, isPremium } from "@/lib/plans";

export type AccessReason =
  | "premium"
  | "already_read"
  | "already_today"
  | "consumed"
  | "ip_claimed"
  | "quota_exhausted";

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
 * Decide whether `userId` may open `chapterId`, consuming a free unlock when
 * needed. Order:
 *   1. premium                         → allow (unlimited)
 *   2. already read this chapter        → allow (free re-read)
 *   3. already unlocked today           → allow (idempotent)
 *   4. free tier (per user + IP claim):
 *      - first account on the IP today claims it; other accounts get 0
 *      - claimant may unlock up to FREE_CHAPTERS_PER_DAY new chapters/day
 *   5. otherwise                        → block (paywall)
 *
 * Writes (claim + usage) happen here, so only call it on a real chapter open.
 */
export async function resolveChapterAccess({
  userId,
  chapterId,
  premiumUntil,
}: {
  userId: string;
  chapterId: string;
  premiumUntil: Date | null;
}): Promise<ChapterAccess> {
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

  const ipHash = await getClientIpHash();

  // Claim the IP's free tier for today. The first account wins; others get 0.
  const claim = await prisma.ipDailyClaim.upsert({
    where: { ipHash_dayKey: { ipHash, dayKey } },
    create: { ipHash, dayKey, userId },
    update: {},
    select: { userId: true },
  });
  if (claim.userId !== userId) {
    return { allowed: false, reason: "ip_claimed", isPremium: false, remainingFree: 0 };
  }

  const usedToday = await prisma.freeReadUsage.count({
    where: { userId, dayKey },
  });
  if (usedToday >= FREE_CHAPTERS_PER_DAY) {
    return {
      allowed: false,
      reason: "quota_exhausted",
      isPremium: false,
      remainingFree: 0,
    };
  }

  // Consume one free unlock (idempotent on the unique key).
  await prisma.freeReadUsage.upsert({
    where: { userId_dayKey_chapterId: { userId, dayKey, chapterId } },
    create: { userId, ipHash, dayKey, chapterId },
    update: {},
  });

  return {
    allowed: true,
    reason: "consumed",
    isPremium: false,
    remainingFree: Math.max(0, FREE_CHAPTERS_PER_DAY - (usedToday + 1)),
  };
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
  /** True when another account already claimed this IP's free tier today. */
  ipClaimedByOther: boolean;
};

/** Read-only snapshot of the user's free-tier standing today (no writes). */
export async function getFreeReadState(user: {
  id: string;
  premiumUntil: Date | null;
}): Promise<FreeReadState> {
  if (isPremium(user)) {
    return { isPremium: true, used: 0, remaining: 0, ipClaimedByOther: false };
  }

  const dayKey = ulaanbaatarDayKey();
  const ipHash = await getClientIpHash();

  const [used, claim] = await Promise.all([
    prisma.freeReadUsage.count({ where: { userId: user.id, dayKey } }),
    prisma.ipDailyClaim.findUnique({
      where: { ipHash_dayKey: { ipHash, dayKey } },
      select: { userId: true },
    }),
  ]);

  const ipClaimedByOther = Boolean(claim && claim.userId !== user.id);
  const remaining = ipClaimedByOther
    ? 0
    : Math.max(0, FREE_CHAPTERS_PER_DAY - used);

  return { isPremium: false, used, remaining, ipClaimedByOther };
}
