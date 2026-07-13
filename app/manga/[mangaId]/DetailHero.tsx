"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  Images,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import { setPosterChoiceAction } from "@/app/manga/[mangaId]/actions";

type GenreTag = {
  id: string;
  name: string;
};

type PosterOption = {
  url: string;
  /** Source chapter number (null = series art, always unlocked). */
  chapterNumber: number | null;
  /** Locked = drawn from a chapter the reader hasn't reached (spoiler). */
  locked: boolean;
};

type DetailHeroProps = {
  mangaId: string;
  mangaName: string;
  statusLabel: string;
  genreTags: GenreTag[];
  defaultCover: string | null;
  posterOptions: PosterOption[];
  initialPoster: string | null;
  firstChapterId: string | null;
  canChoosePoster: boolean;
};

export function DetailHero({
  mangaId,
  mangaName,
  statusLabel,
  genreTags,
  defaultCover,
  posterOptions,
  initialPoster,
  firstChapterId,
  canChoosePoster,
}: DetailHeroProps) {
  const [selectedPoster, setSelectedPoster] = useState<string | null>(
    initialPoster,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const heroCover = selectedPoster ?? defaultCover;

  // Close the sheet with Escape and lock body scroll while it is open.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function choosePoster(option: PosterOption) {
    if (option.locked) {
      return;
    }
    // Optimistic: swap the cover and close immediately, then persist.
    setSelectedPoster(option.url);
    setIsOpen(false);
    startTransition(async () => {
      await setPosterChoiceAction(mangaId, option.url);
    });
  }

  return (
    <section className="motion-ink-up motion-ink-up-delay-1 yd-hero">
      {heroCover ? (
        <img src={heroCover} alt={mangaName} className="yd-hero-img" />
      ) : (
        <div className="yd-hero-empty">
          <Sparkles size={42} />
        </div>
      )}
      <div className="yd-hero-overlay" />
      <div className="yd-hero-body">
        <span className="yd-eyebrow yd-hero-eyebrow">
          <Sparkles size={13} />
          {statusLabel}
        </span>
        <h1 className="yd-title">{mangaName}</h1>
        <div className="yd-tags">
          {genreTags.map((tag) => (
            <span key={tag.id} className="yd-tag">
              {tag.name}
            </span>
          ))}
        </div>
        <div className="yd-hero-actions">
          {firstChapterId ? (
            <Link href={`/reader/${firstChapterId}`} className="yd-btn">
              <BookOpen size={15} />
              Уншиж эхлэх
              <ChevronRight size={15} />
            </Link>
          ) : (
            <span className="yd-btn-muted">Уншах боломжтой бүлэг алга</span>
          )}

          {canChoosePoster ? (
            <button
              type="button"
              className="yd-poster-btn"
              onClick={() => setIsOpen(true)}
            >
              <Images size={15} />
              Постер сонгох
            </button>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div
          className="yd-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Постер сонгох"
          onClick={() => setIsOpen(false)}
        >
          <div className="yd-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="yd-sheet-head">
              <div>
                <p className="yd-sheet-sub">Постер</p>
                <h2 className="yd-sheet-title">Постер сонгох</h2>
              </div>
              <button
                type="button"
                className="yd-sheet-close"
                aria-label="Хаах"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="yd-sheet-note">
              Уншсан бүлгүүдээс постер сонгоно. Уншаагүй бүлгийн постер түгжээтэй.
            </p>

            <div className="yd-poster-grid">
              {posterOptions.map((option, index) => {
                const isActive = !option.locked && option.url === selectedPoster;

                return (
                  <button
                    key={`${option.url}-${index}`}
                    type="button"
                    className={`yd-poster-opt${isActive ? " active" : ""}${
                      option.locked ? " locked" : ""
                    }`}
                    aria-pressed={isActive}
                    aria-disabled={option.locked}
                    aria-label={
                      option.locked
                        ? `Түгжээтэй постер${option.chapterNumber ? ` — Бүлэг ${option.chapterNumber}` : ""}`
                        : `Постер ${index + 1}`
                    }
                    disabled={isPending || option.locked}
                    onClick={() => choosePoster(option)}
                  >
                    <img
                      src={option.url}
                      alt={
                        option.locked
                          ? "Түгжээтэй постер"
                          : `${mangaName} постер ${index + 1}`
                      }
                    />
                    {option.locked ? (
                      <span className="yd-poster-lock">
                        <Lock size={16} />
                        {option.chapterNumber ? (
                          <span className="yd-poster-lock-label">
                            Бүлэг {option.chapterNumber}
                          </span>
                        ) : null}
                      </span>
                    ) : isActive ? (
                      <span className="yd-poster-check">
                        <Check size={15} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
