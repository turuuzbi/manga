import Link from "next/link";
import { BookOpen, ChevronRight, Sparkles, Star } from "lucide-react";

export type MangaStatusValue =
  | "ONGOING"
  | "COMPLETED"
  | "CATCHING_UP"
  | "STOPPED";

export interface MangaSeries {
  id: string;
  title: string;
  genres: string[];
  latestChapter: number;
  coverUrl?: string;
  status?: MangaStatusValue;
  titleFont?: string | null;
}

export const STATUS_LABELS: Record<MangaStatusValue, string> = {
  ONGOING: "Гарч байгаа",
  COMPLETED: "Дууссан",
  CATCHING_UP: "Гүйцэж байна",
  STOPPED: "Зогссон",
};

/** Extra class per status, so the ribbon reads differently at a glance. */
const STATUS_BADGE_MODIFIER: Record<MangaStatusValue, string> = {
  ONGOING: "",
  COMPLETED: " is-completed",
  CATCHING_UP: " is-catching-up",
  STOPPED: " is-stopped",
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

export function formatFontFamily(fontName: string | null | undefined) {
  const family = (fontName ?? "").trim();

  if (!family) {
    return `'${DEFAULT_TITLE_FONT}', serif`;
  }

  const fallback = FONT_FAMILY_FALLBACKS[family] ?? "serif";
  return `'${family.replaceAll("'", "")}', ${fallback}`;
}

export function buildGoogleFontsHref(fontNames: string[]) {
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

export function getGenreLabel(manga: MangaSeries, activeGenre: string | null) {
  if (activeGenre && manga.genres.includes(activeGenre)) {
    return activeGenre;
  }

  return manga.genres[0] ?? "Манга";
}

/**
 * Shelf/grid card styles shared by the homepage and the library page. They
 * only read the `--home-*` tokens, which both `.yume-home` and `.yume-surface`
 * provide, so the rules stay unscoped.
 */
export const YUME_CARD_STYLES = `
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
/* Corner ribbon tucked into the poster's top-right radius, so the badge never
   sits over the title/genre text below the thumbnail. */
.yume-status {
  position: absolute; top: 0; right: 0; z-index: 3;
  max-width: calc(100% - 28px);
  font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding: 5px 10px 5px 11px;
  border-radius: 0 16px 0 14px;
  color: var(--home-rose-deep);
  background: color-mix(in srgb, var(--home-paper) 90%, transparent);
  border: 1px solid var(--home-line);
  border-top: none; border-right: none;
  backdrop-filter: blur(4px);
}
.yume-status.is-completed {
  color: color-mix(in srgb, var(--home-gold) 78%, var(--home-plum));
  border-color: var(--home-line-strong);
}
/* Back-translation in progress — the one status readers actively look for, so
   it gets a solid rose ribbon instead of the paper-toned default. */
.yume-status.is-catching-up {
  color: #fff;
  background: linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%);
  border-color: transparent;
}
.yume-status.is-stopped {
  color: var(--home-plum-soft);
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
  text-decoration: none; display: inline-block;
  transition: all 0.2s;
}
.yume-pill:hover { border-color: var(--home-rose); color: var(--home-rose-deep); }
.yume-pill.active {
  background: linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%);
  border-color: transparent; color: #fff;
  box-shadow: 0 8px 18px -8px var(--home-rose-deep);
}
`;

export function MangaPosterCard({
  manga,
  activeGenre = null,
  delayIndex,
}: {
  manga: MangaSeries;
  activeGenre?: string | null;
  delayIndex?: number;
}) {
  const statusModifier = manga.status
    ? STATUS_BADGE_MODIFIER[manga.status]
    : "";

  return (
    <Link
      href={`/manga/${manga.id}`}
      className={`yume-card${typeof delayIndex === "number" ? " motion-ink-up" : ""}`}
      style={
        typeof delayIndex === "number"
          ? { animationDelay: `${Math.min(delayIndex, 9) * 55}ms` }
          : undefined
      }
    >
      <div className="yume-poster">
        {manga.status ? (
          <span className={`yume-status${statusModifier}`}>
            {STATUS_LABELS[manga.status]}
          </span>
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
    </Link>
  );
}

export function SectionHeader({
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
