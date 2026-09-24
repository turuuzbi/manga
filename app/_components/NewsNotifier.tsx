"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Gift, Newspaper, X } from "lucide-react";
import {
  getNewsServerSnapshot,
  getNewsSnapshot,
  loadNewsStatus,
  markNewsSeen,
  subscribeNews,
} from "@/lib/news-client";

/** Shared unread state for badges and the popup. */
export function useNewsState() {
  return useSyncExternalStore(
    subscribeNews,
    getNewsSnapshot,
    getNewsServerSnapshot,
  );
}

// No popup where it would get in the way: mid-chapter, in the dashboard, or
// on the auth screens.
const QUIET_PATHS = ["/reader", "/admin", "/sign-in", "/sign-up"];

function isQuietPath(pathname: string) {
  return QUIET_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

const STYLES = `
.ynp-overlay {
  --ynp-paper: #fffdfb; --ynp-paper-2: #f8ecee; --ynp-plum: #56414c; --ynp-plum-soft: #8c7681;
  --ynp-rose: #d27d9c; --ynp-rose-deep: #b9577b; --ynp-gold: #c8a24c;
  --ynp-line: rgba(200, 162, 76, 0.42); --ynp-line-strong: rgba(200, 162, 76, 0.7);
  position: fixed; inset: 0; z-index: 95;
  display: flex; align-items: flex-end; justify-content: center;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
  background: rgba(22, 12, 18, 0.55);
  backdrop-filter: blur(4px);
  animation: ynp-fade 0.2s ease;
}
@media (min-width: 640px) { .ynp-overlay { align-items: center; } }
html[data-theme="dark"] .ynp-overlay {
  --ynp-paper: #191222; --ynp-paper-2: #211830; --ynp-plum: #f1e5ee; --ynp-plum-soft: #b6a3b3;
  --ynp-rose: #df9fbf; --ynp-rose-deep: #c77da3; --ynp-gold: #d8b56a;
  --ynp-line: rgba(216, 181, 106, 0.32); --ynp-line-strong: rgba(216, 181, 106, 0.55);
}
html[data-theme="autumn"] .ynp-overlay {
  --ynp-paper: #fffaf2; --ynp-paper-2: #f9ead6; --ynp-plum: #59402e; --ynp-plum-soft: #927759;
  --ynp-rose: #e08a4a; --ynp-rose-deep: #c25f2a; --ynp-gold: #c19434;
  --ynp-line: rgba(193, 148, 52, 0.4); --ynp-line-strong: rgba(193, 148, 52, 0.68);
}
.ynp-card {
  position: relative; width: 100%; max-width: 400px;
  border-radius: 26px; padding: 24px 22px 20px;
  color: var(--ynp-plum);
  background:
    radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--ynp-rose) 16%, transparent), transparent 55%),
    var(--ynp-paper);
  border: 1px solid var(--ynp-line-strong);
  box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  animation: ynp-pop 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}
.ynp-close {
  position: absolute; top: 12px; right: 12px;
  width: 34px; height: 34px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--ynp-plum-soft); background: var(--ynp-paper-2);
  border: 1px solid var(--ynp-line); cursor: pointer;
}
.ynp-close:hover { color: var(--ynp-rose-deep); }
.ynp-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Marcellus', serif; font-size: 10.5px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--ynp-gold);
}
.ynp-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 999px;
  color: #fff; background: linear-gradient(135deg, var(--ynp-rose), var(--ynp-rose-deep));
}
.ynp-title {
  margin-top: 12px; padding-right: 26px;
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: 26px; line-height: 1.12; color: var(--ynp-plum);
}
.ynp-media {
  margin-top: 14px; overflow: hidden; border-radius: 16px;
  border: 1px solid var(--ynp-line); background: var(--ynp-paper-2);
}
.ynp-media img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ynp-media.is-article { aspect-ratio: 16 / 9; }
.ynp-media.is-notice { aspect-ratio: 3 / 4; max-width: 150px; margin-left: auto; margin-right: auto; }
.ynp-body {
  margin-top: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; line-height: 1.65;
  color: var(--ynp-plum-soft);
}
.ynp-more {
  margin-top: 10px; font-family: 'Marcellus', serif; font-size: 11px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ynp-rose-deep);
}
.ynp-actions { margin-top: 18px; display: flex; flex-direction: column; gap: 9px; }
.ynp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Marcellus', serif; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 14px 22px; border-radius: 999px; cursor: pointer; text-decoration: none;
  border: 1px solid transparent; transition: transform 0.18s;
}
.ynp-btn-go {
  color: #fff; background: linear-gradient(135deg, var(--ynp-rose), var(--ynp-rose-deep));
  border-color: rgba(255, 255, 255, 0.25); box-shadow: 0 14px 28px -12px var(--ynp-rose-deep);
}
.ynp-btn-go:hover { transform: translateY(-2px); }
.ynp-btn-later { color: var(--ynp-plum-soft); background: var(--ynp-paper-2); border-color: var(--ynp-line); }
@keyframes ynp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ynp-pop { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .ynp-overlay, .ynp-card { animation: none; }
  .ynp-btn-go:hover { transform: none; }
}
`;

/**
 * Loads the reader's unread МЭДЭЭ once per page load and shows the newest
 * unread item as a one-time popup. Dismissing it, or opening it, marks it
 * seen — so it never pops again, and the badge drops by one.
 */
export function NewsNotifier() {
  const pathname = usePathname() ?? "/";
  const quiet = isQuietPath(pathname);
  const news = useNewsState();
  // Held back a moment so the page paints first and the card doesn't land
  // on top of a half-loaded screen.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (quiet) {
      return;
    }

    void loadNewsStatus();
    const timer = window.setTimeout(() => setReady(true), 700);
    return () => window.clearTimeout(timer);
  }, [quiet]);

  const item = !quiet && ready ? news.popup : null;

  useEffect(() => {
    if (!item) {
      return;
    }

    const key = item.key;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        markNewsSeen([key]);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [item]);

  if (!item) {
    return null;
  }

  const isNotice = item.kind === "notice";
  const dismiss = () => markNewsSeen([item.key]);

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="ynp-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ynp-title"
        onClick={dismiss}
      >
        <div className="ynp-card" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="ynp-close"
            aria-label="Хаах"
            onClick={dismiss}
          >
            <X size={16} />
          </button>

          <p className="ynp-eyebrow">
            <span className="ynp-icon">
              {isNotice ? <Gift size={15} /> : <Newspaper size={15} />}
            </span>
            {isNotice ? "Бэлэг" : "Шинэ мэдээ"}
          </p>

          <h2 id="ynp-title" className="ynp-title">
            {item.title}
          </h2>

          {item.imageUrl ? (
            <div className={`ynp-media ${isNotice ? "is-notice" : "is-article"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt="" />
            </div>
          ) : null}

          {item.excerpt ? <p className="ynp-body">{item.excerpt}</p> : null}

          {news.moreUnread > 0 ? (
            <p className="ynp-more">+{news.moreUnread} шинэ мэдээ</p>
          ) : null}

          <div className="ynp-actions">
            <Link
              href={item.href}
              className="ynp-btn ynp-btn-go"
              onClick={dismiss}
              autoFocus
            >
              <BookOpen size={15} />
              Унших
            </Link>
            <button type="button" className="ynp-btn ynp-btn-later" onClick={dismiss}>
              Дараа
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
