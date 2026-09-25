"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Moon } from "lucide-react";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import {
  MangaPosterCard,
  SectionHeader,
  YUME_CARD_STYLES,
  buildGoogleFontsHref,
  formatFontFamily,
  type MangaSeries,
} from "@/app/_components/MangaPosterCard";
import {
  CHAPTER_CARD_STYLES,
  ChapterFeedCards,
} from "@/app/_components/ChapterFeedCards";
import type { ChapterFeedCard } from "@/lib/chapter-feed";

interface GenreFilter {
  name: string;
  mangaCount: number;
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap');

.yume-home * { box-sizing: border-box; }
.yume-home {
  font-family: 'Plus Jakarta Sans', sans-serif;
  --home-cream: #fbf2ee;
  --home-blush: #f6e3e8;
  --home-rose: #d27d9c;
  --home-rose-deep: #b9577b;
  --home-gold: #c8a24c;
  --home-gold-soft: #e4cd93;
  --home-plum: #56414c;
  --home-plum-soft: #8c7681;
  --home-paper: #fffdfb;
  --home-paper-2: #f8ecee;
  --home-line: rgba(200, 162, 76, 0.42);
  --home-line-strong: rgba(200, 162, 76, 0.7);
  --home-shadow: rgba(176, 122, 140, 0.22);
  --home-shadow-strong: rgba(150, 90, 110, 0.32);
  --home-overlay: linear-gradient(to top, rgba(54, 34, 44, 0.92) 4%, rgba(54, 34, 44, 0.45) 38%, transparent 72%);
  --home-on-dark-soft: rgba(255, 245, 248, 0.82);
  color: var(--home-plum);
  background-color: var(--home-cream);
  background-image:
    radial-gradient(circle at 16% 8%, var(--home-blush), transparent 44%),
    radial-gradient(circle at 88% 2%, rgba(210, 125, 156, 0.12), transparent 40%),
    radial-gradient(circle at 50% 102%, rgba(200, 162, 76, 0.08), transparent 55%);
  background-attachment: fixed;
}
html[data-theme="dark"] .yume-home {
  --home-cream: #110b16;
  --home-blush: #1d1426;
  --home-rose: #df9fbf;
  --home-rose-deep: #e7b6cf;
  --home-gold: #d8b56a;
  --home-gold-soft: #b89243;
  --home-plum: #f1e5ee;
  --home-plum-soft: #b6a3b3;
  --home-paper: #191222;
  --home-paper-2: #211830;
  --home-line: rgba(216, 181, 106, 0.32);
  --home-line-strong: rgba(216, 181, 106, 0.55);
  --home-shadow: rgba(0, 0, 0, 0.45);
  --home-shadow-strong: rgba(0, 0, 0, 0.6);
  --home-overlay: linear-gradient(to top, rgba(8, 5, 12, 0.94) 4%, rgba(8, 5, 12, 0.5) 38%, transparent 74%);
  background-image:
    radial-gradient(circle at 16% 8%, rgba(140, 111, 255, 0.14), transparent 44%),
    radial-gradient(circle at 88% 2%, rgba(223, 159, 191, 0.1), transparent 40%),
    radial-gradient(circle at 50% 102%, rgba(216, 181, 106, 0.08), transparent 55%);
}

/* Autumn: the same layout in warm cream, amber and maple, with the watercolour
   corner blooms of the reference frame painted in as background washes. */
html[data-theme="autumn"] .yume-home {
  --home-cream: #fdf4e8;
  --home-blush: #f9dfc2;
  --home-rose: #e08a4a;
  --home-rose-deep: #c25f2a;
  --home-gold: #c19434;
  --home-gold-soft: #e6cd94;
  --home-plum: #59402e;
  --home-plum-soft: #927759;
  --home-paper: #fffaf2;
  --home-paper-2: #f9ead6;
  --home-line: rgba(193, 148, 52, 0.4);
  --home-line-strong: rgba(193, 148, 52, 0.68);
  --home-shadow: rgba(180, 120, 62, 0.2);
  --home-shadow-strong: rgba(150, 88, 40, 0.32);
  --home-overlay: linear-gradient(to top, rgba(58, 34, 18, 0.92) 4%, rgba(58, 34, 18, 0.45) 38%, transparent 72%);
  --home-on-dark-soft: rgba(255, 246, 234, 0.84);
  background-image:
    radial-gradient(circle at 6% 3%, rgba(233, 138, 69, 0.30), transparent 34%),
    radial-gradient(circle at 95% 7%, rgba(207, 95, 43, 0.20), transparent 31%),
    radial-gradient(circle at 3% 94%, rgba(207, 95, 43, 0.22), transparent 33%),
    radial-gradient(circle at 97% 97%, rgba(233, 138, 69, 0.28), transparent 34%),
    radial-gradient(circle at 50% 48%, rgba(255, 251, 244, 0.55), transparent 58%);
}

/* Soften the shared nav tokens inside the home theme */
.yume-home {
  --manga-border: var(--home-line-strong);
  --manga-shadow: var(--home-shadow);
  --manga-text: var(--home-plum);
  --manga-muted: var(--home-plum-soft);
  --manga-muted-2: var(--home-plum-soft);
  --manga-accent: var(--home-rose);
  --manga-paper: var(--home-paper);
  --manga-paper-2: var(--home-paper-2);
  --manga-nav-bg: color-mix(in srgb, var(--home-cream) 86%, transparent);
}

/* Promo strip. aspect-ratio holds the 3:1 box before the image loads, so the
   page below never jumps. One banner fills the row; more share it on desktop
   and stack on phones. */
.yume-promo { display: grid; gap: 16px; }
@media (min-width: 900px) {
  .yume-promo { grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); }
}
.yume-promo-card {
  display: block;
  position: relative;
  aspect-ratio: 3 / 1;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid var(--home-line);
  background: var(--home-paper-2);
  box-shadow: 0 16px 36px -22px var(--home-shadow-strong);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s, border-color 0.35s;
}
.yume-promo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 26px 46px -22px var(--home-shadow-strong);
  border-color: var(--home-line-strong);
}
.yume-promo-card img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}

