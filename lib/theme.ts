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
  return THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
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
  return isTheme(applied) ? applied : DEFAULT_THEME;
}
