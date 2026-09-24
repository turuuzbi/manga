/**
 * Mongolian relative times ("8 өдрийн өмнө", "3 цагийн өмнө", "өчигдөр") and
 * dates ("2026 оны 9-р сарын 25"), straight from the platform's CLDR data so
 * the wording is the standard one. Computed on the server and sent as text,
 * so the browser never re-renders a different label during hydration.
 */

const relative = new Intl.RelativeTimeFormat("mn", { numeric: "auto" });
const dateFormat = new Intl.DateTimeFormat("mn", {
  dateStyle: "medium",
  timeZone: "Asia/Ulaanbaatar",
});

export function formatRelativeMn(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);

  if (Math.abs(seconds) < 60) {
    return relative.format(0, "second");
  }

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return relative.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return relative.format(hours, "hour");
  }

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) {
    return relative.format(days, "day");
  }

  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) {
    return relative.format(months, "month");
  }

  return relative.format(Math.round(days / 365), "year");
}

export function formatDateMn(date: Date): string {
  return dateFormat.format(date);
}