/* Ranked rail. The badge sits in the poster's top-left: the status ribbon owns
   the top-right and the chapter chip the bottom-left, and the rail clips
   horizontal overflow, so anything hanging off the card edge is cut. */
.yume-ranked { position: relative; }
.yume-ranked .yume-rank {
  position: absolute; z-index: 4;
  top: 8px; left: 8px;
  min-width: 26px; height: 26px; padding: 0 7px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  font-family: 'Marcellus', serif;
  font-size: 13px; font-weight: 700; line-height: 1;
  color: #fff;
  background: linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px -4px rgba(40, 24, 32, 0.5);
  pointer-events: none;
}

/* Featured hero. Its slides are panels cut from inside the manga, one image
   per device: 1:1 on phones and tablets, 16:9 on desktop — split at the same
   900px the home layout already uses. The box holds exactly that ratio and
   the image fills it with object-fit: cover, so the crop the admin previewed
   is the crop readers get. */
.yume-hero {
  position: relative;
  aspect-ratio: 16 / 9;
  /* On short, wide screens a full-width 16:9 box would fill the whole fold.
     Cap the height by narrowing the box instead of squashing it, so the ratio
     — and the crop — never changes. */
  width: min(100%, calc(72vh * 16 / 9));
  margin: 0 auto;
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid var(--home-line-strong);
  box-shadow: 0 30px 60px -28px var(--home-shadow-strong);
  background: var(--home-paper-2);
  touch-action: pan-y;
}
.yume-hero-empty {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 28% 26%, color-mix(in srgb, var(--home-rose) 38%, transparent), transparent 56%),
    radial-gradient(circle at 76% 70%, color-mix(in srgb, var(--home-gold) 30%, transparent), transparent 58%),
    var(--home-paper-2);
}
/* Only a soft gradient along the bottom edge, behind the title. The panel's
   own art and speech bubbles stay uncovered. */
