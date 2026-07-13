"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sparkles,
  Star,
} from "lucide-react";
import { MangaTopNav } from "@/app/_components/MangaTopNav";

type MangaStatusValue =
  | "ONGOING"
  | "COMPLETED"
  | "CATCHING_UP"
  | "FINISHED_RELEASING"
  | "HIATUS";

interface MangaSeries {
  id: string;
  title: string;
  genres: string[];
  latestChapter: number;
  coverUrl?: string;
  status?: MangaStatusValue;
  titleFont?: string | null;
}

const STATUS_LABELS: Record<MangaStatusValue, string> = {
  ONGOING: "Гарч байгаа",
  COMPLETED: "Дууссан",
  CATCHING_UP: "Гүйцэж байна",
  FINISHED_RELEASING: "Эх дууссан",
  HIATUS: "Завсарласан",
};

const DEFAULT_TITLE_FONT = "Cormorant Garamond";
const FONT_FAMILY_FALLBACKS: Record<string, string> = {
  Bangers: "cursive",
  "Permanent Marker": "cursive",
  "Special Elite": "cursive",
  Anton: "sans-serif",
  Bungee: "cursive",
  "Bowlby One": "cursive",
  Creepster: "cursive",
  "Black Ops One": "cursive",
  Rubik: "sans-serif",
  "Cormorant Garamond": "serif",
};

function formatFontFamily(fontName: string | null | undefined) {
  const family = (fontName ?? "").trim();

  if (!family) {
    return `'${DEFAULT_TITLE_FONT}', serif`;
  }

  const fallback = FONT_FAMILY_FALLBACKS[family] ?? "serif";
  return `'${family.replaceAll("'", "")}', ${fallback}`;
}

function buildGoogleFontsHref(fontNames: string[]) {
  const families = [...new Set(fontNames.filter(Boolean))]
    .map(
      (font) =>
        `family=${encodeURIComponent(font.trim()).replace(/%20/g, "+")}:wght@400;500;600;700;800;900`,
    )
    .join("&");

  if (!families) {
    return null;
  }

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

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

.yume-frame { position: fixed; inset: 0; z-index: 0; pointer-events: none; color: var(--home-gold); }
.yume-frame .corner { position: absolute; opacity: 0.6; }
.yume-frame .c-tl { top: 14px; left: 14px; }
.yume-frame .c-tr { top: 14px; right: 14px; transform: scaleX(-1); }
.yume-frame .c-bl { bottom: 14px; left: 14px; transform: scaleY(-1); }
.yume-frame .c-br { bottom: 14px; right: 14px; transform: scale(-1, -1); }
.yume-frame .edge { position: absolute; opacity: 0.5; }
.yume-frame .e-l { top: 50%; left: 10px; transform: translateY(-50%); }
.yume-frame .e-r { top: 50%; right: 10px; transform: translateY(-50%) scaleX(-1); }
@media (max-width: 900px) {
  .yume-frame .edge { display: none; }
  .yume-frame .corner { opacity: 0.4; transform-origin: center; }
  .yume-frame .c-tl, .yume-frame .c-bl, .yume-frame .c-tr, .yume-frame .c-br { width: 88px; }
}

.yume-eyebrow {
  font-family: 'Marcellus', serif;
  font-size: 11px;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: var(--home-gold);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.yume-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-style: italic;
  font-size: clamp(28px, 4.2vw, 44px);
  line-height: 1.02;
  color: var(--home-plum);
  white-space: nowrap;
}
.yume-flourish { position: relative; flex: 1; height: 1px; min-width: 36px; }
.yume-flourish::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to right, var(--home-line-strong), var(--home-line) 40%, transparent);
}
.yume-viewall {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--home-rose-deep); text-decoration: none; white-space: nowrap;
  transition: color 0.2s, transform 0.2s;
}
.yume-viewall:hover { color: var(--home-gold); transform: translateX(2px); }

