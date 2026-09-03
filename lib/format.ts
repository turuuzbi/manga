/**
 * Compact count for display: 1,234 / 12.4K / 1.2M.
 *
 * Grouped separators are kept below 10,000 rather than compacting everything,
 * so a series with 1,234 readers reads exactly instead of blurring to "1.2K".
 * Above that the digits stop carrying meaning and the short form is easier to
 * scan. A single decimal is shown only when it is not zero, so 12,000 renders
 * "12K" rather than "12.0K".
 *
 * Not `Intl.NumberFormat` with `notation: "compact"`: that rounds 1,234 to
 * "1.2K", which contradicts the exact band above.
 */
export function formatCompactCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  const count = Math.floor(value);

  if (count < 10_000) {
    return count.toLocaleString("en-US");
  }

  const [divisor, suffix] =
    count < 1_000_000 ? ([1_000, "K"] as const) : ([1_000_000, "M"] as const);

  // Truncate rather than round, so a number never reads as more than it is.
  const scaled = Math.floor((count / divisor) * 10) / 10;

  return `${Number.isInteger(scaled) ? scaled : scaled.toFixed(1)}${suffix}`;
}
