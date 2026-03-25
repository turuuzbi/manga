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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <div className="min-w-0">
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

          <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setReaderMode("scroll")}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
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
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
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
          className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-2 pb-28 pt-24 sm:px-4"
          onClick={() => setShowChrome((value) => !value)}
        >
          <div className="mb-5 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            <span>Vertical Scroll</span>
            <span>{pageLabel}</span>
          </div>

          <div className="space-y-3">
            {pages.map((page, index) => (
              <div
                key={page.id}
                ref={(node) => {
                  pageRefs.current[index] = node;
                }}
                data-page-index={index}
                className="overflow-hidden rounded-[24px] border border-white/8 bg-black/60 shadow-[0_22px_70px_rgba(0,0,0,0.38)]"
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
        </main>
      ) : (
        <main className="relative z-10 flex min-h-screen items-center justify-center px-2 pb-24 pt-20 sm:px-4">
          <div className="relative flex h-[calc(100vh-7rem)] w-full max-w-6xl items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/80 shadow-[0_26px_90px_rgba(0,0,0,0.45)]">
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

      <footer
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/72 backdrop-blur-xl transition-transform duration-300 ${
          showChrome ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {readerMode === "scroll"
              ? "Scroll to read"
              : "Tap left or right side to turn pages"}
          </div>

          <div className="flex items-center gap-2">
            {previousChapter ? (
              <Link
                href={`/reader/${previousChapter.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                <ChevronLeft size={16} />
                Ch. {previousChapter.number}
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-600">
                Start
              </span>
            )}

            {nextChapter ? (
              <Link
                href={`/reader/${nextChapter.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Ch. {nextChapter.number}
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-600">
                Latest
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
