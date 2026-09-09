"use client";

import { useState, useTransition } from "react";
import { BarChart3, ChevronDown, ChevronRight, Eye } from "lucide-react";
import {
  getChapterViewsAction,
  type AdminChapterViews,
} from "@/app/admin/actions";

type SeriesRow = {
  id: string;
  mangaName: string;
  viewCount: number;
  chapterCount: number;
};

/**
 * Per-series opens, expandable to a per-chapter breakdown.
 *
 * The series totals ride along in the page payload (already loaded for the
 * manage tab), but chapters are fetched per series on expand rather than
 * shipping every chapter of every series up front. Both paths are admin-gated
 * server-side.
 */
export function ViewAnalyticsPanel({ series }: { series: SeriesRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, AdminChapterViews[]>>(
    {},
  );
  const [isLoading, startLoad] = useTransition();

  const ranked = [...series].sort(
    (left, right) =>
      right.viewCount - left.viewCount ||
      left.mangaName.localeCompare(right.mangaName),
  );
  const totalViews = ranked.reduce((sum, row) => sum + row.viewCount, 0);

  function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }

    setOpenId(id);

    if (!chapters[id]) {
      startLoad(async () => {
        const rows = await getChapterViewsAction(id);
        setChapters((current) => ({ ...current, [id]: rows }));
      });
    }
  }

  return (
    <section className="ad-card motion-ink-up p-5 sm:p-7">
      <div className="mb-6 space-y-2">
        <p className="ad-eyebrow">Тоон үзүүлэлт</p>
        <h2 className="ad-h2">Үзэлт шалгах</h2>
        <p className="ad-sub">
          Цуврал тус бүрийн нийт үзэлт. Дэлгэрэнгүйг дарж бүлэг тус бүрээр
          харна. Зөвхөн админд харагдана.
        </p>
      </div>

      <div className="ad-soft mb-5 flex items-center gap-3 p-4">
        <Eye size={20} style={{ color: "var(--home-gold)" }} />
        <div>
          <p className="ad-inforow-label">Нийт үзэлт</p>
          <p
            className="text-2xl font-bold"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "var(--home-plum)",
            }}
          >
            {totalViews.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        {ranked.map((row, index) => {
          const isOpen = openId === row.id;
          const rows = chapters[row.id];
          const chapterSum = rows?.reduce((sum, c) => sum + c.viewCount, 0) ?? 0;
          // Chapter counting started after the series counter, so the parts can
          // sum to less than the whole. Surfaced rather than quietly hidden.
          const untracked = rows ? Math.max(0, row.viewCount - chapterSum) : 0;

          return (
            <div
              key={row.id}
              className="rounded-xl border"
              style={{
                borderColor: "var(--home-line)",
                background: "var(--home-paper-2)",
              }}
            >
              <button
                type="button"
                onClick={() => toggle(row.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                {isOpen ? (
                  <ChevronDown size={16} style={{ color: "var(--home-gold)" }} />
                ) : (
                  <ChevronRight
                    size={16}
                    style={{ color: "var(--home-plum-soft)" }}
                  />
                )}
                <span
                  className="w-6 shrink-0 text-xs font-bold"
                  style={{ color: "var(--home-plum-soft)" }}
                >
                  {index + 1}
                </span>
                <span
                  className="min-w-0 flex-1 truncate font-semibold"
                  style={{ color: "var(--home-plum)" }}
                >
                  {row.mangaName}
                </span>
                <span
                  className="shrink-0 text-xs"
                  style={{ color: "var(--home-plum-soft)" }}
                >
                  {row.chapterCount} бүлэг
                </span>
                <span className="ad-chip shrink-0">
                  {row.viewCount.toLocaleString()} үзэлт
                </span>
              </button>

              {isOpen ? (
                <div
                  className="px-3 pb-3"
                  style={{ borderTop: "1px dashed var(--home-line)" }}
                >
                  {!rows && isLoading ? (
                    <p
                      className="py-3 text-sm"
                      style={{ color: "var(--home-plum-soft)" }}
                    >
                      Ачаалж байна...
                    </p>
                  ) : rows && rows.length > 0 ? (
                    <>
                      <div className="mt-3 grid gap-1">
                        {rows.map((chapter) => (
                          <div
                            key={chapter.id}
                            className="flex items-center gap-3 text-sm"
                          >
                            <BarChart3
                              size={13}
                              style={{ color: "var(--home-gold)", opacity: 0.7 }}
                            />
                            <span
                              className="min-w-0 flex-1 truncate"
                              style={{ color: "var(--home-plum)" }}
                            >
                              Бүлэг {chapter.chapterNumber}
                              {chapter.title ? ` • ${chapter.title}` : ""}
                            </span>
                            <span
                              className="shrink-0 tabular-nums"
                              style={{ color: "var(--home-plum-soft)" }}
                            >
                              {chapter.viewCount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {untracked > 0 ? (
                        <p
                          className="mt-3 text-xs leading-5"
                          style={{ color: "var(--home-plum-soft)" }}
                        >
                          Бүлгээр бүртгэхээс өмнөх{" "}
                          <strong>{untracked.toLocaleString()}</strong> үзэлт
                          дээрх жагсаалтад ороогүй тул нийлбэр нь цувралын
                          дүнгээс бага байна.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p
                      className="py-3 text-sm"
                      style={{ color: "var(--home-plum-soft)" }}
                    >
                      Бүлэг алга.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
