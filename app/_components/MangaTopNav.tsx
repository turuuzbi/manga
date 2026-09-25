"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, ImageIcon, Leaf, Menu, Moon, Search, Shield, Sun, X } from "lucide-react";
import { useNewsState } from "@/app/_components/NewsNotifier";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import {
  DEFAULT_THEME,
  THEME_CHANGE_EVENT,
  THEME_LABELS,
  applyTheme,
  nextTheme,
  readAppliedTheme,
  type Theme,
} from "@/lib/theme";

/** The button shows the theme it will switch *to*, so the icon is the destination. */
const THEME_ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  autumn: Leaf,
  dark: Moon,
};

type NavLink = {
  label: string;
  href: string;
};

export const NEWS_HREF = "/news";

const defaultLinks: NavLink[] = [
  { label: "Онцлох", href: "/#featured" },
  { label: "Сан", href: "/manga" },
  { label: "Мэдээ", href: NEWS_HREF },
];

function isLinkActive(pathname: string, href: string) {
  if (href === "/manga") {
    return pathname === "/manga" || pathname.startsWith("/manga/");
  }

  if (href === NEWS_HREF) {
    return pathname === NEWS_HREF || pathname.startsWith(`${NEWS_HREF}/`);
  }

  if (href.startsWith("/#")) {
    return pathname === "/";
  }

  return pathname === href;
}

