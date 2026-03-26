"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  Home,
  Rows3,
} from "lucide-react";

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
  };
  pages: Array<{
    id: string;
    pageNumber: number;
    imageUrl: string;
  }>;
  previousChapter: {
    id: string;
    number: number;
  } | null;
  nextChapter: {
    id: string;
    number: number;
  } | null;
};

const readerModeStorageKey = "manga-reader-mode";

function formatChapterLabel(number: number, title: string | null) {
  return title ? `Chapter ${number} • ${title}` : `Chapter ${number}`;
}

function ReaderChapterSwitch({
  previousChapter,
  currentChapterNumber,
  nextChapter,
}: {
  previousChapter: ReaderExperienceProps["previousChapter"];
  currentChapterNumber: number;
  nextChapter: ReaderExperienceProps["nextChapter"];
}) {
  return (
    <div className="pointer-events-auto mx-auto w-full max-w-md">
      <div className="grid grid-cols-[64px_1fr_64px] items-stretch overflow-hidden rounded-[24px] border border-[#8b6b2d]/50 bg-[#090909]/92 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
        {previousChapter ? (
          <Link
            href={`/reader/${previousChapter.id}`}
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
            Chapter
          </span>
          <span className="text-lg font-semibold text-white">
            {currentChapterNumber}
          </span>
        </div>

        {nextChapter ? (
          <Link
            href={`/reader/${nextChapter.id}`}
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

export function ReaderExperience({
  manga,
  chapter,
  pages,
  previousChapter,
  nextChapter,
}: ReaderExperienceProps) {
  const [readerMode, setReaderMode] = useState<ReaderMode>(() => {
    if (typeof window === "undefined") {
      return "scroll";
    }

    const savedMode = window.localStorage.getItem(
      readerModeStorageKey,
    ) as ReaderMode | null;

    return savedMode === "paged" ? "paged" : "scroll";
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [showChrome, setShowChrome] = useState(true);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    window.localStorage.setItem(readerModeStorageKey, readerMode);
  }, [readerMode]);

  useEffect(() => {
    if (readerMode !== "paged") {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setCurrentPage((page) => Math.min(page + 1, pages.length - 1));
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
  }, [pages.length, readerMode]);

  const chapterLabel = formatChapterLabel(chapter.number, chapter.title);
  const pageLabel = `${currentPage + 1} / ${pages.length}`;

  function goNextPage() {
    setCurrentPage((page) => Math.min(page + 1, pages.length - 1));
  }

  function goPreviousPage() {
    setCurrentPage((page) => Math.max(page - 1, 0));
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
              <span className="hidden sm:inline">Reader</span>
            </div>
            <p className="mt-2 truncate text-base font-semibold text-white sm:text-lg">
              {manga.name}
            </p>
            <p className="truncate text-xs text-zinc-400 sm:text-sm">
              {chapterLabel}
            </p>
          </div>

          <div className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:w-auto md:shrink-0 md:justify-start">
            <button
              type="button"
              onClick={() => setReaderMode("scroll")}
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
              onClick={() => setReaderMode("paged")}
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
          onClick={() => setShowChrome((value) => !value)}
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
                <img
                  src={page.imageUrl}
                  alt={`${chapterLabel} page ${page.pageNumber}`}
                  className="block h-auto w-full select-none object-contain"
                  loading={index < 2 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          <div className="mx-auto mt-0 w-full max-w-4xl bg-[#1a1a1d] px-6 py-10 text-center shadow-[0_-10px_30px_rgba(0,0,0,0.25)]">
            <p className="text-2xl font-semibold text-white sm:text-3xl">
              You finished chapter {chapter.number}
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Jump straight into the previous or next chapter without leaving
              the reader.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {previousChapter ? (
                <Link
                  href={`/reader/${previousChapter.id}`}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-white/10 bg-[#28282d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#34343a]"
                >
                  Previous
                </Link>
              ) : (
                <span className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-white/10 bg-[#242429] px-5 py-3 text-sm font-semibold text-zinc-600">
                  Previous
                </span>
              )}

              {nextChapter ? (
                <Link
                  href={`/reader/${nextChapter.id}`}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-[#8b6b2d]/40 bg-[#3d3322] px-5 py-3 text-sm font-semibold text-[#f4e3b2] transition hover:bg-[#4a3d29]"
                >
                  Next Chapter
                </Link>
              ) : (
                <span className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-[#8b6b2d]/20 bg-[#2d281f] px-5 py-3 text-sm font-semibold text-[#7f7253]">
                  Latest Chapter
                </span>
              )}
            </div>

            <div className="mt-5">
              <Link
                href={`/manga/${manga.id}`}
                className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b69a64] transition hover:text-[#e1c98b]"
              >
                Back to series
              </Link>
            </div>
          </div>
        </main>
      ) : (
        <main className="relative z-10 flex min-h-screen items-center justify-center px-0 pb-36 pt-16 sm:px-4 sm:pt-20">
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
              onClick={() => setShowChrome((value) => !value)}
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

            <img
              src={pages[currentPage]?.imageUrl}
              alt={`${chapterLabel} page ${pages[currentPage]?.pageNumber ?? 1}`}
              className="relative z-10 h-full w-full select-none object-contain"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
              <div className="rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-200 backdrop-blur">
                Page {pageLabel}
              </div>
            </div>
          </div>
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
          />
          <div className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {readerMode === "scroll"
              ? "Scroll to read"
              : "Tap left or right side to turn pages"}
          </div>
        </div>
      </div>
    </div>
  );
}