.yume-rail {
  display: flex; gap: 18px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 6px 2px 18px;
  margin: 0 -2px;
  scrollbar-width: thin;
  scrollbar-color: var(--home-line-strong) transparent;
}
.yume-rail::-webkit-scrollbar { height: 6px; }
.yume-rail::-webkit-scrollbar-thumb { background: var(--home-line-strong); border-radius: 999px; }
.yume-rail::-webkit-scrollbar-track { background: transparent; }
.yume-rail > * { scroll-snap-align: start; flex: 0 0 auto; width: 158px; }
@media (min-width: 640px) { .yume-rail > * { width: 178px; } }

.yume-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 18px;
}
@media (min-width: 560px) { .yume-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 880px) { .yume-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (min-width: 1180px) { .yume-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }

.yume-card { display: block; text-decoration: none; cursor: pointer; }
.yume-poster {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 16px;
  overflow: hidden;
  background: var(--home-paper-2);
  border: 1px solid var(--home-line);
  box-shadow: 0 14px 32px -16px var(--home-shadow-strong);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s, border-color 0.4s;
}
.yume-poster::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  pointer-events: none;
}
.yume-card:hover .yume-poster {
  transform: translateY(-7px);
  box-shadow: 0 26px 44px -18px var(--home-shadow-strong);
  border-color: var(--home-line-strong);
}
.yume-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
.yume-poster-empty {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--home-gold);
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--home-rose) 22%, transparent), transparent 60%),
    var(--home-paper-2);
}
.yume-chip {
  position: absolute; left: 10px; bottom: 10px; z-index: 3;
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.12em;
  padding: 4px 10px; border-radius: 999px;
  color: #fff;
  background: rgba(40, 24, 32, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
}
.yume-status {
  position: absolute; top: 10px; left: 10px; z-index: 3;
  font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 4px 9px; border-radius: 999px;
  color: var(--home-rose-deep);
  background: color-mix(in srgb, var(--home-paper) 88%, transparent);
  border: 1px solid var(--home-line);
  backdrop-filter: blur(4px);
}
.yume-card-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 1.16;
  color: var(--home-plum);
  margin-top: 11px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;
}
.yume-card:hover .yume-card-title { color: var(--home-rose-deep); }
.yume-card-genre {
  font-family: 'Marcellus', serif;
  font-size: 9.5px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--home-gold);
  margin-top: 4px;
}

.yume-pill {
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.1em;
  padding: 7px 16px; border-radius: 999px;
  border: 1px solid var(--home-line);
  background: var(--home-paper);
  color: var(--home-plum);
  cursor: pointer; white-space: nowrap;
  transition: all 0.2s;
}
.yume-pill:hover { border-color: var(--home-rose); color: var(--home-rose-deep); }
.yume-pill.active {
  background: linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%);
  border-color: transparent; color: #fff;
  box-shadow: 0 8px 18px -8px var(--home-rose-deep);
}

.yume-btn {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 12px 26px; border-radius: 999px;
  color: #fff; text-decoration: none;
  background: linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%);
  box-shadow: 0 14px 30px -12px var(--home-rose-deep);
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}
.yume-btn:hover { transform: translateY(-2px); box-shadow: 0 20px 36px -12px var(--home-rose-deep); }

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
.yume-hero-sub {
  color: var(--home-on-dark-soft);
  font-size: 14px; line-height: 1.65;
  max-width: 52ch; margin-top: 16px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.yume-hero-actions { margin-top: 22px; }
.yume-spark { position: absolute; z-index: 4; color: rgba(255, 255, 255, 0.75); pointer-events: none; }

.yume-hero-slide {
  position: absolute; inset: 0;
  opacity: 0; visibility: hidden;
  transition: opacity 0.95s ease, visibility 0.95s ease;
}
.yume-hero-slide.active { opacity: 1; visibility: visible; z-index: 2; }
.yume-hero-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
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

/* Phones/tablets: the hero bleeds to every edge and pushes up under the
   transparent header, blending into the content below. Desktop is unchanged. */
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
  { label: "Сан", href: "/#all" },
];

