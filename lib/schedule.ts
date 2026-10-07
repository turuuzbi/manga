/**
 * Helpers for the weekly "Хуваарь" release schedule. No server imports, so the
 * public page, its client parts and the admin panel all share them.
 *
 * A schedule row lists the weekdays a series comes out on, every week, as ISO
 * numbers: 1 = Monday … 7 = Sunday. "Today" is always Ulaanbaatar's day,
 * wherever the server or reader is.
 */

const TIME_ZONE = "Asia/Ulaanbaatar";

/** Monday first, the order the page and the admin panel show them in. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const WEEKDAY_NAMES: Record<number, { long: string; short: string }> = {
  1: { long: "Даваа", short: "Да" },
  2: { long: "Мягмар", short: "Мя" },
  3: { long: "Лхагва", short: "Лх" },
  4: { long: "Пүрэв", short: "Пү" },
  5: { long: "Баасан", short: "Ба" },
  6: { long: "Бямба", short: "Бя" },
  7: { long: "Ням", short: "Ня" },
};

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
});
const ENGLISH_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Today's weekday in Ulaanbaatar, 1 = Monday … 7 = Sunday. */
export function scheduleTodayWeekday(now: Date = new Date()): number {
  return ENGLISH_SHORT.indexOf(weekdayFormatter.format(now)) + 1;
}

/** "Даваа", or "Да" with `short`. */
export function weekdayName(weekday: number, short = false): string {
  const names = WEEKDAY_NAMES[weekday];
  return names ? (short ? names.short : names.long) : "";
}

/** Valid weekdays only, ascending, each once. */
export function normalizeWeekdays(values: unknown): number[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values.filter((value): value is number =>
    Number.isInteger(value) && value >= 1 && value <= 7,
  ))].sort((left, right) => left - right);
}

export const SCHEDULE_HREF = "/schedule";
