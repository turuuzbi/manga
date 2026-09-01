"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronRight,
  Clock3,
  Lock,
  Wrench,
} from "lucide-react";
import {
  FreeReadConfirm,
  isModifiedClick,
} from "@/app/_components/FreeReadConfirm";

export type ChapterListItem = {
  id: string;
  chapterNumber: number;
  title: string | null;
  badgeImage: string | null;
  badgeScale: number | null;
  coverImage: string | null;
  fallbackThumb: string | null;
  pageCount: number;
  publishedLabel: string;
  isRead: boolean;
  isLastRead: boolean;
  /** One of the newest chapters — subscriber-only, never free. */
  isPaywalled: boolean;
  /** Opening this would spend one of today's free unlocks. */
  spendsFreeRead: boolean;
};

type SortOrder = "asc" | "desc";

/** A run of chapter numbers that has no row of its own. */
type ChapterGap = { from: number; to: number };

type ChapterRow =
  | { kind: "chapter"; key: string; sortKey: number; chapter: ChapterListItem }
  | { kind: "gap"; key: string; sortKey: number; gap: ChapterGap };

/**
 * A series whose numbering jumps — 8 straight to 65, say — is missing those
 * chapters rather than never having had them, so the list shows them as locked
 * "being fixed" placeholders instead of silently skipping from 8 to 65.
 *
 * Guards worth knowing about:
 * - Only whole numbers are filled in. A half-chapter like 10.5 counts as
 *   present when it exists, but is never invented.
 * - Only the range between the first and last published chapter is considered,
 *   so a series that has simply not reached chapter 100 yet reports no gap.
 * - One stray chapter number (a typo'd 9999) would otherwise generate
 *   thousands of rows, so an implausible span reports nothing at all.
 */
const MAX_GAP_SPAN = 2000;

function findChapterGaps(items: ChapterListItem[]): ChapterGap[] {
  const present = new Set(items.map((item) => item.chapterNumber));
  const whole = [...present].filter((value) => Number.isInteger(value));

  if (whole.length < 2) {
    return [];
  }

  const min = Math.min(...whole);
  const max = Math.max(...whole);

  if (max - min > MAX_GAP_SPAN) {
    return [];
  }

  const gaps: ChapterGap[] = [];
  let runStart: number | null = null;

  for (let number = min + 1; number < max; number += 1) {
    if (!present.has(number)) {
      runStart ??= number;
    } else if (runStart !== null) {
      gaps.push({ from: runStart, to: number - 1 });
      runStart = null;
    }
  }

  if (runStart !== null) {
    gaps.push({ from: runStart, to: max - 1 });
  }

  return gaps;
}

function formatChapterLabel(chapterNumber: number, title: string | null) {
  return title ? `Бүлэг ${chapterNumber} • ${title}` : `Бүлэг ${chapterNumber}`;
}

function formatGapLabel({ from, to }: ChapterGap) {
  return from === to ? `Бүлэг ${from}` : `Бүлэг ${from}–${to}`;
}

