import { type Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { mongolianLocalization } from "@/lib/clerk-auth-ui";
import {
  DEFAULT_THEME,
  SEASONAL_CONFIG,
  THEMES,
  THEME_STORAGE_KEY,
} from "@/lib/theme";
import { USER_BG_STORAGE_KEY } from "@/lib/news-client";
import { NewsNotifier } from "@/app/_components/NewsNotifier";
import "./globals.css";

/**
 * Display face for the autumn theme's headings (see app/themes/autumn.css).
 * `cyrillic` and `cyrillic-ext` are what carry Mongolian Ө/ө/Ү/ү. `preload` is
 * off so no theme pays for it up front: the browser fetches a file only when an
 * autumn heading actually draws a glyph from it.
 */
const display = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ЮҮМЭ Орчуулагч",
  description: "Монгол хэл дээрх манга, манхва унших сан.",
};

/**
 * Deliberately free of `auth()` and any database access. This layout wraps every
 * route, so a call here would cost a round trip on every request — and would opt
 * the whole app out of static rendering. Pages that show the floating account
 * dock render it themselves with the admin flag they already have.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      localization={mongolianLocalization as never}
    >
      <html lang="en" className={display.variable} suppressHydrationWarning>
        <body className="antialiased">
          {/* Runs before paint so the saved theme is on <html> for the first
              frame — otherwise the page flashes light before hydration. The
              theme list comes from lib/theme so it cannot drift from the
              header's cycle order. The seasonal rule (isAutumnEnabled in
              lib/theme) is repeated here from the same config, because the
              date has to be read in the browser: this layout is static. The
              reader's applied background (cached by lib/news-client) goes on
              in the same pass for the same reason. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var themes = ${JSON.stringify(THEMES)};
                  var season = ${JSON.stringify(SEASONAL_CONFIG)};
                  var month = new Date(Date.now() + season.offsetHours * 36e5).getUTCMonth();
                  var autumn =
                    season.setting === "autumn" ||
                    (season.setting === "auto" && season.months.indexOf(month) !== -1);
                  var saved = null;
                  try { saved = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch (error) {}
                  var theme =
                    themes.indexOf(saved) === -1 || (saved === "autumn" && !autumn)
                      ? (autumn ? "autumn" : ${JSON.stringify(DEFAULT_THEME)})
                      : saved;
                  document.documentElement.dataset.theme = theme;
                  if (autumn) document.documentElement.dataset.season = "autumn";
                  var bg = window.localStorage.getItem(${JSON.stringify(USER_BG_STORAGE_KEY)});
                  if (bg && /^https:\\/\\//.test(bg)) {
                    document.documentElement.style.setProperty(
                      "--user-bg-image",
                      'url("' + bg.replace(/["\\\\\\n\\r]/g, "") + '")'
                    );
                    document.documentElement.dataset.userBg = "on";
                  }
                } catch (error) {}
              `,
            }}
          />
          {children}
          {/* Client-only: fetches its own state after load, so this layout
              stays free of auth() and database access. */}
          <NewsNotifier />
        </body>
      </html>
    </ClerkProvider>
  );
}
