import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { mongolianLocalization } from "@/lib/clerk-auth-ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "ЮУМЭ Орчуулагч",
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
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var savedTheme = window.localStorage.getItem("yume-theme");
                  var theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
                  document.documentElement.dataset.theme = theme;
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
