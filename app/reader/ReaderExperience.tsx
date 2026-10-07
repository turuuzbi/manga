"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  Crown,
  Home,
  Library,
  RotateCw,
  Rows3,
} from "lucide-react";
import { markChapterRead } from "@/app/reader/actions";
import { YumeComment } from "@/app/reader/YumeComment";
import { ContentWarningModal } from "@/app/reader/ContentWarningModal";
import type { ContentWarningValue } from "@/lib/content-warning";
import { ChapterCommentsCard } from "@/app/_components/comments/ChapterCommentsCard";
import type { CommentPreview } from "@/lib/comment-rules";
import {
  FreeReadConfirm,
  isModifiedClick,
} from "@/app/_components/FreeReadConfirm";
import { FREE_CHAPTERS_PER_DAY } from "@/lib/plans";

type ReaderMode = "scroll" | "paged";

type ReaderExperienceProps = {
  manga: {
    id: string;
    name: string;
  };
  chapter: {
    id: string;
    number: number;
    title: string | null;
    /** Yume's end-of-chapter note; null/empty renders nothing. */
    yumeComment?: string | null;
    /** The account that wrote the note (its avatar and name). */
    yumeCommentAuthor?: { name: string; avatarUrl: string | null } | null;
    /** 18+ / violence notice to accept before the pages load; null = none. */
    contentWarning?: ContentWarningValue | null;
  };
  /** The chapter's comment count and newest two, for the end screen. */
  comments: CommentPreview;
  isPremium?: boolean;
  /** Free chapter unlocks left for the user today (null when premium). */
  freeRemaining?: number | null;
  pages: Array<ReaderPage>;
  previousChapter: ReaderNeighbourChapter | null;
  nextChapter: ReaderNeighbourChapter | null;
};

type ReaderNeighbourChapter = {
  id: string;
  number: number;
  /** Opening it would spend one of today's free unlocks. */
  spendsFreeRead: boolean;
};

type ReaderPage = {
  id: string;
  pageNumber: number;
  imageUrl: string;
  /** Pixel size stored at import; null for a few older rows. */
  width?: number | null;
  height?: number | null;
};

const readerModeStorageKey = "manga-reader-mode";
const readerModeChangeEvent = "manga-reader-mode-change";

// The reader's saved scroll/tap choice. Read through useSyncExternalStore so
// the server render and the browser's hydrating render agree (both "scroll")
// and React switches to the saved mode right after. Reading localStorage in
// useState's initializer made the browser's first render differ from the
// server HTML for every tap-mode reader — React error #418 on each chapter,
// with the page briefly unresponsive while React re-rendered it.
let sessionReaderMode: ReaderMode | null = null;

function subscribeReaderMode(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(readerModeChangeEvent, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(readerModeChangeEvent, onChange);
  };
}

function readSavedReaderMode(): ReaderMode {
  if (sessionReaderMode) {
    return sessionReaderMode;
  }

  try {
    return window.localStorage.getItem(readerModeStorageKey) === "paged"
      ? "paged"
      : "scroll";
  } catch {
    return "scroll";
  }
}

function saveReaderMode(mode: ReaderMode) {
  // Kept in memory too, so switching still works when storage is blocked
  // (private browsing); it just will not survive a reload there.
  sessionReaderMode = mode;

  try {
    window.localStorage.setItem(readerModeStorageKey, mode);
  } catch {
    // Storage unavailable: the in-memory choice above still applies.
  }

  window.dispatchEvent(new Event(readerModeChangeEvent));
}
const mobileChromeHideDelayMs = 2600;

function formatChapterLabel(number: number, title: string | null) {
  return title ? `Бүлэг ${number} • ${title}` : `Бүлэг ${number}`;
}

