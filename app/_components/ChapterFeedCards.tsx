"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { BookOpen, Clock3, Lock } from "lucide-react";
import {
  FreeReadConfirm,
  isModifiedClick,
} from "@/app/_components/FreeReadConfirm";
import {
  STATUS_LABELS,
  formatFontFamily,
} from "@/app/_components/MangaPosterCard";
import type { ChapterFeedCard, ViewerFeedFlags } from "@/lib/chapter-feed";

const STATUS_MODIFIER: Record<ChapterFeedCard["status"], string> = {
  ONGOING: "",
  COMPLETED: " is-completed",
  CATCHING_UP: " is-catching-up",
  STOPPED: " is-stopped",
};

/** Extra rules on top of YUME_CARD_STYLES for chapter cards. */
export const CHAPTER_CARD_STYLES = `
.yume-card-time {
  display: inline-flex; align-items: center; gap: 5px;
  margin-top: 5px;
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.12em;
  color: var(--home-plum-soft);
}
.yume-chip .yume-chip-lock { display: inline-block; margin: -2px 4px 0 0; vertical-align: middle; }
`;

function ChapterCard({
  card,
  onOpen,
}: {
  card: ChapterFeedCard;
  onOpen: (event: React.MouseEvent<HTMLAnchorElement>, card: ChapterFeedCard) => void;
}) {
  return (
    <Link
      href={`/reader/${card.chapterId}`}
      // Not prefetched: every card on screen would otherwise run the reader
      // page on the server before anyone taps it.
      prefetch={false}
      onClick={(event) => onOpen(event, card)}
      className="yume-card"
      aria-label={`${card.mangaTitle} — Ch. ${card.chapterNumber}`}
    >
      <div className="yume-poster">
        <span className={`yume-status${STATUS_MODIFIER[card.status]}`}>
          {STATUS_LABELS[card.status]}
        </span>
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt=""
            loading="lazy"
            style={card.imagePosition === "top" ? { objectPosition: "top" } : undefined}
          />
        ) : (
          <div className="yume-poster-empty">
            <BookOpen size={30} />
          </div>
        )}
        <span className="yume-chip">
          {card.isPaywalled ? (
            <Lock size={10} className="yume-chip-lock" aria-label="Зөвхөн багцтай" />
          ) : null}
          Ch. {card.chapterNumber}
        </span>
      </div>
      <p className="yume-card-genre">{card.genre}</p>
      <h4
        className="yume-card-title"
        style={
          card.titleFont ? { fontFamily: formatFontFamily(card.titleFont) } : undefined
        }
      >
        {card.mangaTitle}
      </h4>
      <p className="yume-card-time">
        <Clock3 size={11} />
        <time dateTime={card.publishedAt}>{card.timeLabel}</time>
      </p>
    </Link>
  );
}

/**
 * Chapter cards as a horizontal rail (homepage) or a grid (/updates). A tap
 * on a card that would spend a daily free read asks first, the same guard the
 * detail page's chapter list uses; the reader enforces the actual rules.
 */
export function ChapterFeedCards({
  cards: baseCards,
  freeRemaining: baseFreeRemaining,
  layout,
  viewerFlags = "server",
}: {
  cards: ChapterFeedCard[];
  freeRemaining: number;
  layout: "rail" | "grid";
  /**
   * "server": the page already worked out the reader's locks and free-read
   * costs. "client": the page is cached and the same for everyone, so the
   * cards ask for this reader's half themselves (signed-in readers only).
   */
  viewerFlags?: "server" | "client";
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [confirming, setConfirming] = useState<ChapterFeedCard | null>(null);
  const [flags, setFlags] = useState<{
    key: string;
    value: ViewerFeedFlags;
  } | null>(null);
  const idsKey = baseCards.map((card) => card.chapterId).join(",");

  useEffect(() => {
    if (viewerFlags !== "client" || !isSignedIn || !idsKey) {
      return;
    }

    let cancelled = false;
    fetch("/api/reading/feed-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterIds: idsKey.split(",") }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((value: ViewerFeedFlags | null) => {
        if (!cancelled && value) {
          setFlags({ key: idsKey, value });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [viewerFlags, isSignedIn, idsKey]);

  // Until (or unless) the reader's flags arrive, cards behave as for a free
  // reader who has not used a read today: locks shown, no confirm. The reader
  // page still enforces every rule on open.
  const clientFlags = flags?.key === idsKey ? flags.value : null;
  const spend = new Set(clientFlags?.spendIds ?? []);
  const cards =
    viewerFlags === "client"
      ? baseCards.map((card) => ({
          ...card,
          isPaywalled: clientFlags?.premium ? false : card.isPaywalled,
          spendsFreeRead: spend.has(card.chapterId),
        }))
      : baseCards;
  const freeRemaining =
    viewerFlags === "client" ? (clientFlags?.freeRemaining ?? 0) : baseFreeRemaining;

  function onOpen(event: React.MouseEvent<HTMLAnchorElement>, card: ChapterFeedCard) {
    if (!card.spendsFreeRead || isModifiedClick(event)) {
      return;
    }

    event.preventDefault();
    setConfirming(card);
  }

  return (
    <>
      <div className={layout === "rail" ? "yume-rail" : "yume-grid"}>
        {cards.map((card) => (
          <ChapterCard key={card.chapterId} card={card} onOpen={onOpen} />
        ))}
      </div>

      <FreeReadConfirm
        chapterNumber={confirming?.chapterNumber ?? null}
        remaining={freeRemaining}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const target = confirming;
          setConfirming(null);
          if (target) {
            router.push(`/reader/${target.chapterId}`);
          }
        }}
      />
    </>
  );
}
