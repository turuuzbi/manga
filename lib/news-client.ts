/**
 * Browser-side МЭДЭЭ state, shared by the unread badges (MangaTopNav) and the
 * one-time popup (NewsNotifier). One status request per page load, however
 * many components ask.
 *
 * Signed-out readers keep their seen keys in localStorage; signed-in readers'
 * state lives in the database, but keys are mirrored locally too so a popup
 * never re-appears just because a network request failed.
 *
 * Also owns the reader's applied background (see `applyUserBackground`), since
 * it rides on the same status response.
 */
import type { NewsItem, NewsStatus } from "@/lib/news";

export const NEWS_SEEN_STORAGE_KEY = "yume-news-seen";
export const USER_BG_STORAGE_KEY = "yume-user-bg";
const MAX_LOCAL_SEEN = 300;

export type ClientNewsState = {
  loaded: boolean;
  signedIn: boolean;
  unreadKeys: string[];
  unreadCount: number;
  popup: NewsItem | null;
  /** Unread items after the popup's, for its "and N more" line. */
  moreUnread: number;
};

const INITIAL_STATE: ClientNewsState = {
  loaded: false,
  signedIn: false,
  unreadKeys: [],
  unreadCount: 0,
  popup: null,
  moreUnread: 0,
};

let state: ClientNewsState = INITIAL_STATE;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(next: ClientNewsState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeNews(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNewsSnapshot() {
  return state;
}

export function getNewsServerSnapshot() {
  return INITIAL_STATE;
}

export function readLocalSeen(): string[] {
  try {
    const raw = window.localStorage.getItem(NEWS_SEEN_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((key): key is string => typeof key === "string")
      : [];
  } catch {
    return [];
  }
}

function writeLocalSeen(keys: string[]) {
  try {
    window.localStorage.setItem(
      NEWS_SEEN_STORAGE_KEY,
      JSON.stringify(keys.slice(-MAX_LOCAL_SEEN)),
    );
  } catch {
    // Private mode or blocked storage: seen state lasts for this page only.
  }
}

function fromStatus(status: NewsStatus): ClientNewsState {
  // Keys seen in this browser always win. For signed-in readers the server
  // normally agrees already; this covers a "seen" request still in flight when
  // the status was computed (e.g. the article page being opened right now).
  const seen = new Set(readLocalSeen());

  if (status.signedIn) {
    const unreadKeys = status.unreadKeys.filter((key) => !seen.has(key));
    const popup =
      status.popup && !seen.has(status.popup.key) ? status.popup : null;

    return {
      loaded: true,
      signedIn: true,
      unreadKeys,
      unreadCount: unreadKeys.length,
      popup,
      moreUnread: popup ? Math.max(0, unreadKeys.length - 1) : 0,
    };
  }

  const unread = status.recent.filter((item) => !seen.has(item.key));

  return {
    loaded: true,
    signedIn: false,
    unreadKeys: unread.map((item) => item.key),
    unreadCount: unread.length,
    popup: unread[0] ?? null,
    moreUnread: Math.max(0, unread.length - 1),
  };
}

/** Fetch unread state once per page load (safe to call from many places). */
export function loadNewsStatus(): Promise<void> {
  if (state.loaded) {
    return Promise.resolve();
  }

  if (!pending) {
    pending = (async () => {
      try {
        const response = await fetch("/api/news/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seen: readLocalSeen() }),
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const status = (await response.json()) as NewsStatus;
        setState(fromStatus(status));
        applyUserBackground(status.signedIn ? status.backgroundUrl : null);
      } catch {
        // Offline or the endpoint failed: no badge this time, nothing breaks.
      } finally {
        pending = null;
      }
    })();
  }

  return pending;
}

/**
 * Mark items seen: popup dismissed, or the item opened. Updates the badge at
 * once, remembers the keys locally, and tells the server for signed-in readers.
 */
export function markNewsSeen(keys: string[]) {
  const fresh = keys.filter(Boolean);

  if (fresh.length === 0) {
    return;
  }

  const local = readLocalSeen();
  const known = new Set(local);
  writeLocalSeen([...local, ...fresh.filter((key) => !known.has(key))]);

  if (state.loaded) {
    const seenNow = new Set(fresh);
    const unreadKeys = state.unreadKeys.filter((key) => !seenNow.has(key));
    const wasPopup = Boolean(state.popup && seenNow.has(state.popup.key));

    setState({
      ...state,
      unreadKeys,
      unreadCount: unreadKeys.length,
      popup: wasPopup ? null : state.popup,
      moreUnread: wasPopup ? 0 : state.moreUnread,
    });
  }

  if (state.signedIn || !state.loaded) {
    void fetch("/api/news/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: fresh }),
      keepalive: true,
    }).catch(() => undefined);
  }
}

// ── The reader's applied background ─────────────────────────────────────────

function cssUrl(url: string) {
  return `url("${url.replace(/["\\\n\r]/g, "")}")`;
}

/**
 * Paint (or clear) the reader's earned background behind every page. The
 * value is cached in localStorage so the pre-paint script in the root layout
 * can apply it on the first frame, before any request.
 */
export function applyUserBackground(url: string | null) {
  if (typeof document === "undefined") {
    return;
  }

  try {
    if (url) {
      window.localStorage.setItem(USER_BG_STORAGE_KEY, url);
    } else {
      window.localStorage.removeItem(USER_BG_STORAGE_KEY);
    }
  } catch {
    // Storage blocked: it still applies to this page.
  }

  const root = document.documentElement;

  if (url) {
    root.style.setProperty("--user-bg-image", cssUrl(url));
    root.dataset.userBg = "on";
  } else {
    root.style.removeProperty("--user-bg-image");
    delete root.dataset.userBg;
  }
}