export function ChapterList({
  items,
  freeRemaining = 0,
}: {
  items: ChapterListItem[];
  /** Free unlocks left today; 0 for premium and signed-out readers. */
  freeRemaining?: number;
}) {
  // Readers start at the beginning, so the list opens ascending from chapter 1.
  // "Сүүлээс" (newest first) stays one tap away.
  const [order, setOrder] = useState<SortOrder>("asc");
  const [confirming, setConfirming] = useState<ChapterListItem | null>(null);
  const router = useRouter();

  const gaps = findChapterGaps(items);
  const missingCount = gaps.reduce(
    (total, gap) => total + (gap.to - gap.from + 1),
    0,
  );

  // A gap contains no real chapters by definition, so keying it on `from` seats
  // it correctly whichever way the list is sorted.
  const rows: ChapterRow[] = [
    ...items.map((chapter) => ({
      kind: "chapter" as const,
      key: chapter.id,
      sortKey: chapter.chapterNumber,
      chapter,
    })),
    ...gaps.map((gap) => ({
      kind: "gap" as const,
      key: `gap-${gap.from}`,
      sortKey: gap.from,
      gap,
    })),
  ].sort((left, right) =>
    order === "desc"
      ? right.sortKey - left.sortKey
      : left.sortKey - right.sortKey,
  );

  // Only intercept when the tap would actually cost the reader something; with
  // no free reads left the reader page shows the paywall as before.
  function handleChapterClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    chapter: ChapterListItem,
  ) {
    if (
      !chapter.spendsFreeRead ||
      freeRemaining <= 0 ||
      isModifiedClick(event)
    ) {
      return;
    }

    event.preventDefault();
    setConfirming(chapter);
  }

  return (
    <>
      <div className="mb-7 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="yd-section-title">Бүлгүүд</h2>
          <p className="yd-count">
            {items.length} нийт бүлэг
            {missingCount > 0 ? ` · ${missingCount} засварт` : ""}
          </p>
        </div>

        {items.length > 0 ? (
          <div className="yd-sort" role="group" aria-label="Бүлгийн эрэмбэ">
            <button
              type="button"
              onClick={() => setOrder("asc")}
              aria-pressed={order === "asc"}
              className={`yd-sort-btn${order === "asc" ? " active" : ""}`}
            >
              <ArrowUp size={13} />
              Эхнээс
            </button>
            <button
              type="button"
              onClick={() => setOrder("desc")}
              aria-pressed={order === "desc"}
              className={`yd-sort-btn${order === "desc" ? " active" : ""}`}
            >
              <ArrowDown size={13} />
              Сүүлээс
            </button>
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="yd-empty">Одоогоор бүлэг алга</div>
      ) : (
        <div className="grid gap-4">
          {rows.map((row, index) => {
            const delay = { animationDelay: `${Math.min(index, 8) * 55}ms` };

            if (row.kind === "gap") {
              const { gap } = row;
              const count = gap.to - gap.from + 1;

              return (
                <div
                  key={row.key}
                  className="motion-ink-up yd-chapter yd-gap"
                  style={delay}
                  aria-disabled="true"
                >
                  <div className="yd-chapter-thumb yd-gap-thumb">
                    <Wrench size={24} />
                  </div>

                  <div className="yd-chapter-body">
                    <p className="yd-chapter-title">{formatGapLabel(gap)}</p>
                    <div className="yd-chapter-meta">
                      <span>
                        <Wrench size={14} />
                        Засварт байна
                      </span>
                      {count > 1 ? <span>{count} бүлэг</span> : null}
                    </div>
                  </div>

                  <div className="yd-chapter-go yd-gap-go">Түр хаалттай</div>
                </div>
              );
            }

            const chapter = row.chapter;

            return (
            <Link
              key={row.key}
              href={`/reader/${chapter.id}`}
              onClick={(event) => handleChapterClick(event, chapter)}
              className={`group motion-ink-up yd-chapter${chapter.isRead ? " is-read" : ""}`}
              style={delay}
            >
              {chapter.isLastRead ? (
                <span
                  className="yd-dogear"
                  role="img"
                  aria-label="Энд уншиж зогссон"
                  title="Энд уншиж зогссон"
                />
              ) : null}
              <div className="yd-chapter-thumb">
                {chapter.isPaywalled ? (
                  <span className="yd-chapter-lock" title="Зөвхөн багцтай уншина">
                    <Lock size={10} />
                    Багц
                  </span>
                ) : null}
                {chapter.badgeImage ? (
                  <img
                    src={chapter.badgeImage}
                    alt={`Бүлэг ${chapter.chapterNumber} тэмдэг`}
                    className="badge"
                    style={{
                      width: `${chapter.badgeScale ?? 85}%`,
                      height: `${chapter.badgeScale ?? 85}%`,
                    }}
                  />
                ) : chapter.coverImage ? (
                  <img
                    src={chapter.coverImage}
                    alt={`Бүлэг ${chapter.chapterNumber}`}
                  />
                ) : chapter.fallbackThumb ? (
                  <img
                    src={chapter.fallbackThumb}
                    alt={`Бүлэг ${chapter.chapterNumber}`}
                  />
                ) : (
                  <span className="yd-chapter-num">{chapter.chapterNumber}</span>
                )}
              </div>

              <div className="yd-chapter-body">
                <p className="yd-chapter-title">
                  {formatChapterLabel(chapter.chapterNumber, chapter.title)}
                </p>
                <div className="yd-chapter-meta">
                  <span>
                    <BookOpen size={14} />
                    {chapter.pageCount} хуудас
                  </span>
                  <span>
                    <Clock3 size={14} />
                    {chapter.publishedLabel}
                  </span>
                </div>
              </div>

              <div className="yd-chapter-go">
                Унших
                <ChevronRight size={16} />
              </div>
            </Link>
            );
          })}
        </div>
      )}

      <FreeReadConfirm
        chapterNumber={confirming?.chapterNumber ?? null}
        remaining={freeRemaining}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const target = confirming;
          setConfirming(null);

          if (target) {
            router.push(`/reader/${target.id}`);
          }
        }}
      />
    </>
  );
}
