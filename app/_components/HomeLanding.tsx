"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Moon, Sparkles } from "lucide-react";
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

.yume-hero {
  position: relative;
  border-radius: 26px;
  overflow: hidden;
  min-height: clamp(360px, 52vw, 540px);
  border: 1px solid var(--home-line-strong);
  box-shadow: 0 30px 60px -28px var(--home-shadow-strong);
  background: var(--home-paper-2);
}
.yume-hero-empty {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 28% 26%, color-mix(in srgb, var(--home-rose) 38%, transparent), transparent 56%),
    radial-gradient(circle at 76% 70%, color-mix(in srgb, var(--home-gold) 30%, transparent), transparent 58%),
    var(--home-paper-2);
}
.yume-hero-overlay { position: absolute; inset: 0; background: var(--home-overlay); }
.yume-hero-body {
  position: absolute; inset: 0; z-index: 3;
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: clamp(22px, 4vw, 48px);
}
.yume-hero-badge {
  display: inline-flex; align-items: center; gap: 7px;
  align-self: flex-start;
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;
  padding: 7px 16px; border-radius: 999px;
  color: var(--home-gold);
  background: rgba(28, 16, 22, 0.45);
  border: 1px solid color-mix(in srgb, var(--home-gold) 55%, transparent);
  backdrop-filter: blur(6px);
  margin-bottom: 18px;
}
.yume-hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic;
  font-size: clamp(2.6rem, 7vw, 5rem);
  line-height: 0.96; color: #fff;
  text-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  max-width: 16ch;
}
.yume-spark { position: absolute; z-index: 4; color: rgba(255, 255, 255, 0.75); pointer-events: none; }

.yume-hero-slide {
  position: absolute; inset: 0;
  display: block; text-decoration: none; color: inherit;
  opacity: 0; visibility: hidden;
  transition: opacity 0.95s ease, visibility 0.95s ease;
}
.yume-hero-slide.active { opacity: 1; visibility: visible; z-index: 2; }
.yume-hero-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
  /* Faces sit in the upper third of most covers — anchor there so the crop
     never cuts them off on short/wide viewports. */
  object-position: center top;
  transform: scale(1.06);
  transition: transform 7.5s ease-out;
}
.yume-hero-slide.active .yume-hero-img { transform: scale(1); }
.yume-hero-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.yume-hero-tag {
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 5px 12px; border-radius: 999px;
  color: var(--home-on-dark-soft);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(4px);
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
.yume-dots {
  position: absolute; z-index: 5;
  bottom: clamp(18px, 3vw, 30px); right: clamp(22px, 4vw, 48px);
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
  .yume-hero-img { transition: none; transform: scale(1); }
}

/* Phones/tablets: the hero leads the page, bleeding to every edge and pushing
   up under the transparent header so it blends into the content below.
   Desktop is unchanged. */
@media (max-width: 900px) {
  .yume-home main { padding-top: 0; }
  .yume-home #featured { margin-bottom: 34px; }
  .yume-home #featured .yume-hero {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    min-height: 60vh;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
}
`;

const headerLinks = [
  { label: "Онцлох", href: "/#featured" },
  { label: "Сан", href: "/manga" },
  { label: "Бидний тухай", href: "/about" },
];

interface FeaturedSlide {
  id: string;
  title: string;
  coverUrl?: string;
  titleFont?: string | null;
  genres: string[];
}

const HERO_ROTATE_MS = 6500;

interface ContinueReadingItem {
  id: string;
  title: string;
  coverUrl?: string;
}

type HomeLandingProps = {
  featured?: FeaturedSlide[];
  continueReading?: ContinueReadingItem[];
  latestUpdates?: MangaSeries[];
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
  latestUpdates = [],
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
    ...[...latestUpdates, ...completed, ...allManga].map(
      (manga) => manga.titleFont ?? "",
    ),
  ].filter(Boolean) as string[];
  const customFontsHref = buildGoogleFontsHref(fontsToLoad);

  return (
    <>
      {customFontsHref ? (
        <link rel="stylesheet" href={customFontsHref} />
      ) : null}
      <style>{YUME_CARD_STYLES}</style>
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
          overlay
        />

        <main
          className="motion-ink-fade mx-auto max-w-7xl px-4 py-8 md:px-8"
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* The curated hero leads the page: full-bleed on phones, tucked up
              under the transparent header. No section heading above it — the
              slide's own "Онцлох" badge names it. */}
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

          {latestUpdates.length > 0 ? (
            <Shelf
              id="updates"
              className="motion-ink-up motion-ink-up-delay-2"
              eyebrow="Шинэчлэл"
              title="Сүүлийн шинэчлэл"
              viewAllHref="/manga"
              series={latestUpdates}
            />
          ) : null}

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
          className={`yume-hero-slide${index === active ? " active" : ""}`}
          aria-hidden={index !== active}
          tabIndex={index === active ? 0 : -1}
          aria-label={slide.title}
          style={
            reducedMotion ? { transition: "none" } : undefined
          }
        >
          {slide.coverUrl ? (
            <img
              src={slide.coverUrl}
              alt={slide.title}
              className="yume-hero-img"
              loading={index === 0 ? "eager" : "lazy"}
            />
          ) : (
            <div className="yume-hero-empty" />
          )}
          <div className="yume-hero-overlay" />

          <div className="yume-hero-body">
            <span className="yume-hero-badge">
              <Sparkles size={13} />
              Онцлох
            </span>
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
            {slide.genres.length > 0 ? (
              <div className="yume-hero-tags">
                {slide.genres.map((genre) => (
                  <span key={genre} className="yume-hero-tag">
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Link>
      ))}

      <Sparkles
        className="yume-spark motion-ink-float"
        size={20}
        style={{ top: "16%", right: "12%" }}
      />
      <Moon
        className="yume-spark"
        size={16}
        style={{ top: "20%", left: "10%", opacity: 0.55 }}
      />

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