.yume-hero-overlay {
  position: absolute; left: 0; right: 0; bottom: 0; height: 42%;
  background: linear-gradient(to top, rgba(20, 12, 16, 0.7), rgba(20, 12, 16, 0.3) 48%, transparent);
  pointer-events: none;
}
.yume-hero-body {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 3;
  /* Bottom padding leaves room for the dots under the title. */
  padding: 0 clamp(16px, 3.2vw, 40px) clamp(30px, 3.6vw, 44px);
}
.yume-hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic;
  font-size: clamp(1.5rem, 3.4vw, 3rem);
  line-height: 1.04; color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  max-width: min(22ch, 100%);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.yume-hero-slide {
  position: absolute; inset: 0;
  display: block; text-decoration: none; color: inherit;
  opacity: 0; visibility: hidden;
  transition: opacity 0.95s ease, visibility 0.95s ease;
}
.yume-hero-slide.active { opacity: 1; visibility: visible; z-index: 2; }
/* No slow zoom: the panels are exact crops, and scaling them up would cut
   off the edges of the art and its speech bubbles. */
.yume-hero-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; object-position: center;
}
.yume-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  z-index: 5;
  width: 42px; height: 42px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; cursor: pointer;
  background: rgba(28, 16, 22, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(6px);
  opacity: 0; transition: opacity 0.3s, background 0.2s, transform 0.2s;
}
.yume-arrow.left { left: 16px; }
.yume-arrow.right { right: 16px; }
.yume-arrow:hover { background: rgba(28, 16, 22, 0.62); }
.yume-hero:hover .yume-arrow { opacity: 1; }
.yume-arrow:focus-visible { opacity: 1; outline: 2px solid #fff; outline-offset: 2px; }
@media (max-width: 768px) { .yume-arrow { display: none; } }
/* Centred under the title, so a two-line title can never run into them. */
.yume-dots {
  position: absolute; z-index: 5;
  left: 50%; transform: translateX(-50%);
  bottom: clamp(10px, 1.5vw, 18px);
  display: flex; align-items: center; gap: 8px;
}
.yume-dot {
  width: 8px; height: 8px; border-radius: 999px; padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer; transition: all 0.35s ease;
}
.yume-dot.active {
  width: 26px;
  background: linear-gradient(135deg, var(--home-gold-soft), var(--home-rose));
  border-color: transparent;
}
.yume-dot:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .yume-hero-slide { transition: none; }
}

/* Phones/tablets: the hero leads the page as an edge-to-edge 1:1 panel
   directly under the header. The header no longer floats over it — a panel's
   top edge (often a speech bubble) would sit under the logo and buttons. */
