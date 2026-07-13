"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, BookOpen, ChevronRight, Clock3 } from "lucide-react";

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
};

type SortOrder = "asc" | "desc";

function formatChapterLabel(chapterNumber: number, title: string | null) {
  return title ? `Бүлэг ${chapterNumber} • ${title}` : `Бүлэг ${chapterNumber}`;
}

export function ChapterList({ items }: { items: ChapterListItem[] }) {
  // "Сүүлээс" (newest first) is the default, matching the previous behaviour.
  const [order, setOrder] = useState<SortOrder>("desc");

  const sorted = [...items].sort((left, right) =>
    order === "desc"
      ? right.chapterNumber - left.chapterNumber
      : left.chapterNumber - right.chapterNumber,
  );

  return (
    <>
      <div className="mb-7 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="yd-section-title">Бүлгүүд</h2>
          <p className="yd-count">{items.length} нийт бүлэг</p>
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
          {sorted.map((chapter, index) => (
            <Link
              key={chapter.id}
              href={`/reader/${chapter.id}`}
              className={`group motion-ink-up yd-chapter${chapter.isRead ? " is-read" : ""}`}
              style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
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
          ))}
        </div>
      )}
    </>
  );
}
