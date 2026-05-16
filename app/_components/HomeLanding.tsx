"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, ChevronRight, BookOpen, ArrowUpRight } from "lucide-react";
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
  isHot?: boolean;
}

const STATUS_LABELS: Record<MangaStatusValue, string> = {
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CATCHING_UP: "Catching Up",
  FINISHED_RELEASING: "Finished Releasing",
  HIATUS: "Hiatus",
};

const STATUS_BG: Record<MangaStatusValue, string> = {
  ONGOING: "#22c55e",
  COMPLETED: "#3b82f6",
  CATCHING_UP: "#f97316",
  FINISHED_RELEASING: "#a855f7",
  HIATUS: "#ef4444",
};

const STATUS_TEXT: Record<MangaStatusValue, string> = {
  ONGOING: "#06120a",
  COMPLETED: "#0c1a33",
  CATCHING_UP: "#1f1206",
  FINISHED_RELEASING: "#1a0a2e",
  HIATUS: "#330505",
};

const DEFAULT_TITLE_FONT = "Bangers";
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
};

function formatFontFamily(fontName: string | null | undefined) {
  const family = (fontName ?? DEFAULT_TITLE_FONT).trim() || DEFAULT_TITLE_FONT;
  const fallback = FONT_FAMILY_FALLBACKS[family] ?? "sans-serif";
  return `'${family.replaceAll("'", "")}', ${fallback}`;
}

