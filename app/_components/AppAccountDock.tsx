"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { BookOpenText, Shield } from "lucide-react";

export function AppAccountDock({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const isReader = pathname.startsWith("/reader");
  const isAdminPage = pathname.startsWith("/admin");
  const isHome = pathname === "/";
  const usesSharedTopNav = isHome || pathname.startsWith("/manga/");

  if (isReader || usesSharedTopNav) {
    return null;
  }

  return (
    <div
      className={`motion-ink-up fixed right-3 z-[90] max-w-[calc(100vw-1rem)] sm:right-5 ${
        isHome ? "top-2.5 sm:top-4" : "top-3 sm:top-4"
      }`}
    >
      <div
        className="flex items-center gap-1.5 rounded-full p-1 pr-1.5 backdrop-blur-xl sm:gap-2 sm:p-1.5 sm:pr-2"
        style={{
          border: "1px solid color-mix(in srgb, var(--manga-border) 18%, transparent)",
          background: "color-mix(in srgb, var(--manga-paper) 82%, transparent)",
          color: "var(--manga-text)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
        }}
      >
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full transition sm:h-10 sm:w-10"
          style={{
            border: "1px solid color-mix(in srgb, var(--manga-border) 16%, transparent)",
            background: "color-mix(in srgb, var(--manga-paper-2) 72%, transparent)",
            color: "var(--manga-text)",
          }}
          aria-label="Go home"
        >
          <BookOpenText size={17} />
        </Link>

        <SignedIn>
          <div
            className="flex items-center gap-1.5 rounded-full px-1.5 py-1 sm:gap-2 sm:px-2"
            style={{
              border: "1px solid color-mix(in srgb, var(--manga-border) 16%, transparent)",
              background: "color-mix(in srgb, var(--manga-paper-2) 72%, transparent)",
              color: "var(--manga-text)",
            }}
          >
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition sm:px-3 sm:text-xs"
                style={
                  isAdminPage
                    ? {
                        borderColor: "var(--manga-accent)",
                        background: "color-mix(in srgb, var(--manga-accent) 16%, transparent)",
                        color: "var(--manga-text)",
                      }
                    : {
                        borderColor:
                          "color-mix(in srgb, var(--manga-border) 16%, transparent)",
                        background:
                          "color-mix(in srgb, var(--manga-paper) 60%, transparent)",
                        color: "var(--manga-text)",
                      }
                }
              >
                <Shield size={14} />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            ) : null}

            <UserButton
              showName={!isReader && !isHome}
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "h-9 w-9 rounded-full ring-2 ring-[color:var(--manga-border)]/15 shadow-none",
                  userButtonTrigger:
                    "rounded-full border border-[var(--manga-border)]/10 bg-transparent px-0 py-0 text-[var(--manga-text)] hover:bg-[var(--manga-paper)]/40 focus:shadow-none",
                  userButtonOuterIdentifier:
                    "hidden xl:block max-w-[90px] truncate text-sm font-medium text-[var(--manga-text)]",
                  userButtonBox: "gap-2",
                  userButtonPopoverCard:
                    "border border-[var(--manga-border)]/10 bg-[var(--manga-paper)] text-[var(--manga-text)] shadow-2xl",
                  userButtonPopoverFooter: "border-[var(--manga-border)]/10",
                },
              }}
            />
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
