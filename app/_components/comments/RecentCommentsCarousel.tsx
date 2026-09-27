"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeader } from "@/app/_components/MangaPosterCard";
import { CommentAvatar } from "@/app/_components/comments/CommentItem";
import { CommentsSheet } from "@/app/_components/comments/CommentsSheet";
import {
  COMMENT_STYLES,
  RECENT_COMMENTS_STYLES,
} from "@/app/_components/comments/comment-styles";
import type { RecentCommentCard } from "@/lib/comment-rules";

const GAP = 14;

/**
 * Homepage "Сүүлд бичигдсэн сэтгэгдлүүд": the newest chapter comments, one
 * per person. One card per slide on phones (two and three side by side on
 * wider screens); swipe, arrows or dots. A card opens that chapter's comments.
 */
export function RecentCommentsCarousel({ items }: { items: RecentCommentCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [positions, setPositions] = useState(items.length);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState<RecentCommentCard | null>(null);

  const step = useCallback(() => {
    const slide = trackRef.current?.firstElementChild;
    return slide ? slide.getBoundingClientRect().width + GAP : 1;
  }, []);

  // Stops: one per card on phones, fewer when several cards fit at once.
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const stops = Math.round((track.scrollWidth - track.clientWidth) / step()) + 1;
    setPositions(Math.max(1, Math.min(stops, items.length)));
    setActive(Math.round(track.scrollLeft / step()));
  }, [items.length, step]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(index, positions - 1));
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: target * step(), behavior: smooth ? "smooth" : "auto" });
  }

  function reveal(id: string) {
    setRevealed((current) => new Set(current).add(id));
  }

  return (
    <section className="ycr motion-ink-up" aria-roledescription="carousel" aria-label="Сүүлд бичигдсэн сэтгэгдлүүд">
      <style>{COMMENT_STYLES + RECENT_COMMENTS_STYLES}</style>
      <SectionHeader eyebrow="Уншигчдын сэтгэгдэл" title="Сүүлд бичигдсэн сэтгэгдлүүд" />

      <div
        ref={trackRef}
        className="ycr-track"
        onScroll={() => setActive(Math.round((trackRef.current?.scrollLeft ?? 0) / step()))}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="ycr-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${items.length}`}
          >
            <CommentCard
              item={item}
              hidden={item.isSpoiler && !revealed.has(item.id)}
              onReveal={() => reveal(item.id)}
              onOpen={() => setOpen(item)}
            />
          </div>
        ))}
      </div>

      {positions > 1 ? (
        <div className="ycr-nav">
          <button
            type="button"
            className="ycr-arrow"
            onClick={() => goTo(active - 1)}
            disabled={active <= 0}
            aria-label="Өмнөх"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="ycr-dots">
            {Array.from({ length: positions }, (_, index) => (
              <button
                key={index}
                type="button"
                className={`ycr-dot${index === active ? " is-active" : ""}`}
                onClick={() => goTo(index)}
                aria-label={`${index + 1}-р сэтгэгдэл`}
                aria-current={index === active || undefined}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ycr-arrow"
            onClick={() => goTo(active + 1)}
            disabled={active >= positions - 1}
            aria-label="Дараах"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}

      {open ? (
        <CommentsSheet
          chapterId={open.chapterId}
          heading={`${open.mangaTitle} – ${open.chapterLabel}`}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </section>
  );
}

function CommentCard({
  item,
  hidden,
  onReveal,
  onOpen,
}: {
  item: RecentCommentCard;
  /** A spoiler not yet revealed: cover and text stay blurred. */
  hidden: boolean;
  onReveal: () => void;
  onOpen: () => void;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Only the card itself; Enter on "Харах" must not open the sheet.
    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <div
      className="ycr-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      aria-label={`${item.mangaTitle} – ${item.chapterLabel}: сэтгэгдлүүдийг харах`}
    >
      <div className="ycr-cover">
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverUrl}
            alt=""
            loading="lazy"
            className={hidden ? "is-blurred" : undefined}
          />
        ) : (
          <BookOpen size={22} />
        )}
      </div>

      <div className="ycr-main">
        <p className="ycr-title">
          {item.mangaTitle} – {item.chapterLabel}
        </p>
        {hidden ? (
          <p className="ycr-spoiler">
            ⚠️ Спойлер агуулж болзошгүй
            <button
              type="button"
              className="ycr-reveal"
              onClick={(event) => {
                event.stopPropagation();
                onReveal();
              }}
            >
              Харах
            </button>
          </p>
        ) : null}
        <p className={`ycr-body${hidden ? " is-blurred" : ""}`} aria-hidden={hidden || undefined}>
          {item.body}
        </p>
        <div className="ycr-foot">
          <CommentAvatar author={item.author} small />
          <span className="ycr-name">{item.author.name}</span>
          <time>{item.dateLabel}</time>
        </div>
      </div>
    </div>
  );
}
