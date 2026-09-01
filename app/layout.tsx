import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { mongolianLocalization } from "@/lib/clerk-auth-ui";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

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
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          {/* Runs before paint so the saved theme is on <html> for the first
              frame — otherwise the page flashes light before hydration. The
              theme list comes from lib/theme so it cannot drift from the
              header's cycle order. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var themes = ${JSON.stringify(THEMES)};
                  var saved = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
                  document.documentElement.dataset.theme =
                    themes.indexOf(saved) === -1 ? ${JSON.stringify(DEFAULT_THEME)} : saved;
                } catch (error) {}
              `,
            }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