function ReaderChapterSwitch({
  previousChapter,
  currentChapterNumber,
  nextChapter,
  onChapterLinkClick,
}: {
  previousChapter: ReaderExperienceProps["previousChapter"];
  currentChapterNumber: number;
  nextChapter: ReaderExperienceProps["nextChapter"];
  onChapterLinkClick: (
    event: React.MouseEvent<HTMLAnchorElement>,
    chapter: ReaderNeighbourChapter,
  ) => void;
}) {
  return (
    <div className="pointer-events-auto mx-auto w-full max-w-md">
      <div className="grid grid-cols-[64px_1fr_64px] items-stretch overflow-hidden rounded-[24px] border border-[#8b6b2d]/50 bg-[#090909]/92 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
        {previousChapter ? (
          <Link
            href={`/reader/${previousChapter.id}`}
            // Never prefetched, here or at the chapter end: opening a chapter
            // can spend a daily free unlock, so only a real tap may run it.
            prefetch={false}
            onClick={(event) => onChapterLinkClick(event, previousChapter)}
            className="flex items-center justify-center border-r border-[#8b6b2d]/40 text-zinc-100 transition hover:bg-white/5"
            aria-label={`Go to chapter ${previousChapter.number}`}
          >
            <ChevronLeft size={18} />
          </Link>
        ) : (
          <span className="flex items-center justify-center border-r border-[#8b6b2d]/20 text-zinc-700">
            <ChevronLeft size={18} />
          </span>
        )}

        <div className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b69a64]">
            Бүлэг
          </span>
          <span className="text-lg font-semibold text-white">
            {currentChapterNumber}
          </span>
        </div>

        {nextChapter ? (
          <Link
            href={`/reader/${nextChapter.id}`}
            prefetch={false}
            onClick={(event) => onChapterLinkClick(event, nextChapter)}
            className="flex items-center justify-center border-l border-[#8b6b2d]/40 text-zinc-100 transition hover:bg-white/5"
            aria-label={`Go to chapter ${nextChapter.number}`}
          >
            <ChevronRight size={18} />
          </Link>
        ) : (
          <span className="flex items-center justify-center border-l border-[#8b6b2d]/20 text-zinc-700">
            <ChevronRight size={18} />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Waits before each silent retry, then the page shows its "try again" button.
 * Retrying at once used all attempts inside one dropped-signal moment on a
 * phone, so a page failed for good over a blip of a second or two.
 */
const pageImageRetryDelaysMs = [1000, 3000];

/**
 * One chapter page. A failed load is retried with a cache-busting query (R2
 * ignores the query and serves the same object, and the browser cannot answer
 * from a broken cached copy); after that the page says it failed and offers a
 * button, instead of leaving a bare line of alt text. A failed page also
 * retries by itself when the phone comes back online.
 */
function ReaderPageImage({
  page,
  alt,
  className,
  fallbackClassName,
  loading,
}: {
  page: ReaderPage;
  alt: string;
  className: string;
  fallbackClassName: string;
  loading?: "eager" | "lazy";
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const handledSrcRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const src =
    attempt === 0
      ? page.imageUrl
      : `${page.imageUrl}${page.imageUrl.includes("?") ? "&" : "?"}retry=${attempt}`;

  // The server-rendered first pages start loading before hydration, and React
  // does not replay an error that fired before it was listening. Fire it
  // again so those pages get the same retry.
  useEffect(() => {
    const image = imageRef.current;

    if (image?.complete && image.naturalWidth === 0) {
      image.dispatchEvent(new Event("error"));
    }
  }, []);

  useEffect(
    () => () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!failed) {
      return;
    }

    function retryWhenOnline() {
      setFailed(false);
      setAttempt((current) => current + 1);
    }

    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, [failed]);

  function handleError() {
    // Once per URL: the replay above can race the browser's own event.
    if (handledSrcRef.current === src) {
      return;
    }

    handledSrcRef.current = src;

    if (attempt < pageImageRetryDelaysMs.length) {
      const next = attempt + 1;
      setWaiting(true);
      retryTimeoutRef.current = window.setTimeout(() => {
        retryTimeoutRef.current = null;
        setWaiting(false);
        setAttempt(next);
      }, pageImageRetryDelaysMs[attempt]);
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <div className={fallbackClassName}>
        <p className="text-sm text-zinc-400">
          {page.pageNumber}-р хуудсыг ачаалж чадсангүй.
        </p>
        <button
          type="button"
          onClick={(event) => {
            // The scroll view toggles the reader controls on any tap.
            event.stopPropagation();
            setFailed(false);
            setAttempt(attempt + 1);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-2 pl-3 pr-4 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
        >
          <RotateCw size={14} />
          Дахин оролдох
        </button>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      // Lets the page hold its height before it loads, so lazy pages stay
      // lazy instead of collapsing and all starting at once.
      width={page.width ?? undefined}
      height={page.height ?? undefined}
      loading={loading}
      onError={handleError}
      // Hides the broken-image icon and alt text while a retry is pending.
      className={waiting ? `${className} invisible` : className}
    />
  );
}

export function ReaderExperience({
  manga,
  chapter,
  comments,
  isPremium = false,
  freeRemaining = null,
  pages,
  previousChapter,
  nextChapter,
}: ReaderExperienceProps) {
  const readerMode = useSyncExternalStore<ReaderMode>(
    subscribeReaderMode,
    readSavedReaderMode,
    () => "scroll",
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [showChrome, setShowChrome] = useState(true);
  const [confirming, setConfirming] = useState<ReaderNeighbourChapter | null>(
    null,
  );
  // The chapter whose warning the reader accepted. Held as an id rather than
  // a flag so the next or previous chapter asks again even when this
  // component stays mounted across the navigation; never stored, so every
  // open asks.
  const [acceptedWarningFor, setAcceptedWarningFor] = useState<string | null>(
    null,
  );
  const warningPending =
    Boolean(chapter.contentWarning) && acceptedWarningFor !== chapter.id;
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const chromeHideTimeoutRef = useRef<number | null>(null);
  const router = useRouter();

  // Confirm before navigating to a chapter that would spend a free unlock.
  // With no free reads left the reader page shows the paywall as before.
  function handleChapterLinkClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    target: ReaderNeighbourChapter,
  ) {
    if (
      !target.spendsFreeRead ||
      (freeRemaining ?? 0) <= 0 ||
      isModifiedClick(event)
    ) {
      return;
    }

    event.preventDefault();
    setConfirming(target);
  }

  function clearChromeHideTimeout() {
    if (chromeHideTimeoutRef.current) {
      window.clearTimeout(chromeHideTimeoutRef.current);
      chromeHideTimeoutRef.current = null;
    }
  }

  function isTouchDevice() {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(pointer: coarse)").matches;
  }

  function toggleChrome() {
    setShowChrome((value) => !value);
  }

  // Mark this chapter as read once the reader actually mounts in the browser.
  // The series is resolved server-side from the chapter, so it is not passed.
  // A chapter behind a warning counts as read once the warning is accepted.
  useEffect(() => {
    if (!warningPending) {
      void markChapterRead(chapter.id);
    }
  }, [chapter.id, warningPending]);

  useEffect(() => {
    if (!showChrome || !isTouchDevice()) {
      clearChromeHideTimeout();
      return;
    }

    clearChromeHideTimeout();
    chromeHideTimeoutRef.current = window.setTimeout(() => {
      setShowChrome(false);
    }, mobileChromeHideDelayMs);

    return () => clearChromeHideTimeout();
  }, [showChrome, readerMode, currentPage, chapter.id]);

  useEffect(() => () => clearChromeHideTimeout(), []);

  useEffect(() => {
    if (readerMode !== "paged") {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      // Arrow keys in a text field move the caret, not the page.
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        setCurrentPage((page) => Math.min(page + 1, pages.length));
      }

      if (event.key === "ArrowLeft") {
        setCurrentPage((page) => Math.max(page - 1, 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pages.length, readerMode]);

  useEffect(() => {
    if (readerMode !== "scroll") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const index = Number(
            (entry.target as HTMLElement).dataset.pageIndex ?? 0,
          );
          setCurrentPage(index);
        }
      },
      {
        rootMargin: "-35% 0px -35% 0px",
        threshold: 0.15,
      },
    );

    for (const ref of pageRefs.current) {
      if (ref) {
        observer.observe(ref);
      }
    }

    return () => observer.disconnect();
  }, [pages.length, readerMode, warningPending]);

  const chapterLabel = formatChapterLabel(chapter.number, chapter.title);
  // Tap mode has one extra step after the last page: the end-of-chapter
  // screen (index pages.length). Scroll mode never goes past the last page.
  const atChapterEnd = readerMode === "paged" && currentPage >= pages.length;
  const pageLabel = `${Math.min(currentPage + 1, pages.length)} / ${pages.length}`;

  function goNextPage() {
    setCurrentPage((page) => Math.min(page + 1, pages.length));
  }

  function goPreviousPage() {
    setCurrentPage((page) => Math.max(page - 1, 0));
  }

  // End of chapter, shared by both modes: Yume's note (if any), the "done"
  // line, and the way on.
  const chapterEnd = (
    <>
      <YumeComment
        comment={chapter.yumeComment}
        author={chapter.yumeCommentAuthor ?? null}
      />
      <ChapterCommentsCard
        chapterId={chapter.id}
        heading={`${manga.name} – ${chapter.number}-р бүлэг`}
        initial={comments}
      />
      <p className="text-2xl font-semibold text-white sm:text-3xl">
        Та {chapter.number}-р бүлгийг дуусгалаа.
      </p>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Бүлгийн сонголт
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {previousChapter ? (
          <Link
            href={`/reader/${previousChapter.id}`}
            prefetch={false}
            onClick={(event) => handleChapterLinkClick(event, previousChapter)}
            className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-white/10 bg-[#28282d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#34343a]"
          >
            Өмнөх бүлэг
          </Link>
        ) : (
          <div></div>
        )}

        {nextChapter ? (
          <Link
            href={`/reader/${nextChapter.id}`}
            prefetch={false}
            onClick={(event) => handleChapterLinkClick(event, nextChapter)}
            className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-[#8b6b2d]/40 bg-[#3d3322] px-5 py-3 text-sm font-semibold text-[#f4e3b2] transition hover:bg-[#4a3d29]"
          >
            Дараагийн бүлэг
          </Link>
        ) : (
          <div></div>
        )}
      </div>

      <div className="mt-5">
        <Link
          href={`/manga/${manga.id}`}
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b69a64] transition hover:text-[#e1c98b]"
        >
          Цувралын хуудас руу буцах
        </Link>
      </div>
    </>
  );

  // Nothing of the chapter is rendered until the warning is accepted, so no
  // page image is requested before "УНШИХ".
  if (warningPending && chapter.contentWarning) {
    return (
      <ContentWarningModal
        warning={chapter.contentWarning}
        chapterLabel={`${manga.name} · ${chapterLabel}`}
        mangaId={manga.id}
        onAccept={() => setAcceptedWarningFor(chapter.id)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_28%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.08),transparent_24%)]" />

      <header
        className={`fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/72 backdrop-blur-xl transition-transform duration-300 ${
          showChrome ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 w-full md:w-auto">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 transition hover:bg-white/10"
                aria-label="Go home"
              >
                <Home size={16} />
              </Link>
              <Link
                href={`/manga/${manga.id}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 transition hover:bg-white/10"
                aria-label="Цувралын хуудас руу буцах"
              >
                <Library size={16} />
              </Link>
            </div>
            <p className="mt-2 truncate text-base font-semibold text-white sm:text-lg">
              {manga.name}
            </p>
            <p className="truncate text-xs text-zinc-400 sm:text-sm">
              {chapterLabel}
            </p>
            {isPremium ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#c9a24c]/40 bg-[#c9a24c]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4cd93]">
                <Crown size={11} />
                Premium
              </span>
            ) : typeof freeRemaining === "number" ? (
              <Link
                href="/subscribe"
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300 transition hover:border-[#d27d9c]/50 hover:text-white"
              >
                Өнөөдөр {freeRemaining}/{FREE_CHAPTERS_PER_DAY} үнэгүй
              </Link>
            ) : null}
          </div>

          <div className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:w-auto md:shrink-0 md:justify-start">
            <button
              type="button"
              onClick={() => saveReaderMode("scroll")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition md:flex-none ${
                readerMode === "scroll"
                  ? "bg-white text-black"
                  : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Rows3 size={15} />
              <span className="hidden sm:inline">Scroll</span>
            </button>
            <button
              type="button"
              onClick={() => saveReaderMode("paged")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition md:flex-none ${
                readerMode === "paged"
                  ? "bg-white text-black"
                  : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Columns2 size={15} />
              <span className="hidden sm:inline">Tap</span>
            </button>
          </div>
        </div>
      </header>

      {readerMode === "scroll" ? (
        <main
          className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-0 pb-40 pt-20 sm:pt-24"
          onClick={toggleChrome}
        >
          <div className="mx-3 mb-4 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400 sm:mx-0">
            <span>Vertical Scroll</span>
            <span>{pageLabel}</span>
          </div>

          <div>
            {pages.map((page, index) => (
              <div
                key={page.id}
                ref={(node) => {
                  pageRefs.current[index] = node;
                }}
                data-page-index={index}
                className="overflow-hidden bg-black"
              >
                <ReaderPageImage
                  page={page}
                  alt={`${chapterLabel} page ${page.pageNumber}`}
                  className="block h-auto w-full select-none object-contain"
                  fallbackClassName="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
                  loading={index < 2 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          <div className="mx-auto mt-0 w-full max-w-4xl bg-[#1a1a1d] px-6 py-10 text-center shadow-[0_-10px_30px_rgba(0,0,0,0.25)]">
            {chapterEnd}
          </div>
        </main>
      ) : (
        <main className="relative z-10 flex min-h-screen items-center justify-center px-0 pb-36 pt-16 sm:px-4 sm:pt-20">
          {atChapterEnd ? (
            // One tap past the last page. No tap zones here: they would sit
            // over the chapter buttons. The pill (or ←) goes back to the last
            // page; it sits in the flow so the reader header cannot cover it.
            <div className="flex h-[calc(100vh-7.5rem)] w-full max-w-4xl flex-col overflow-y-auto bg-[#1a1a1d] shadow-[0_26px_90px_rgba(0,0,0,0.45)]">
              <div className="my-auto px-6 pb-12 pt-8 text-center">
                <button
                  type="button"
                  onClick={goPreviousPage}
                  className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-2 pl-3 pr-4 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft size={16} />
                  Сүүлийн хуудас
                </button>
                {chapterEnd}
              </div>
            </div>
          ) : (
          <div className="relative flex h-[calc(100vh-7.5rem)] w-full max-w-6xl items-center justify-center overflow-hidden bg-black shadow-[0_26px_90px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={goPreviousPage}
              className="absolute inset-y-0 left-0 z-20 flex w-[24%] items-center justify-start pl-3 text-zinc-400 transition hover:bg-white/5 hover:text-white sm:pl-5"
              aria-label="Previous page"
            >
              <ChevronLeft size={30} />
            </button>

            <button
              type="button"
              onClick={toggleChrome}
              className="absolute inset-y-0 left-[24%] z-20 w-[52%]"
              aria-label="Toggle reader controls"
            />

            <button
              type="button"
              onClick={goNextPage}
              className="absolute inset-y-0 right-0 z-20 flex w-[24%] items-center justify-end pr-3 text-zinc-400 transition hover:bg-white/5 hover:text-white sm:pr-5"
              aria-label="Next page"
            >
              <ChevronRight size={30} />
            </button>

            {pages[currentPage] ? (
              <ReaderPageImage
                // A fresh retry count for every page turned to.
                key={pages[currentPage].id}
                page={pages[currentPage]}
                alt={`${chapterLabel} page ${pages[currentPage].pageNumber}`}
                className="relative z-10 h-full w-full select-none object-contain"
                // Above the tap zones (z-20) so the button can be pressed.
                fallbackClassName="relative z-30 flex flex-col items-center gap-4 px-6 text-center"
              />
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
              <div className="rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-200 backdrop-blur">
                Хуудас {pageLabel}
              </div>
            </div>
          </div>
          )}
        </main>
      )}

      <div
        className={`fixed inset-x-0 bottom-4 z-40 px-3 transition-transform duration-300 sm:px-5 ${
          showChrome ? "translate-y-0" : "translate-y-[140%]"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:items-center">
          <ReaderChapterSwitch
            previousChapter={previousChapter}
            currentChapterNumber={chapter.number}
            nextChapter={nextChapter}
            onChapterLinkClick={handleChapterLinkClick}
          />
          <div className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {readerMode === "scroll"
              ? "Scroll хийн уншина"
              : "Баруун, зүүн даран хуудас эргүүлнэ"}
          </div>
        </div>
      </div>

      <FreeReadConfirm
        chapterNumber={confirming?.number ?? null}
        remaining={freeRemaining ?? 0}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const target = confirming;
          setConfirming(null);

          if (target) {
            router.push(`/reader/${target.id}`);
          }
        }}
      />
    </div>
  );
}
