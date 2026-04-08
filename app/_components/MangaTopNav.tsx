"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
  X,
} from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

type NavLink = {
  label: string;
  href: string;
};

const defaultLinks: NavLink[] = [
  { label: "Library", href: "/#library" },
  { label: "Mangas", href: "/manga" },
  { label: "Hot Pick", href: "/#featured" },
];

function isLinkActive(pathname: string, href: string) {
  if (href === "/manga") {
    return pathname === "/manga" || pathname.startsWith("/manga/");
  }

  if (href.startsWith("/#")) {
    return pathname === "/";
  }

  return pathname === href;
}

export function MangaTopNav({
  navLinks = defaultLinks,
  searchPlaceholder = "Search series…",
  showSearch = true,
  isAdmin = false,
}: {
  navLinks?: NavLink[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const subscribeToTheme = useCallback((callback: () => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const notify = () => callback();

    window.addEventListener("storage", notify);
    window.addEventListener("yume-theme-change", notify as EventListener);

    return () => {
      window.removeEventListener("storage", notify);
      window.removeEventListener("yume-theme-change", notify as EventListener);
    };
  }, []);

  const theme = useSyncExternalStore(
    subscribeToTheme,
    () =>
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    () => "light",
  );

  const themeLabel = useMemo(
    () => (theme === "dark" ? "Switch to light mode" : "Switch to dark mode"),
    [theme],
  );

  function applyTheme(nextTheme: "light" | "dark") {
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("yume-theme", nextTheme);
    window.dispatchEvent(new Event("yume-theme-change"));
  }

  function renderThemeButton() {
    return (
      <button
        type="button"
        onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
        aria-label={themeLabel}
        title={themeLabel}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition hover:-translate-x-px hover:-translate-y-px"
        style={{
          borderColor: "var(--manga-border)",
          background: "var(--manga-paper)",
          color: "var(--manga-text)",
          boxShadow: "2px 2px 0 var(--manga-shadow)",
        }}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  return (
    <nav
      className="motion-ink-fade sticky top-0 z-50 border-b-[3px]"
      style={{
        background: "var(--manga-nav-bg)",
        borderColor: "var(--manga-border)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8"
        style={{ position: "relative", zIndex: 1 }}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 no-underline"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="border-2 px-2.5 py-0.5"
            style={{
              borderColor: "var(--manga-border)",
              background:
                "linear-gradient(135deg, var(--manga-brand-a) 0%, var(--manga-brand-b) 58%, var(--manga-brand-c) 100%)",
              boxShadow: "2px 2px 0 var(--manga-shadow)",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: 22,
                lineHeight: 1.3,
                display: "block",
                fontFamily: '"Noto Sans JP", sans-serif',
                fontWeight: 900,
              }}
            >
              ユーメ
            </span>
          </div>
          <span
            style={{
              fontSize: 21,
              color: "var(--manga-text)",
              fontFamily: '"Bangers", cursive',
              letterSpacing: "0.05em",
            }}
          >
            MANGA
          </span>
        </Link>

        <div
          className="hidden items-center gap-8 md:flex"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {navLinks.map((entry) => {
            const active = isLinkActive(pathname, entry.href);

            return (
              <Link
                key={entry.label}
                href={entry.href}
                className="nav-link"
                style={{
                  color: active ? "var(--manga-text)" : "var(--manga-muted)",
                  textDecoration: "none",
                }}
              >
                {entry.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {renderThemeButton()}

          {showSearch ? (
            <div className="relative hidden items-center md:flex">
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 10,
                  color: "var(--manga-muted-2)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="yu-search"
                style={{
                  width: searchFocused ? 200 : 150,
                  transition: "all 0.25s",
                }}
              />
            </div>
          ) : null}

          <SignedIn>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:-translate-x-px hover:-translate-y-px"
                  style={{
                    borderColor: "var(--manga-border)",
                    background: "var(--manga-paper)",
                    color: "var(--manga-text)",
                    boxShadow: "2px 2px 0 var(--manga-shadow)",
                  }}
                >
                  <Shield size={14} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              ) : null}

              <UserButton
                showName={false}
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "h-9 w-9 rounded-full ring-2 ring-[color:var(--manga-border)]/20 shadow-none",
                    userButtonTrigger:
                      "rounded-full border-2 border-[var(--manga-border)] bg-[var(--manga-paper)] px-0 py-0 text-[var(--manga-text)] hover:bg-[var(--manga-paper-2)] focus:shadow-none",
                    userButtonPopoverCard:
                      "border-2 border-[var(--manga-border)] bg-[var(--manga-paper)] text-[var(--manga-text)] shadow-2xl",
                    userButtonPopoverFooter: "border-[var(--manga-border)]/15",
                    userButtonBox: "gap-0",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <div className="hidden items-center gap-2 md:flex">
              <SignInButton>
                <button className="yu-btn yu-btn-paper">Sign In</button>
              </SignInButton>
              <SignUpButton>
                <button className="yu-btn yu-btn-ink">Join Free</button>
              </SignUpButton>
            </div>
          </SignedOut>

          <button
            type="button"
            className="p-2 md:hidden"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--manga-text)",
            }}
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div
          className="flex flex-col gap-4 px-5 py-4 md:hidden"
          style={{ borderTop: "2px solid var(--manga-border)" }}
        >
          {navLinks.map((entry) => (
            <Link
              key={entry.label}
              href={entry.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--manga-muted)",
                textDecoration: "none",
              }}
            >
              {entry.label}
            </Link>
          ))}

          {showSearch ? (
            <div className="relative">
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 10,
                  top: 11,
                  color: "var(--manga-muted-2)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="yu-search w-full"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <span
              className="text-[11px] font-bold uppercase"
              style={{
                letterSpacing: "0.18em",
                color: "var(--manga-muted-2)",
              }}
            >
              Theme
            </span>
            {renderThemeButton()}
          </div>

          <SignedIn>
            <div className="flex items-center gap-3 pt-1">
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-2 text-sm font-semibold no-underline"
                  style={{ color: "var(--manga-text)" }}
                >
                  <Shield size={15} />
                  Admin Panel
                </Link>
              ) : null}
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex gap-3 pt-1">
              <SignInButton>
                <button className="yu-btn yu-btn-paper">Sign In</button>
              </SignInButton>
              <SignUpButton>
                <button className="yu-btn yu-btn-ink">Join Free</button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      ) : null}
    </nav>
  );
}
