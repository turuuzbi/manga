/**
 * The site's themes, in the order the header button cycles through them.
 *
 * `light` and `dark` are the originals; `autumn` is the seasonal skin drawn
 * from the pressed-leaf frame — same layout and components, warm cream paper,
 * maple accents, plus the leaf/sun ornaments in `CelestialFrame`.
 *
 * Every theme is applied the same way: `data-theme` on `<html>`, read by the
 * token blocks in `globals.css` and in `HomeLanding`'s scoped styles. Nothing
 * branches on the theme in JavaScript beyond the button itself.
 */
export const THEMES = ["light", "autumn", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "light";

/**
 * Whether the autumn skin is on offer — the one switch for the whole feature.
 *
 * `NEXT_PUBLIC_SEASONAL_THEME`:
 *   - `auto` (default): on from 1 Oct to 30 Nov, Asia/Ulaanbaatar time
 *   - `autumn`: always on
 *   - `off`: never; autumn leaves the header cycle and a saved choice of it
 *     falls back to light
 *
 * While it is on, autumn is also the theme a visitor gets before they have
 * picked one themselves. An explicit pick (saved by the header button) always
 * wins, so someone who chose light or dark keeps it all season.
 *
 * This is evaluated at runtime, not build time: the layout is statically
 * rendered, so a build-time date check would freeze whichever day the deploy
 * happened. The root layout's pre-paint script runs the same rule from
 * `SEASONAL_CONFIG`, so first paint and React agree.
 */
export type SeasonalSetting = "auto" | "autumn" | "off";

export function parseSeasonalSetting(value: string | undefined): SeasonalSetting {
  return value === "autumn" || value === "off" ? value : "auto";
}

export const SEASONAL_SETTING = parseSeasonalSetting(
  // Must stay a literal `process.env.NEXT_PUBLIC_…` read so Next inlines it.
  process.env.NEXT_PUBLIC_SEASONAL_THEME,
);

/** Mongolia has no DST, so a fixed offset is exact. */
const ULAANBAATAR_UTC_OFFSET_HOURS = 8;
/** getUTCMonth() values: October and November. */
const AUTUMN_MONTHS = [9, 10];

/** Everything the pre-paint script needs to repeat the rule above. */
export const SEASONAL_CONFIG = {
  setting: SEASONAL_SETTING,
  offsetHours: ULAANBAATAR_UTC_OFFSET_HOURS,
  months: AUTUMN_MONTHS,
};

export function isAutumnEnabled(now: Date = new Date()): boolean {
  if (SEASONAL_SETTING === "autumn") return true;
  if (SEASONAL_SETTING === "off") return false;

  const ulaanbaatar = new Date(
    now.getTime() + ULAANBAATAR_UTC_OFFSET_HOURS * 3_600_000,
  );
  return AUTUMN_MONTHS.includes(ulaanbaatar.getUTCMonth());
}

/** The themes the header can cycle through right now. */
export function availableThemes(now: Date = new Date()): Theme[] {
  const autumn = isAutumnEnabled(now);
  return THEMES.filter((theme) => theme !== "autumn" || autumn);
}

/** What a visitor with no saved choice sees. */
export function resolveDefaultTheme(now: Date = new Date()): Theme {
  return isAutumnEnabled(now) ? "autumn" : DEFAULT_THEME;
}

export const THEME_STORAGE_KEY = "yume-theme";

/** Same-tab notification; `storage` only fires in *other* tabs. */
export const THEME_CHANGE_EVENT = "yume-theme-change";

export const THEME_LABELS: Record<Theme, string> = {
  light: "Гэгээн",
  autumn: "Намар",
  dark: "Шөнө",
};

export function isTheme(value: unknown): value is Theme {
  return (
    typeof value === "string" && (THEMES as readonly string[]).includes(value)
  );
}

export function nextTheme(current: Theme): Theme {
  const cycle = availableThemes();
  const index = cycle.indexOf(current);
  // A current theme that has left the cycle (autumn after the season) starts
  // the cycle over rather than stalling on it.
  return cycle[(index + 1) % cycle.length];
}

/**
 * Switch the theme: paint it, remember it, and tell this tab's listeners.
 *
 * Lives here rather than inside the header component because it writes to
 * `document`, and the React Compiler's immutability rule rejects mutating a
 * value from outside the component within one. Call it only from an event
 * handler.
 */
export function applyTheme(target: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = target;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, target);
  } catch {
    // Private browsing or blocked storage: the theme still applies to this
    // page, it just will not survive a reload.
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** The theme currently painted on `<html>`, for `useSyncExternalStore`. */
export function readAppliedTheme(): Theme {
  if (typeof document === "undefined") {
    return DEFAULT_THEME;
  }

  const applied = document.documentElement.dataset.theme;
  return isTheme(applied) ? applied : resolveDefaultTheme();
}
