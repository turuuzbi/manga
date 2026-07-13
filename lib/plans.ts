import type { SubscriptionPlan } from "@prisma/client";

export type PlanConfig = {
  plan: SubscriptionPlan;
  /** Length of the granted period, in days. */
  days: number;
  /** Price in MNT (₮), integer. */
  price: number;
  /** Mongolian label shown in the UI. */
  label: string;
};

// Fixed-day durations, confirmed with the client:
//   2 weeks = 14d / 3,000₮ · 1 month = 30d / 5,500₮
//   3 months = 90d / 15,000₮ · 6 months = 180d / 28,000₮
export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  TWO_WEEKS: { plan: "TWO_WEEKS", days: 14, price: 3000, label: "2 долоо хоног" },
  ONE_MONTH: { plan: "ONE_MONTH", days: 30, price: 5500, label: "1 сар" },
  THREE_MONTHS: { plan: "THREE_MONTHS", days: 90, price: 15000, label: "3 сар" },
  SIX_MONTHS: { plan: "SIX_MONTHS", days: 180, price: 28000, label: "6 сар" },
};

// Display order (cheapest → longest) for plan grids.
export const PLAN_ORDER: SubscriptionPlan[] = [
  "TWO_WEEKS",
  "ONE_MONTH",
  "THREE_MONTHS",
  "SIX_MONTHS",
];

/** Number of free (new) chapters a claiming account gets per Ulaanbaatar day. */
export const FREE_CHAPTERS_PER_DAY = 3;

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

/** True when the user currently has an active subscription. */
export function isPremium(
  user: { premiumUntil?: Date | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  return Boolean(user?.premiumUntil && user.premiumUntil.getTime() > now.getTime());
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