export function MangaTopNav({
  navLinks = defaultLinks,
  searchPlaceholder = "Цуврал, зохиолч хайх...",
  showSearch = true,
  isAdmin: isAdminProp,
  overlay = false,
  premiumDaysLeft: premiumDaysLeftProp,
}: {
  navLinks?: NavLink[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  /**
   * Server-rendered pages pass this. Cached pages (/news, /updates, the
   * library) leave it out, and the menu takes it from the per-page status
   * call instead — they are the same for everyone, so they cannot know.
   */
  isAdmin?: boolean;
  /**
   * When true the header floats transparently over a full-bleed hero on
   * phones/tablets (see `.yume-nav-overlay`), staying a solid bar on desktop.
   */
  overlay?: boolean;
  /**
   * Days left on the reader's subscription, or null when they have none. Drives
   * the "Эрх авах" entry's subtitle. Left out (undefined) on cached pages, like
   * isAdmin.
   */
  premiumDaysLeft?: number | null;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const news = useNewsState();
  const { unreadCount } = news;
  const isAdmin = isAdminProp ?? news.isAdmin;
  const premiumDaysLeft =
    premiumDaysLeftProp === undefined ? news.premiumDaysLeft : premiumDaysLeftProp;
  const unreadLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  const subscribeToTheme = useCallback((callback: () => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const notify = () => callback();

    window.addEventListener("storage", notify);
    window.addEventListener(THEME_CHANGE_EVENT, notify as EventListener);

    return () => {
      window.removeEventListener("storage", notify);
      window.removeEventListener(THEME_CHANGE_EVENT, notify as EventListener);
    };
  }, []);

  const theme = useSyncExternalStore<Theme>(
    subscribeToTheme,
    readAppliedTheme,
    () => DEFAULT_THEME,
  );

  const upcoming = nextTheme(theme);
  const themeLabel = useMemo(
    () => `${THEME_LABELS[upcoming]} загварт шилжих`,
    [upcoming],
  );

  const accessLabel =
    typeof premiumDaysLeft === "number"
      ? `${premiumDaysLeft} хоног үлдсэн`
      : "Эрх авах";

  function renderThemeButton() {
    const Icon = THEME_ICON[upcoming];

    return (
      <button
        type="button"
        onClick={() => applyTheme(upcoming)}
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
        <Icon size={16} />
      </button>
    );
  }

  return (
    <nav
      className={`motion-ink-fade sticky top-0 z-50 ${
        overlay ? "yume-nav-overlay" : "border-b-[3px]"
      }`}
      style={
        overlay
          ? undefined
          : {
              background: "var(--manga-nav-bg)",
              borderColor: "var(--manga-border)",
              backdropFilter: "blur(14px)",
            }
      }
    >
      <div
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8"
        style={{ position: "relative", zIndex: 1 }}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center no-underline"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="ЮҮМЭ Орчуулагч — Нүүр"
        >
          <img
            src="/yume-logo.jpeg"
            alt="ЮҮМЭ Орчуулагч"
            width={1688}
            height={2048}
            className="block h-12 w-auto rounded-xl border-2 object-contain transition hover:-translate-x-px hover:-translate-y-px"
            style={{
              background: "#000",
              borderColor: "var(--manga-border)",
              boxShadow: "2px 2px 0 var(--manga-shadow)",
            }}
          />
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
                className="nav-link inline-flex items-center gap-1.5"
                style={{
                  color: active ? "var(--manga-text)" : "var(--manga-muted)",
                  textDecoration: "none",
                }}
              >
                {entry.label}
                {entry.href === NEWS_HREF && unreadCount > 0 ? (
                  <span
                    className="yume-unread"
                    aria-label={`${unreadCount} шинэ мэдээ`}
                  >
                    {unreadLabel}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <Link
            href="/subscribe"
            className="nav-link inline-flex items-center gap-1.5"
            style={{
              color:
                typeof premiumDaysLeft === "number"
                  ? "var(--manga-text)"
                  : "var(--manga-accent)",
              textDecoration: "none",
            }}
          >
            <Crown size={13} />
            {accessLabel}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {renderThemeButton()}

          {showSearch ? (
            <form
              action="/manga"
              role="search"
              className="relative hidden items-center md:flex"
            >
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 12,
                  color: "var(--manga-muted-2)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="search"
                name="q"
                aria-label="Хайх"
                placeholder={searchPlaceholder}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="yu-search"
                style={{
                  width: searchFocused ? 220 : 160,
                  transition: "width 0.25s",
                }}
              />
            </form>
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
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Миний background"
                    labelIcon={<ImageIcon size={14} />}
                    href="/profile"
                  />
                </UserButton.MenuItems>
              </UserButton>
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
            className="relative p-2 md:hidden"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--manga-text)",
            }}
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label={
              (mobileMenuOpen ? "Close menu" : "Open menu") +
              (unreadCount > 0 ? ` — ${unreadCount} шинэ мэдээ` : "")
            }
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            {unreadCount > 0 && !mobileMenuOpen ? (
              <span className="yume-unread yume-unread-float" aria-hidden="true">
                {unreadLabel}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div
          className="flex flex-col gap-4 px-5 py-4 md:hidden"
          style={{
            borderTop: "2px solid var(--manga-border)",
            background: "var(--manga-nav-bg)",
            backdropFilter: "blur(14px)",
          }}
        >
          {navLinks.map((entry) => (
            <Link
              key={entry.label}
              href={entry.href}
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--manga-muted)",
                textDecoration: "none",
              }}
            >
              {entry.label}
              {entry.href === NEWS_HREF && unreadCount > 0 ? (
                <span
                  className="yume-unread"
                  aria-label={`${unreadCount} шинэ мэдээ`}
                >
                  {unreadLabel}
                </span>
              ) : null}
            </Link>
          ))}

          <SignedIn>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--manga-muted)",
                textDecoration: "none",
              }}
            >
              <ImageIcon size={15} />
              Миний background
            </Link>
          </SignedIn>

          <Link
            href="/subscribe"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5"
            style={{
              border: "2px solid var(--manga-border)",
              background: "var(--manga-paper)",
              boxShadow: "2px 2px 0 var(--manga-shadow)",
              textDecoration: "none",
            }}
          >
            <span
              className="inline-flex items-center gap-2"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--manga-text)",
              }}
            >
              <Crown size={15} />
              Эрх авах
            </span>
            {typeof premiumDaysLeft === "number" ? (
              <span
                className="rounded-full px-2.5 py-1"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                  background: "var(--manga-accent)",
                  whiteSpace: "nowrap",
                }}
              >
                {premiumDaysLeft} хоног үлдсэн
              </span>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--manga-muted-2)",
                  whiteSpace: "nowrap",
                }}
              >
                Багц идэвхгүй
              </span>
            )}
          </Link>

          {showSearch ? (
            <form action="/manga" role="search" className="relative">
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  color: "var(--manga-muted-2)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="search"
                name="q"
                aria-label="Хайх"
                placeholder={searchPlaceholder}
                className="yu-search w-full"
              />
            </form>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <span className="flex flex-col gap-0.5">
              <span
                className="text-[11px] font-bold uppercase"
                style={{
                  letterSpacing: "0.18em",
                  color: "var(--manga-muted-2)",
                }}
              >
                Загвар
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--manga-text)",
                }}
              >
                {THEME_LABELS[theme]}
              </span>
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