function buildGoogleFontsHref(fontNames: string[]) {
  const families = [...new Set(fontNames.filter(Boolean))]
    .map((font) => `family=${encodeURIComponent(font.trim()).replace(/%20/g, "+")}:wght@400;500;600;700;800;900`)
    .join("&");

  if (!families) {
    return null;
  }

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

interface TrendingEntry {
  id: string;
  rank: number;
  title: string;
  delta: string;
}

interface GenreFilter {
  name: string;
  mangaCount: number;
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bangers&family=Permanent+Marker&family=Anton&family=Bungee&family=Bowlby+One&family=Creepster&family=Black+Ops+One&family=Special+Elite&family=Rubik:wght@400;600;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&family=Noto+Sans+JP:wght@700;900&display=swap');

.yu-root * { box-sizing: border-box; }
.yu-root { font-family: 'Plus Jakarta Sans', sans-serif; }
.font-manga { font-family: 'Bangers', cursive !important; letter-spacing: 0.05em; }
.font-jp { font-family: 'Noto Sans JP', sans-serif; }
.manga-title { font-weight: 800; letter-spacing: 0.02em; line-height: 1.18; }
.status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px;
  font-size: 9px; font-weight: 800;
  letter-spacing: 0.14em; text-transform: uppercase;
  border: 2px solid var(--manga-border);
  box-shadow: 2px 2px 0 var(--manga-shadow);
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.85; }
.yu-root::before {
  content: '';
  position: fixed; inset: 0; z-index: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  opacity: 0.035;
  mix-blend-mode: multiply;
}
.ink-panel { border: 3px solid var(--manga-border); position: relative; box-shadow: 5px 5px 0 var(--manga-shadow); background: var(--manga-paper); }
.ink-panel-sm { border: 2px solid var(--manga-border); position: relative; box-shadow: 3px 3px 0 var(--manga-shadow); }
@keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.speed-spin { animation: spin-slow 80s linear infinite; transform-origin: 50% 50%; }
@keyframes badge-rock { 0%,100%{transform:rotate(-5deg) scale(1)} 50%{transform:rotate(5deg) scale(1.06)} }
.badge-rock { animation: badge-rock 4s ease-in-out infinite; }
.screentone-layer {
  background-image: radial-gradient(circle, var(--manga-border) 1px, transparent 1px);
  background-size: 6px 6px;
  position: absolute; inset: 0; z-index: 10;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
.manga-card:hover .screentone-layer { opacity: 0.08; }
.card-overlay {
  position: absolute; inset: 0; z-index: 11;
  background: var(--manga-card-overlay);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.manga-card:hover .card-overlay { opacity: 1; }
.manga-card { transition: transform 0.15s ease, filter 0.15s ease; cursor: pointer; }
.manga-card:hover { transform: translate(-2px,-3px); }
.manga-card:hover .ink-panel-sm { box-shadow: 6px 6px 0 var(--manga-shadow) !important; }
.trend-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1.5px solid color-mix(in srgb, var(--manga-border) 18%, transparent); transition:transform 0.12s; }
.trend-row:last-child { border-bottom:none; }
.trend-row:hover { transform:translateX(4px); }
.trend-row:hover .trend-title { color: var(--manga-accent) !important; }
.genre-pill {
  border: 2px solid var(--manga-border);
  padding: 4px 10px;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  background: transparent; color: var(--manga-text);
  cursor: pointer; transition: all 0.1s;
}
.genre-pill:hover { background: var(--manga-border); color: var(--manga-bg); }
.genre-pill.active { background: var(--manga-accent); border-color: var(--manga-accent); color: #fff; box-shadow: 2px 2px 0 var(--manga-shadow); }
.yu-btn {
  border: 2px solid var(--manga-border);
  font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;
  cursor: pointer; transition: all 0.1s; border-radius: 0;
  display: inline-flex; align-items: center; gap: 6px;
}
.yu-btn:hover { transform:translate(-1px,-1px); }
.yu-btn-ink { background:var(--manga-text); color:var(--manga-bg); box-shadow:3px 3px 0 var(--manga-accent); font-size:11px; padding:8px 20px; }
.yu-btn-paper { background:var(--manga-paper); color:var(--manga-accent); box-shadow:3px 3px 0 var(--manga-shadow); font-size:11px; padding:10px 24px; }
.yu-btn-full { width:100%; justify-content:center; font-size:11px; padding:12px; background:var(--manga-accent); color:#fff; box-shadow:3px 3px 0 var(--manga-shadow); }
.yu-search {
  background: var(--manga-paper-2); border: 2px solid var(--manga-border);
  padding: 7px 12px 7px 32px;
  font-size: 12px; outline: none; color: var(--manga-text);
}
.yu-search::placeholder { color: var(--manga-muted-2); }
.yu-search:focus { background: var(--manga-bg); box-shadow: 3px 3px 0 var(--manga-accent); }
.section-title { display:inline-block; background:var(--manga-border); padding:6px 14px; }
.section-title span { font-family:'Bangers',cursive; font-size:22px; color:var(--manga-bg); letter-spacing:0.06em; }
.sfx-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.sfx { font-family:'Bangers',cursive; position:absolute; opacity:0.024; color:var(--manga-border); white-space:nowrap; user-select:none; }
.corner-tri { position:absolute; top:0; right:0; width:0; height:0; border-top:64px solid var(--manga-accent); border-left:64px solid transparent; z-index:20; }
.corner-tri-icon { position:absolute; top:4px; right:5px; z-index:21; }
.stat-icon { width:36px; height:36px; background:var(--manga-accent); border:2px solid var(--manga-border); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#fff; position:relative; z-index:1; }
.sidebar-sticky { position:sticky; top:80px; display:flex; flex-direction:column; gap:20px; }
.nav-link { position:relative; transition:color 0.2s ease; }
.nav-link::after {
  content:'';
  position:absolute;
  left:0;
  right:0;
  bottom:-8px;
  height:2px;
  background:var(--manga-accent);
  transform:scaleX(0);
  transform-origin:left;
  transition:transform 0.2s ease;
}
.nav-link:hover::after { transform:scaleX(1); }
`;

function SpeedLines() {
  const lines = Array.from({ length: 56 }, (_, i) => {
    const angle = (i / 56) * Math.PI * 2;
    const ir = 22 + (i % 5) * 7;
    const thick = i % 6 === 0 ? 3.5 : i % 3 === 0 ? 1.6 : 0.7;
    const op = i % 6 === 0 ? 0.2 : i % 3 === 0 ? 0.1 : 0.05;
    return {
      x1: 200 + Math.cos(angle) * ir,
      y1: 200 + Math.sin(angle) * ir,
      x2: 200 + Math.cos(angle) * 680,
      y2: 200 + Math.sin(angle) * 680,
      thick,
      op,
    };
  });

  return (
    <svg
      className="absolute inset-0 h-full w-full speed-spin"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transformOrigin: "200px 200px" }}
    >
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="var(--manga-border)"
          strokeWidth={line.thick}
          opacity={line.op}
        />
      ))}
    </svg>
  );
}

function Halftone({
  uid,
  size = 8,
  r = 2.2,
  opacity = 0.12,
  color = "var(--manga-border)",
}: {
  uid: string;
  size?: number;
  r?: number;
  opacity?: number;
  color?: string;
}) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 0 }}
    >
      <defs>
        <pattern
          id={uid}
          x="0"
          y="0"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill={color}
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid})`} />
    </svg>
  );
}

function StarBurst({
  label,
  size = 60,
  bg = "var(--manga-highlight)",
}: {
  label: string;
  size?: number;
  bg?: string;
}) {
  const n = 14;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? size / 2 - 1 : size * 0.32;
    return `${size / 2 + Math.cos(a) * r},${size / 2 + Math.sin(a) * r}`;
  }).join(" ");

  return (
    <div
      style={{ width: size, height: size }}
      className="badge-rock relative flex flex-shrink-0 items-center justify-center"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full"
        style={{ filter: "drop-shadow(2px 2px 0 var(--manga-shadow))" }}
      >
        <polygon
          points={pts}
          fill={bg}
          stroke="var(--manga-border)"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className="font-manga relative z-10 text-center leading-none"
        style={{
          fontSize: size * 0.16,
          color: "var(--manga-highlight-text)",
          whiteSpace: "pre-line",
        }}
      >
        {label}
      </span>
    </div>
  );
}

