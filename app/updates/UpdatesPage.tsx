import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { loadChapterFeed } from "@/lib/chapter-feed";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import {
  SectionHeader,
  YUME_CARD_STYLES,
  buildGoogleFontsHref,
} from "@/app/_components/MangaPosterCard";
import {
  CHAPTER_CARD_STYLES,
  ChapterFeedCards,
} from "@/app/_components/ChapterFeedCards";

/** Cards per page: 2/3/4 columns divide it evenly. */
export const UPDATES_PAGE_SIZE = 24;

export function updatesPageHref(page: number) {
  return page <= 1 ? "/updates" : `/updates/page/${page}`;
}

const UPDATES_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap');

.yume-updates { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-updates * { box-sizing: border-box; }
.yume-updates .yu-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--home-plum-soft); text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}
.yume-updates .yu-back:hover { color: var(--home-rose-deep); transform: translateX(-2px); }
.yume-updates .yu-pager {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px;
  margin-top: 36px;
}
.yume-updates .yu-page-count {
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--home-plum-soft);
}
.yume-updates .yu-empty {
  border-radius: 24px; border: 1px dashed var(--home-line-strong);
  background: var(--home-paper); padding: 60px 24px; text-align: center;
  color: var(--home-plum-soft);
}
`;

/**
 * One page of the "Сүүлийн шинэчлэл" chapter feed, identical for every reader
 * so it can be cached. Locks are drawn as a free reader sees them; the cards
 * fetch the per-reader half (premium, free-read confirmations) themselves.
 */
export async function UpdatesPage({ page }: { page: number }) {
  const feed = await loadChapterFeed({
    skip: (page - 1) * UPDATES_PAGE_SIZE,
    take: UPDATES_PAGE_SIZE,
    viewer: null,
  });
  const pageCount = Math.max(1, Math.ceil(feed.total / UPDATES_PAGE_SIZE));

  // Past the last page: a 404, not an empty page cached for five minutes.
  if (page > pageCount) {
    notFound();
  }
  const fontsHref = buildGoogleFontsHref(
    feed.cards.map((card) => card.titleFont ?? "").filter(Boolean),
  );

  return (
    <>
      {fontsHref ? <link rel="stylesheet" href={fontsHref} /> : null}
      <style>{YUME_CARD_STYLES}</style>
      <style>{CHAPTER_CARD_STYLES}</style>
      <style>{UPDATES_STYLES}</style>

      <div className="yume-surface yume-updates relative min-h-screen">
        <CelestialFrame />

        <MangaTopNav />

        <main
          className="motion-ink-fade relative mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8"
          style={{ zIndex: 1 }}
        >
          <Link href="/" className="yu-back motion-ink-up">
            <ChevronLeft size={14} />
            Нүүр
          </Link>

          <div className="mt-6">
            <SectionHeader eyebrow="Шинэчлэл" title="Сүүлийн шинэчлэл" />
          </div>

          {feed.cards.length > 0 ? (
            <ChapterFeedCards
              cards={feed.cards}
              freeRemaining={0}
              layout="grid"
              viewerFlags="client"
            />
          ) : (
            <div className="yu-empty">Энэ хуудсанд бүлэг алга.</div>
          )}

          {pageCount > 1 ? (
            <nav className="yu-pager" aria-label="Хуудаслалт">
              {page > 1 ? (
                <Link href={updatesPageHref(page - 1)} className="yume-pill">
                  <ChevronLeft size={13} className="-mt-0.5 inline" /> Өмнөх
                </Link>
              ) : null}
              <span className="yu-page-count">
                {page} / {pageCount}
              </span>
              {page < pageCount ? (
                <Link href={updatesPageHref(page + 1)} className="yume-pill">
                  Дараах <ChevronRight size={13} className="-mt-0.5 inline" />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </main>
      </div>
    </>
  );
}