interface FeaturedSlide {
  id: string;
  title: string;
  subtitle: string;
  chapter: number;
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
  newlyAdded?: MangaSeries[];
  latestUpdates?: MangaSeries[];
  popular?: MangaSeries[];
  allManga?: MangaSeries[];
  genreFilters?: GenreFilter[];
  isAdmin?: boolean;
};

export function HomeLanding({
  featured = [],
  continueReading = [],
  newlyAdded = [],
  latestUpdates = [],
  popular = [],
  allManga = [],
  genreFilters = [],
  isAdmin = false,
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
    ...[...newlyAdded, ...latestUpdates, ...popular, ...allManga].map(
      (manga) => manga.titleFont ?? "",
    ),
  ].filter(Boolean) as string[];
  const customFontsHref = buildGoogleFontsHref(fontsToLoad);

  return (
    <>
      {customFontsHref ? (
        <link rel="stylesheet" href={customFontsHref} />
      ) : null}
      <style>{STYLES}</style>
      <div
        className="yume-home min-h-screen"
        style={{ overflowX: "hidden", position: "relative" }}
      >
        <CelestialFrame />

        <MangaTopNav navLinks={headerLinks} isAdmin={isAdmin} overlay />

        <main
          className="motion-ink-fade mx-auto max-w-7xl px-4 py-8 md:px-8"
          style={{ position: "relative", zIndex: 1 }}
        >
          {featured.length > 0 ? (
            <section id="featured" className="motion-ink-up mb-16">
              <HeroCarousel slides={featured} />
            </section>
          ) : null}

          {continueReading.length > 0 ? (
            <ContinueReadingShelf
              className="motion-ink-up"
              items={continueReading}
            />
          ) : null}

          {newlyAdded.length > 0 ? (
            <Shelf
              className="motion-ink-up motion-ink-up-delay-1"
              eyebrow="Шинэхэн"
              title="Шинээр нэмэгдсэн"
              viewAllHref="/manga"
              series={newlyAdded}
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

          {popular.length > 0 ? (
            <Shelf
              className="motion-ink-up motion-ink-up-delay-2"
              eyebrow="Уншигчдын дуртай"
              title="Онцлох цувралууд"
              viewAllHref="/manga"
              series={popular}
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

function SectionHeader({
  eyebrow,
  title,
  viewAllHref,
}: {
  eyebrow: string;
  title: string;
  viewAllHref?: string;
}) {
  return (
    <header className="mb-6">
      <p className="yume-eyebrow">
        <Star size={11} fill="currentColor" strokeWidth={0} />
        {eyebrow}
      </p>
      <div className="mt-2 flex items-center gap-4 sm:gap-5">
        <h2 className="yume-title">{title}</h2>
        <span className="yume-flourish">
          <Sparkles
            size={14}
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--home-gold)",
            }}
          />
        </span>
        {viewAllHref ? (
          <Link href={viewAllHref} className="yume-viewall">
            Бүгдийг үзэх
            <ChevronRight size={13} />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

function MangaPosterCard({
  manga,
  activeGenre = null,
  delayIndex,
}: {
  manga: MangaSeries;
  activeGenre?: string | null;
  delayIndex?: number;
}) {
  const card = (
    <>
      <div className="yume-poster">
        {manga.status ? (
          <span className="yume-status">{STATUS_LABELS[manga.status]}</span>
        ) : null}
        {manga.coverUrl ? (
          <img src={manga.coverUrl} alt={manga.title} loading="lazy" />
        ) : (
          <div className="yume-poster-empty">
            <BookOpen size={30} />
          </div>
        )}
        <span className="yume-chip">Ch. {manga.latestChapter || 0}</span>
      </div>
      <p className="yume-card-genre">{getGenreLabel(manga, activeGenre)}</p>
      <h4
        className="yume-card-title"
        style={
          manga.titleFont
            ? { fontFamily: formatFontFamily(manga.titleFont) }
            : undefined
        }
      >
        {manga.title}
      </h4>
    </>
  );

  if (typeof delayIndex === "number") {
    return (
      <Link
        href={`/manga/${manga.id}`}
        className="yume-card motion-ink-up"
        style={{ animationDelay: `${Math.min(delayIndex, 9) * 55}ms` }}
      >
        {card}
      </Link>
    );
  }

  return (
    <Link href={`/manga/${manga.id}`} className="yume-card">
      {card}
    </Link>
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
        <div
          key={slide.id}
          className={`yume-hero-slide${index === active ? " active" : ""}`}
          aria-hidden={index !== active}
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
            <p className="yume-hero-sub">{slide.subtitle}</p>
            {slide.genres.length > 0 ? (
              <div className="yume-hero-tags">
                {slide.genres.map((genre) => (
                  <span key={genre} className="yume-hero-tag">
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="yume-hero-actions">
              <Link
                href={`/manga/${slide.id}`}
                className="yume-btn"
                tabIndex={index === active ? 0 : -1}
              >
                <BookOpen size={15} />
                Ch. {slide.chapter} Унших
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
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

/** Gold celestial corner + edge ornaments inspired by the reference frame. */
function CelestialFrame() {
  return (
    <div className="yume-frame" aria-hidden="true">
      <CornerOrnament className="corner c-tl" />
      <CornerOrnament className="corner c-tr" />
      <CornerOrnament className="corner c-bl" />
      <CornerOrnament className="corner c-br" />
      <EdgeOrnament className="edge e-l" />
      <EdgeOrnament className="edge e-r" />
    </div>
  );
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="118"
      height="118"
      viewBox="0 0 118 118"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* sweeping arc */}
      <path
        d="M6 112 C 6 56 56 6 112 6"
        strokeWidth="1.2"
        opacity="0.7"
        fill="none"
      />
      <path
        d="M6 92 C 6 46 46 6 92 6"
        strokeWidth="0.7"
        opacity="0.4"
        fill="none"
      />
      {/* crescent moon */}
      <path
        d="M30 30 a 13 13 0 1 0 13 13 a 10 10 0 1 1 -13 -13 z"
        fill="currentColor"
        stroke="none"
        opacity="0.85"
      />
      {/* sparkle stars */}
      <FourStar cx={64} cy={20} r={6} />
      <FourStar cx={20} cy={64} r={6} />
      <FourStar cx={86} cy={40} r={4} />
      <FourStar cx={40} cy={86} r={4} />
      {/* dotted strand */}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx={100}
          cy={28 + i * 11}
          r={i % 2 === 0 ? 1.6 : 1}
          fill="currentColor"
          stroke="none"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

function EdgeOrnament({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="26"
      height="150"
      viewBox="0 0 26 150"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <circle
          key={i}
          cx={13}
          cy={10 + i * 18}
          r={i % 2 === 0 ? 1.4 : 0.9}
          fill="currentColor"
          stroke="none"
          opacity="0.55"
        />
      ))}
      <FourStar cx={13} cy={75} r={7} />
      <path
        d="M7 60 a 7 7 0 1 0 7 7 a 5.4 5.4 0 1 1 -7 -7 z"
        fill="currentColor"
        stroke="none"
        opacity="0.7"
      />
    </svg>
  );
}

function FourStar({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const w = r * 0.32;
  return (
    <path
      d={`M${cx} ${cy - r} C ${cx + w} ${cy - w}, ${cx + w} ${cy - w}, ${cx + r} ${cy} C ${cx + w} ${cy + w}, ${cx + w} ${cy + w}, ${cx} ${cy + r} C ${cx - w} ${cy + w}, ${cx - w} ${cy + w}, ${cx - r} ${cy} C ${cx - w} ${cy - w}, ${cx - w} ${cy - w}, ${cx} ${cy - r} Z`}
      fill="currentColor"
      stroke="none"
      opacity="0.8"
    />
  );
}

function getGenreLabel(manga: MangaSeries, activeGenre: string | null) {
  if (activeGenre && manga.genres.includes(activeGenre)) {
    return activeGenre;
  }

  return manga.genres[0] ?? "Манга";
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
