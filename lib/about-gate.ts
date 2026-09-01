/**
 * The "Бидний тухай" page stays locked behind a countdown until this instant.
 *
 * Written with an explicit +08:00 offset rather than a bare date string so it
 * means 20:00 in Ulaanbaatar for everyone — a bare "2026-09-02T20:00:00" would
 * be read in whatever zone the server happens to run in (Vercel runs UTC), and
 * the page would unlock eight hours early.
 */
export const ABOUT_UNLOCK_AT = new Date("2026-09-02T20:00:00+08:00");

/**
 * Shown under the countdown. Hardcoded rather than formatted at runtime so the
 * server and the browser cannot disagree about locale or time zone.
 */
export const ABOUT_UNLOCK_LABEL = "9 сарын 2, 20:00 цагт нээгдэнэ";

/**
 * Whether the page is still locked, and by how much.
 *
 * The clock is read here rather than in the page body: `Date.now()` is impure,
 * and the React Compiler's purity rule rejects calling it during render.
 */
export function getAboutGateState(now: Date = new Date()): {
  locked: boolean;
  remainingMs: number;
} {
  const remainingMs = ABOUT_UNLOCK_AT.getTime() - now.getTime();

  return { locked: remainingMs > 0, remainingMs };
}
