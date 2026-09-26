/**
 * Date helpers for the "Хуваарь" release schedule. No server imports, so the
 * public page, its client parts and the admin panel all share them.
 *
 * A schedule date is a calendar day with no time (ScheduleEntry.date is a
 * Postgres DATE). Prisma hands a DATE back as midnight UTC, so days travel as
 * "YYYY-MM-DD" keys and are only turned into a Date at the database edge.
 * "Today" is always Ulaanbaatar's day, wherever the server or reader is.
 */

const TIME_ZONE = "Asia/Ulaanbaatar";
const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_KEY = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MIN_YEAR = 2020;
const MAX_YEAR = 2100;

/** Sunday first, matching Date#getUTCDay. */
const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today in Ulaanbaatar as "YYYY-MM-DD". */
export function scheduleTodayKey(now: Date = new Date()): string {
  return dayFormatter.format(now);
}

/** This month in Ulaanbaatar as "YYYY-MM". */
export function currentMonthKey(now: Date = new Date()): string {
  return scheduleTodayKey(now).slice(0, 7);
}

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const match = MONTH_KEY.exec(key);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);

  if (year < MIN_YEAR || year > MAX_YEAR) {
    return null;
  }

  return { year, month: Number(match[2]) };
}

/** A real calendar day ("2026-02-30" is not). */
export function isDayKey(value: string): boolean {
  const match = DAY_KEY.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);

  return (
    year >= MIN_YEAR &&
    year <= MAX_YEAR &&
    dayKeyToDate(value).toISOString().slice(0, 10) === value
  );
}

/** The DATE column's value for a day key (midnight UTC). */
export function dayKeyToDate(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00.000Z`);
}

export function dateToDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthKeyOf(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** The month `delta` months away ("2026-12", +1 → "2027-01"). */
export function shiftMonth(key: string, delta: number): string {
  const parsed = parseMonthKey(key) ?? parseMonthKey(currentMonthKey())!;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + delta, 1));

  return monthKeyOf(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

/** First and last day keys of a month. */
export function monthBounds(key: string): { first: string; last: string } {
  const { year, month } = parseMonthKey(key) ?? parseMonthKey(currentMonthKey())!;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = monthKeyOf(year, month);

  return { first: `${prefix}-01`, last: `${prefix}-${String(lastDay).padStart(2, "0")}` };
}

/** Database range for a month: date >= start and date < end. */
export function monthDateRange(key: string): { start: Date; end: Date } {
  return {
    start: dayKeyToDate(`${key}-01`),
    end: dayKeyToDate(`${shiftMonth(key, 1)}-01`),
  };
}

/** The day `delta` days away. */
export function addDays(dayKey: string, delta: number): string {
  const date = dayKeyToDate(dayKey);
  date.setUTCDate(date.getUTCDate() + delta);

  return dateToDayKey(date);
}

/** "2026 оны 10-р сар" */
export function monthLabel(key: string): string {
  const parsed = parseMonthKey(key);

  return parsed ? `${parsed.year} оны ${parsed.month}-р сар` : key;
}

export function weekdayLabel(dayKey: string): string {
  return WEEKDAYS[dayKeyToDate(dayKey).getUTCDay()];
}

/** "10-р сарын 3, Бямба" */
export function dayLabel(dayKey: string): string {
  const month = Number(dayKey.slice(5, 7));
  const day = Number(dayKey.slice(8, 10));

  return `${month}-р сарын ${day}, ${weekdayLabel(dayKey)}`;
}

export const SCHEDULE_HREF = "/schedule";

export function scheduleMonthHref(key: string): string {
  return `${SCHEDULE_HREF}/${key}`;
}
