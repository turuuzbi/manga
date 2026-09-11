import type { SubscriptionPlan } from "@prisma/client";

export type PlanConfig = {
  plan: SubscriptionPlan;
  /** Length of the granted period, in days. */
  days: number;
  /** Price in MNT (₮), integer. */
  price: number;
  /**
   * Price when renewing while a pass is still active, in MNT. Null for plans
   * the discount excludes.
   *
   * Stored rather than derived: 1 сар is rounded to a clean 5,000₮, not the
   * exact 10% (4,950₮), so a multiplier would give the wrong number. There is
   * deliberately no `* 0.9` anywhere in this codebase.
   */
  renewalPrice: number | null;
  /** Mongolian label shown in the UI. */
  label: string;
};

// Fixed-day durations, confirmed with the client:
//   2 weeks = 14d / 3,000₮ · 1 month = 30d / 5,500₮ (renew 5,000₮)
//   3 months = 90d / 15,000₮ (renew 13,500₮) · 6 months = 180d / 28,000₮ (renew 25,200₮)
export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  // The 2-week plan is excluded from the early-renewal discount.
  TWO_WEEKS: {
    plan: "TWO_WEEKS",
    days: 14,
    price: 3000,
    renewalPrice: null,
    label: "2 долоо хоног",
  },
  ONE_MONTH: {
    plan: "ONE_MONTH",
    days: 30,
    price: 5500,
    renewalPrice: 5000,
    label: "1 сар",
  },
  THREE_MONTHS: {
    plan: "THREE_MONTHS",
    days: 90,
    price: 15000,
    renewalPrice: 13500,
    label: "3 сар",
  },
  SIX_MONTHS: {
    plan: "SIX_MONTHS",
    days: 180,
    price: 28000,
    renewalPrice: 25200,
    label: "6 сар",
  },
};

/** Explains the early-renewal discount. Shared so the surfaces cannot drift. */
export const RENEWAL_DISCOUNT_NOTE =
  "Эрхээ дуусахаас өмнө сунгавал 10% хөнгөлөлттэй";

/** The one exclusion, shown a step smaller beneath the note above. */
export const RENEWAL_DISCOUNT_EXCLUSION = "2 долоо хоногийн багцад хамаарахгүй";

// Display order (cheapest → longest) for plan grids.
export const PLAN_ORDER: SubscriptionPlan[] = [
  "TWO_WEEKS",
  "ONE_MONTH",
  "THREE_MONTHS",
  "SIX_MONTHS",
];

/** Number of free (new) chapters a claiming account gets per Ulaanbaatar day. */
export const FREE_CHAPTERS_PER_DAY = 3;

/**
 * Default number of a series' newest chapters that are subscriber-only, used
 * when a manga has no per-series override. The window rolls forward as
 * chapters publish: with 40 chapters, 36–40 are locked; once 41 lands, 36
 * drops out and becomes part of the daily-free pool again.
 */
export const PAYWALLED_LATEST_CHAPTERS = 5;

/** Largest per-manga paywall window the admin form accepts. */
export const MAX_PAYWALLED_LATEST_CHAPTERS = 100;

/**
 * The paywall window actually in force for a manga: its own setting when the
 * admin has chosen one, otherwise the site default. 0 is meaningful (nothing
 * locked), so only null/undefined falls back.
 */
export function resolvePaywalledChapters(
  paywalledChapters: number | null | undefined,
): number {
  if (typeof paywalledChapters !== "number" || paywalledChapters < 0) {
    return PAYWALLED_LATEST_CHAPTERS;
  }

  return Math.min(paywalledChapters, MAX_PAYWALLED_LATEST_CHAPTERS);
}

export function isValidPlan(value: string): value is SubscriptionPlan {
  return value in PLANS;
}

export function getPlan(plan: SubscriptionPlan): PlanConfig {
  return PLANS[plan];
}

/** Format an MNT amount as e.g. "5,500₮". */
export function formatTugrug(amount: number): string {
  return `${amount.toLocaleString("en-US")}₮`;
}

/**
 * Whole days of subscription left, rounded up so the last partial day still
 * reads as "1 day left". Null when the user has no active subscription.
 */
export function premiumDaysRemaining(
  user: { premiumUntil?: Date | null } | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!user?.premiumUntil) {
    return null;
  }

  const msLeft = user.premiumUntil.getTime() - now.getTime();

  if (msLeft <= 0) {
    return null;
  }

  return Math.ceil(msLeft / 86_400_000);
}

/** True when the user currently has an active subscription. */
export function isPremium(
  user: { premiumUntil?: Date | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  return Boolean(user?.premiumUntil && user.premiumUntil.getTime() > now.getTime());
}

export type ResolvedPrice = {
  /** What to charge, in MNT — the renewal price when the discount applies. */
  price: number;
  /** The undiscounted price, for the struck-through figure beside it. */
  regularPrice: number;
  discounted: boolean;
};

/**
 * The price that applies to a plan right now, given the buyer's own standing.
 *
 * Renewing before a pass lapses earns the discounted price; letting it expire
 * first does not. Callers pass the user and never a price, so an amount from
 * the client can never influence what is charged.
 *
 * Pass the same `now` used to compute an expiry alongside it, so the discount
 * decision and the expiry cannot disagree across a tick.
 */
export function resolvePlanPrice(
  plan: SubscriptionPlan,
  user: { premiumUntil?: Date | null } | null | undefined,
  now: Date = new Date(),
): ResolvedPrice {
  const config = PLANS[plan];
  const renewal = config.renewalPrice;
  const discounted = renewal !== null && isPremium(user, now);

  return {
    price: discounted ? renewal : config.price,
    regularPrice: config.price,
    discounted,
  };
}

/**
 * Extend an existing expiry by a plan's duration. Re-purchases stack: we grow
 * from whichever is later — the current expiry or now.
 */
export function extendExpiry(
  currentExpiry: Date | null | undefined,
  plan: SubscriptionPlan,
  now: Date = new Date(),
): Date {
  const base =
    currentExpiry && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + PLANS[plan].days);
  return next;
}