const headerLinks = [
  { label: "Сан", href: "/#library" },
  { label: "Цувралууд", href: "/manga" },
  { label: "Онцгойлсон", href: "/#featured" },
];

type HomeLandingProps = {
  featuredTitle?: {
    id: string;
    title: string;
    subtitle: string;
    chapter: number;
    titleFont?: string | null;
  };
  latestSeries?: MangaSeries[];
  trending?: TrendingEntry[];
  genreFilters?: GenreFilter[];
  isAdmin?: boolean;
};

export function HomeLanding({
  featuredTitle,
  latestSeries = [],
  trending = [],
  genreFilters = [],
  isAdmin = false,
}: HomeLandingProps) {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const dynamicGenreFilters =
    genreFilters.length > 0
      ? genreFilters
      : getGenreFiltersFromSeries(latestSeries);
  const filteredSeries = activeGenre
    ? latestSeries.filter((manga) => manga.genres.includes(activeGenre))
    : latestSeries;
  const filteredTrending = activeGenre
    ? trending.filter((entry) =>
        filteredSeries.some((series) => series.id === entry.id),
      )
    : trending;
  const libraryStatus = activeGenre
    ? `${filteredSeries.length} shown`
    : "Welcome :D";

  const fontsToLoad = [
    DEFAULT_TITLE_FONT,
    featuredTitle?.titleFont ?? "",
    ...latestSeries.map((manga) => manga.titleFont ?? ""),
  ].filter(Boolean) as string[];
  const customFontsHref = buildGoogleFontsHref(fontsToLoad);

  return (
    <>
      {customFontsHref ? (
        <link rel="stylesheet" href={customFontsHref} />
      ) : null}
      <style>{STYLES}</style>
      <div
        className="yu-root min-h-screen"
        style={{
          background: "var(--manga-bg)",
          color: "var(--manga-text)",
          overflowX: "hidden",
        }}
      >
        <div className="sfx-bg">
          <span
            className="sfx"
            style={{
              fontSize: 230,
              top: "1%",
              left: "-5%",
              transform: "rotate(-14deg)",
            }}
          >
            TURUU
          </span>
          <span
            className="sfx font-jp"
            style={{
              fontSize: 190,
              top: "36%",
              right: "-7%",
              transform: "rotate(9deg)",
            }}
          >
            ドキドキ
          </span>
          <span
            className="sfx font-jp"
            style={{
              fontSize: 210,
              bottom: "6%",
              left: "12%",
              transform: "rotate(-7deg)",
            }}
          >
            ガーン！
          </span>
        </div>

        <MangaTopNav navLinks={headerLinks} isAdmin={isAdmin} />

        <main
          className="motion-ink-fade mx-auto max-w-7xl px-4 py-8 md:px-8"
          style={{ position: "relative", zIndex: 1 }}
        >
          <section
            id="featured"
            className="motion-ink-up mb-12 grid grid-cols-1 lg:grid-cols-5"
            style={{
              border: "3px solid var(--manga-border)",
              boxShadow: "7px 7px 0 var(--manga-shadow)",
            }}
          >
            <div
              className="relative overflow-hidden lg:col-span-3"
              style={{
                minHeight: 420,
                background: "var(--manga-paper)",
                borderRight: "3px solid var(--manga-border)",
              }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <SpeedLines />
              </div>
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{ height: "55%" }}
              >
                <Halftone uid="hero-ht" size={10} r={2.2} opacity={0.07} />
              </div>

              {featuredTitle ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 20,
                      left: 20,
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        background: "var(--manga-highlight)",
                        border: "2px solid var(--manga-border)",
                        padding: "3px 12px",
                        boxShadow: "2px 2px 0 var(--manga-shadow)",
                        display: "inline-block",
                      }}
                    >
                      <span
                        className="font-manga"
                        style={{
                          fontSize: 12,
                          color: "var(--manga-highlight-text)",
                          letterSpacing: "0.12em",
                        }}
                      >
                        ✦✦✦
                      </span>
                    </div>
                  </div>
                  <div
                    className="absolute"
                    style={{ top: 14, right: 20, zIndex: 10 }}
                  >
                    <StarBurst label={"онцлох\nсонголт"} size={70} />
                  </div>
                  <div className="corner-tri" />
                  <div className="corner-tri-icon">
                    <BookOpen
                      size={18}
                      style={{ color: "rgba(255,255,255,0.9)" }}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      padding: "32px 24px",
                      background:
                        "linear-gradient(to top, var(--manga-hero-overlay) 55%, transparent)",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: formatFontFamily(featuredTitle.titleFont),
                        fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
                        color: "#fff",
                        lineHeight: 0.95,
                        marginBottom: 8,
                        letterSpacing: "0.04em",
                        textShadow: "4px 4px 0 var(--manga-accent-shadow)",
                      }}
                    >
                      {featuredTitle.title}
                    </h2>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.72)",
                        fontSize: 13,
                        marginBottom: 22,
                        fontWeight: 500,
                        maxWidth: 500,
                      }}
                    >
                      {featuredTitle.subtitle}
                    </p>
                    <Link
                      href={`/manga/${featuredTitle.id}`}
                      className="yu-btn yu-btn-paper"
                    >
                      Ch.{featuredTitle.chapter} Унших
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex flex-col lg:col-span-2">
              <div style={{ borderBottom: "3px solid var(--manga-border)" }}>
                {[
                  {
                    icon: <BookOpen size={17} />,
                    label: "Манга",
                    value: filteredSeries.length || "—",
                  },
                ].map(({ icon, label, value }, index) => (
                  <div
                    key={label}
                    style={{
                      padding: 20,
                      borderRight:
                        index === 0 ? "3px solid var(--manga-border)" : "none",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Halftone
                      uid={`stat${index}`}
                      size={7}
                      r={1.5}
                      opacity={0.06}
                    />
                    <div className="stat-icon" style={{ marginBottom: 12 }}>
                      {icon}
                    </div>
                    <p
                      className="font-manga"
                      style={{
                        fontSize: 34,
                        color: "var(--manga-text)",
                        lineHeight: 1,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {value}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--manga-muted-2)",
                        marginTop: 3,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "20px 22px",
                  position: "relative",
                  overflow: "hidden",
                  background: "var(--manga-bg)",
                }}
              >
                <Halftone uid="trend-ht" size={9} r={2} opacity={0.05} />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 18,
                        background: "var(--manga-accent)",
                        flexShrink: 0,
                      }}
                    />
                    <TrendingUp
                      size={14}
                      style={{ color: "var(--manga-accent)" }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                      }}
                    >
                      Долоо хоногийн трэнд
                    </span>
                  </div>
                </div>

                <div style={{ position: "relative", zIndex: 1 }}>
                  {filteredTrending.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/manga/${entry.id}`}
                      className="trend-row"
                      style={{ textDecoration: "none" }}
                    >
                      <span
                        className="font-manga"
                        style={{
                          fontSize: 36,
                          color:
                            entry.rank <= 3
                              ? "var(--manga-accent)"
                              : "var(--manga-muted-2)",
                          width: 36,
                          flexShrink: 0,
                          lineHeight: 1,
                        }}
                      >
                        {entry.rank}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="trend-title"
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--manga-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.title}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--manga-accent)",
                            marginTop: 1,
                          }}
                        >
                          {entry.delta}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={11}
                        style={{ color: "var(--manga-muted-2)", flexShrink: 0 }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-10 lg:flex-row">
            <div
              id="library"
              className="motion-ink-up motion-ink-up-delay-1"
              style={{ flex: 1, minWidth: 0 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="section-title">
                  <span>Шинээр нэмэгдсэн</span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--manga-accent)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {libraryStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                {filteredSeries.map((manga) => (
                  <Link
                    key={manga.id}
                    href={`/manga/${manga.id}`}
                    className="manga-card motion-ink-up"
                    style={{
                      animationDelay: `${
                        Math.min(
                          filteredSeries.findIndex(
                            (entry) => entry.id === manga.id,
                          ),
                          7,
                        ) * 70
                      }ms`,
                    }}
                  >
                    <div
                      className="ink-panel-sm relative overflow-hidden"
                      style={{
                        aspectRatio: "3/4",
                        marginBottom: 10,
                        background: "var(--manga-paper)",
                      }}
                    >
                      <div className="screentone-layer" />
                      {manga.coverUrl ? (
                        <img
                          src={manga.coverUrl}
                          alt={manga.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--manga-bg)",
                          }}
                        >
                          <BookOpen
                            size={32}
                            style={{ color: "var(--manga-muted-2)" }}
                          />
                        </div>
                      )}

                      {manga.status ? (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            zIndex: 20,
                          }}
                        >
                          <span
                            className="status-badge"
                            style={{
                              background: STATUS_BG[manga.status],
                              color: STATUS_TEXT[manga.status],
                            }}
                          >
                            <span className="status-dot" />
                            {STATUS_LABELS[manga.status]}
                          </span>
                        </div>
                      ) : null}

                      {manga.isHot ? (
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            zIndex: 20,
                          }}
                        >
                          <StarBurst label="HOT" size={46} />
                        </div>
                      ) : null}

                      <div className="card-overlay">
                        <div
                          style={{
                            border: "2px solid rgba(255,255,255,0.86)",
                            padding: "6px 16px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#fff",
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <BookOpen size={11} /> Read Now
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          background: "var(--manga-border)",
                          padding: "2px 8px",
                          zIndex: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "var(--manga-bg)",
                            letterSpacing: "0.08em",
                          }}
                        >
                          CH.{manga.latestChapter || 0}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--manga-accent)",
                      }}
                    >
                      {getGenreLabel(manga, activeGenre)}
                    </span>
                    <h4
                      className="manga-title"
                      style={{
                        fontFamily: formatFontFamily(manga.titleFont),
                        fontSize: manga.titleFont ? 18 : 14,
                        color: "var(--manga-text)",
                        lineHeight: 1.18,
                        marginTop: 4,
                        letterSpacing: manga.titleFont ? "0.03em" : "0.01em",
                      }}
                    >
                      {manga.title}
                    </h4>
                  </Link>
                ))}
              </div>

              {filteredSeries.length === 0 ? (
                <div
                  className="ink-panel-sm mt-8"
                  style={{
                    padding: 20,
                    background: "var(--manga-paper)",
                    color: "var(--manga-muted-2)",
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  No manga found for {activeGenre ?? "this genre"}.
                </div>
              ) : null}
            </div>

            <aside
              className="motion-ink-up motion-ink-up-delay-2 mx-auto w-full lg:mx-0"
              style={{ width: "100%", maxWidth: 264, flexShrink: 0 }}
            >
              <div className="sidebar-sticky">
                <div
                  className="ink-panel mx-auto w-full"
                  style={{ padding: 20 }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "var(--manga-accent)" }}>✦</span>{" "}
                    Browse by Genre
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      justifyContent: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveGenre(null)}
                      className={`genre-pill${activeGenre === null ? " active" : ""}`}
                    >
                      All
                    </button>
                    {dynamicGenreFilters.map((genre) => (
                      <button
                        key={genre.name}
                        type="button"
                        title={`${genre.mangaCount} manga`}
                        aria-pressed={activeGenre === genre.name}
                        onClick={() =>
                          setActiveGenre(
                            activeGenre === genre.name ? null : genre.name,
                          )
                        }
                        className={`genre-pill${activeGenre === genre.name ? " active" : ""}`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

function getGenreLabel(manga: MangaSeries, activeGenre: string | null) {
  if (activeGenre && manga.genres.includes(activeGenre)) {
    return activeGenre;
  }

  return manga.genres[0] ?? "Manga";
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