@media (max-width: 900px) {
  .yume-home main { padding-top: 0; }
  .yume-home #featured { margin-bottom: 34px; }
  .yume-home #featured .yume-hero {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    aspect-ratio: 1 / 1;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
}
`;

const headerLinks = [
  { label: "Онцлох", href: "/#featured" },
  { label: "Сан", href: "/manga" },
  { label: "Мэдээ", href: "/news" },
];

interface FeaturedSlide {
  id: string;
  title: string;
  /** 1:1 art for phones/tablets (already falls back to desktop, then poster). */
  mobileImage?: string;
  /** 16:9 art for desktop (already falls back to mobile, then poster). */
  desktopImage?: string;
  titleFont?: string | null;
}

const HERO_ROTATE_MS = 6500;

interface ContinueReadingItem {
  id: string;
  title: string;
  coverUrl?: string;
}

interface PromoBanner {
  id: string;
  title: string;
  imageUrl: string;
}

type HomeLandingProps = {
  featured?: FeaturedSlide[];
  continueReading?: ContinueReadingItem[];
  /** "Сүүлийн шинэчлэл": one card per newly published chapter, newest first. */
  latestChapters?: ChapterFeedCard[];
  /** The reader's free reads left today, for the chapter cards' confirm. */
  freeRemaining?: number;
  /** Most-opened series, already ranked. Counts themselves are never sent. */
  topViewed?: MangaSeries[];
  /**
   * The four ad slots, top to bottom (index 0 = slot 1). null = empty slot,
   * which renders nothing and leaves no gap.
   */
  promoSlots?: Array<PromoBanner | null>;
  completed?: MangaSeries[];
  allManga?: MangaSeries[];
  genreFilters?: GenreFilter[];
  isAdmin?: boolean;
  /** Days left on the reader's subscription; null when they have none. */
  premiumDaysLeft?: number | null;
};

export function HomeLanding({
  featured = [],
  continueReading = [],
  latestChapters = [],
  freeRemaining = 0,
  topViewed = [],
  promoSlots = [],
  completed = [],
  allManga = [],
  genreFilters = [],
  isAdmin = false,
  premiumDaysLeft = null,
}: HomeLandingProps) {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const dynamicGenreFilters =
    genreFilters.length > 0
      ? genreFilters
      : getGenreFiltersFromSeries(allManga);
  const filteredManga = activeGenre
    ? allManga.filter((manga) => manga.genres.includes(activeGenre))
    : allManga;

  const fontsToLoad = [
    ...featured.map((slide) => slide.titleFont ?? ""),
    ...latestChapters.map((card) => card.titleFont ?? ""),
    ...[...completed, ...allManga].map((manga) => manga.titleFont ?? ""),
  ].filter(Boolean) as string[];
  const customFontsHref = buildGoogleFontsHref(fontsToLoad);

  return (
    <>
      {customFontsHref ? (
        <link rel="stylesheet" href={customFontsHref} />
      ) : null}
      <style>{YUME_CARD_STYLES}</style>
      <style>{CHAPTER_CARD_STYLES}</style>
      <style>{STYLES}</style>
      <div
        className="yume-home min-h-screen"
        style={{ overflowX: "hidden", position: "relative" }}
      >
        <CelestialFrame />

        <MangaTopNav
          navLinks={headerLinks}
          isAdmin={isAdmin}
          premiumDaysLeft={premiumDaysLeft}
          // A solid bar, not floating over the hero: the slides are manga
          // panels now, and on a phone the logo and buttons would sit on top
          // of the panel's upper edge (often a speech bubble).
        />

        <main
          className="motion-ink-fade mx-auto max-w-7xl px-4 py-8 md:px-8"
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* The curated hero leads the page: an edge-to-edge 1:1 panel on
              phones, 16:9 on desktop. No section heading and no badge — each
              slide shows only its title. */}
          {featured.length > 0 ? (
            <section id="featured" className="motion-ink-up mb-16">
              <HeroCarousel slides={featured} />
            </section>
          ) : null}

          {continueReading.length > 0 ? (
            <ContinueReadingShelf
              className="motion-ink-up motion-ink-up-delay-1"
              items={continueReading}
            />
          ) : null}

          {/* Ad slot 1 sits directly above "Сүүлийн шинэчлэл", so it stays
              in place when "Үргэлжлүүлэн унших" is hidden (signed out or no
              history). Each slot renders nothing when empty. */}
          <PromoSlot banner={promoSlots[0]} slot={1} />

          {latestChapters.length > 0 ? (
            <section id="updates" className="motion-ink-up motion-ink-up-delay-2 mb-14">
              <SectionHeader
                eyebrow="Шинэчлэл"
                title="Сүүлийн шинэчлэл"
                viewAllHref="/updates"
              />
              <ChapterFeedCards
                cards={latestChapters}
                freeRemaining={freeRemaining}
                layout="rail"
              />
            </section>
          ) : null}

          <PromoSlot banner={promoSlots[1]} slot={2} />

          {topViewed.length > 0 ? (
            <TopViewedShelf
              className="motion-ink-up motion-ink-up-delay-2"
              series={topViewed}
            />
          ) : null}

          <PromoSlot banner={promoSlots[2]} slot={3} />

          {completed.length > 0 ? (
            <Shelf
              id="completed"
              className="motion-ink-up motion-ink-up-delay-2"
              eyebrow="Бүрэн орчуулагдсан"
              title="Дууссан"
              viewAllHref="/manga?status=COMPLETED"
              series={completed}
            />
          ) : null}

          <PromoSlot banner={promoSlots[3]} slot={4} />

          <section id="all" className="motion-ink-up motion-ink-up-delay-3 mt-4">
            <SectionHeader eyebrow="Бүх цуглуулга" title="Бүх манга" />

            <div
              className="mb-9 flex flex-nowrap gap-2 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none" }}
            >
              <button
                type="button"
                onClick={() => setActiveGenre(null)}
                className={`yume-pill${activeGenre === null ? " active" : ""}`}
              >
                Бүгд
              </button>
              {dynamicGenreFilters.map((genre) => (
                <button
                  key={genre.name}
                  type="button"
                  title={`${genre.mangaCount} манга`}
                  aria-pressed={activeGenre === genre.name}
                  onClick={() =>
                    setActiveGenre(
                      activeGenre === genre.name ? null : genre.name,
                    )
                  }
                  className={`yume-pill${activeGenre === genre.name ? " active" : ""}`}
                >
                  {genre.name}
                </button>
              ))}
            </div>

            {filteredManga.length > 0 ? (
              <div className="yume-grid">
                {filteredManga.map((manga, index) => (
                  <MangaPosterCard
                    key={manga.id}
                    manga={manga}
                    activeGenre={activeGenre}
                    delayIndex={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState genre={activeGenre} />
            )}
          </section>
        </main>
      </div>
    </>
  );
}

function Shelf({
  eyebrow,
  title,
  series,
  viewAllHref,
  className,
  id,
}: {
  eyebrow: string;
  title: string;
  series: MangaSeries[];
  viewAllHref?: string;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`mb-14 ${className ?? ""}`}>
      <SectionHeader eyebrow={eyebrow} title={title} viewAllHref={viewAllHref} />
      <div className="yume-rail">
        {series.map((manga) => (
          <MangaPosterCard key={manga.id} manga={manga} />
        ))}
      </div>
    </section>
  );
}

/**
 * One owner-supplied ad panel in its fixed homepage slot. Fixed 3:1 artwork, so
 * it holds its shape before the image loads and never reflows the page under
 * the reader. No section heading — the artwork carries its own message. An
 * empty slot returns nothing, so it adds no spacing either.
 */
function PromoSlot({
  banner,
  slot,
}: {
  banner: PromoBanner | null | undefined;
  slot: number;
}) {
  if (!banner) {
    return null;
  }

  return (
    <section
      id={`promo-${slot}`}
      className="motion-ink-up motion-ink-up-delay-2 mb-14"
      aria-label="Онцгой санал"
    >
      <div className="yume-promo">
        <Link
          href={`/manga/${banner.id}`}
          prefetch={false}
          className="yume-promo-card"
          aria-label={banner.title}
        >
          <img src={banner.imageUrl} alt={banner.title} loading="lazy" />
        </Link>
      </div>
    </section>
  );
}

/**
 * Most-opened series, ranked. The position is the whole point, so each card
 * carries its rank — but never the view count itself, which stays admin-only
 * and is not sent to the browser at all.
 */
function TopViewedShelf({
  series,
  className,
}: {
  series: MangaSeries[];
  className?: string;
}) {
  return (
    <section id="top-viewed" className={`mb-14 ${className ?? ""}`}>
      <SectionHeader
        eyebrow="Хамгийн их үзсэн"
        title="Топ 10 үзэлттэй манга"
      />
      <div className="yume-rail">
        {series.map((manga, index) => (
          <div key={manga.id} className="yume-ranked">
            <span className="yume-rank" aria-hidden="true">
              {index + 1}
            </span>
            <MangaPosterCard manga={manga} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ContinueReadingShelf({
  items,
  className,
}: {
  items: ContinueReadingItem[];
  className?: string;
}) {
  return (
    <section className={`mb-14 ${className ?? ""}`}>
      <SectionHeader eyebrow="Таны түүх" title="Үргэлжлүүлэн унших" />
      <div className="yume-rail">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/manga/${item.id}`}
            prefetch={false}
            className="yume-card"
            aria-label={item.title}
          >
            <div className="yume-poster">
              {item.coverUrl ? (
                <img src={item.coverUrl} alt={item.title} loading="lazy" />
              ) : (
                <div className="yume-poster-empty">
                  <BookOpen size={30} />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HeroCarousel({ slides }: { slides: FeaturedSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;

  const goTo = useCallback(
    (next: number) => setActive((next % count + count) % count),
    [count],
  );
  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % count);
    }, HERO_ROTATE_MS);

    return () => window.clearTimeout(timer);
  }, [active, paused, reducedMotion, count]);

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) {
      return;
    }

    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;

    if (delta < -45) {
      next();
    } else if (delta > 45) {
      prev();
    }

    touchStartX.current = null;
  }

  return (
    <div
      className="yume-hero"
      role="region"
      aria-roledescription="carousel"
      aria-label="Онцлох цувралууд"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => (
        <Link
          key={slide.id}
          href={`/manga/${slide.id}`}
          prefetch={false}
          className={`yume-hero-slide${index === active ? " active" : ""}`}
          aria-hidden={index !== active}
          tabIndex={index === active ? 0 : -1}
          aria-label={slide.title}
          style={
            reducedMotion ? { transition: "none" } : undefined
          }
        >
          {slide.mobileImage || slide.desktopImage ? (
            // Art direction: the browser picks one source by viewport and
            // downloads only that one. The media query matches the 900px
            // split where the box itself turns from 1:1 to 16:9.
            <picture>
              {slide.desktopImage && slide.desktopImage !== slide.mobileImage ? (
                <source media="(min-width: 901px)" srcSet={slide.desktopImage} />
              ) : null}
              <img
                src={slide.mobileImage ?? slide.desktopImage}
                alt={slide.title}
                className="yume-hero-img"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </picture>
          ) : (
            <div className="yume-hero-empty" />
          )}
          <div className="yume-hero-overlay" />

          <div className="yume-hero-body">
            <h2
              className="yume-hero-title"
              style={
                slide.titleFont
                  ? { fontFamily: formatFontFamily(slide.titleFont) }
                  : undefined
              }
            >
              {slide.title}
            </h2>
          </div>
        </Link>
      ))}

      {count > 1 ? (
        <>
          <button
            type="button"
            className="yume-arrow left"
            aria-label="Өмнөх"
            onClick={prev}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="yume-arrow right"
            aria-label="Дараах"
            onClick={next}
          >
            <ChevronRight size={20} />
          </button>

          <div className="yume-dots" role="tablist" aria-label="Слайд сонгох">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-label={`${index + 1}-р слайд: ${slide.title}`}
                aria-selected={index === active}
                className={`yume-dot${index === active ? " active" : ""}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function EmptyState({ genre }: { genre: string | null }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-3xl py-16 text-center"
      style={{
        border: "1px solid var(--home-line)",
        background: "var(--home-paper)",
        color: "var(--home-plum-soft)",
      }}
    >
      <Moon size={26} style={{ color: "var(--home-gold)" }} />
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>
        {genre ? `"${genre}" төрөлд манга алга байна.` : "Манга алга байна."}
      </p>
    </div>
  );
}

function getGenreFiltersFromSeries(series: MangaSeries[]) {
  const counts = new Map<string, number>();

  for (const manga of series) {
    for (const genre of manga.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, mangaCount]) => ({ name, mangaCount }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
