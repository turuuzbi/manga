"use client";

import React, { useState } from "react";
import {
  Search,
  TrendingUp,
  ChevronRight,
  Bell,
  BookOpen,
  Flame,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { SignUpButton } from "@clerk/nextjs";

interface MangaSeries {
  id: string;
  title: string;
  genre: string;
  latestChapter: number;
  coverUrl?: string;
  isHot?: boolean;
}
interface TrendingEntry {
  rank: number;
  title: string;
  delta: string;
}

// ─── INJECTED STYLES ────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bangers&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&family=Noto+Sans+JP:wght@700;900&display=swap');

.yu-root * { box-sizing: border-box; }
.yu-root { font-family: 'Plus Jakarta Sans', sans-serif; }
.font-manga { font-family: 'Bangers', cursive !important; letter-spacing: 0.05em; }
.font-jp { font-family: 'Noto Sans JP', sans-serif; }

/* ── Aged paper grain ── */
.yu-root::before {
  content: '';
  position: fixed; inset: 0; z-index: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  opacity: 0.04;
  mix-blend-mode: multiply;
}

/* ── Ink panels ── */
.ink-panel       { border: 3px solid #1a1108; position: relative; box-shadow: 5px 5px 0 #1a1108; background: #faf5e4; }
.ink-panel-sm    { border: 2px solid #1a1108; position: relative; box-shadow: 3px 3px 0 #1a1108; }
.ink-panel-flat  { border: 2px solid #1a1108; position: relative; }

/* ── Speed lines rotation ── */
@keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.speed-spin { animation: spin-slow 80s linear infinite; transform-origin: 50% 50%; }

/* ── Star burst badge ── */
@keyframes badge-rock { 0%,100%{transform:rotate(-5deg) scale(1)} 50%{transform:rotate(5deg) scale(1.06)} }
.badge-rock { animation: badge-rock 4s ease-in-out infinite; }

/* ── Screentone hover ── */
.screentone-layer {
  background-image: radial-gradient(circle, #1a1108 1px, transparent 1px);
  background-size: 6px 6px;
  position: absolute; inset: 0; z-index: 10;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
.manga-card:hover .screentone-layer { opacity: 0.09; }

/* ── Card overlay ── */
.card-overlay {
  position: absolute; inset: 0; z-index: 11;
  background: rgba(26,17,8,0.85);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.manga-card:hover .card-overlay { opacity: 1; }

/* ── Card lift ── */
.manga-card { transition: transform 0.15s ease, filter 0.15s ease; cursor: pointer; }
.manga-card:hover { transform: translate(-2px,-3px); }
.manga-card:hover .ink-panel-sm { box-shadow: 6px 6px 0 #1a1108 !important; }

/* ── Trending item ── */
.trend-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1.5px solid #d4c9b0; cursor:pointer; transition:transform 0.12s; }
.trend-row:last-child { border-bottom:none; }
.trend-row:hover { transform:translateX(4px); }
.trend-row:hover .trend-title { color: #e8637e !important; }

/* ── Genre pill ── */
.genre-pill {
  border: 2px solid #1a1108;
  padding: 4px 10px;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: transparent; color: #1a1108;
  cursor: pointer; transition: all 0.1s;
}
.genre-pill:hover { background: #1a1108; color: #f5f0e4; }
.genre-pill.active { background: #e8637e; border-color: #e8637e; color: #fff; box-shadow: 2px 2px 0 #1a1108; }

/* ── Buttons ── */
.yu-btn {
  border: 2px solid #1a1108;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;
  cursor: pointer; transition: all 0.1s; border-radius: 0;
  display: inline-flex; align-items: center; gap: 6px;
}
.yu-btn:hover  { transform:translate(-1px,-1px); }
.yu-btn:active { transform:translate(2px,2px); }
.yu-btn-ink    { background:#1a1108; color:#f5f0e4; box-shadow:3px 3px 0 #e8637e; font-size:11px; padding:8px 20px; }
.yu-btn-ink:hover { box-shadow:5px 5px 0 #e8637e; }
.yu-btn-rose   { background:#e8637e; color:#fff; box-shadow:3px 3px 0 #1a1108; font-size:11px; padding:8px 20px; }
.yu-btn-rose:hover { box-shadow:5px 5px 0 #1a1108; }
.yu-btn-paper  { background:#f5f0e4; color:#e8637e; box-shadow:3px 3px 0 #1a1108; font-size:11px; padding:10px 24px; }
.yu-btn-paper:hover { box-shadow:5px 5px 0 #1a1108; }
.yu-btn-full   { width:100%; justify-content:center; font-size:11px; padding:12px; background:#e8637e; color:#fff; box-shadow:3px 3px 0 #1a1108; }
.yu-btn-full:hover { box-shadow:5px 5px 0 #1a1108; }

/* ── Search ── */
.yu-search {
  background: #ede6d0; border: 2px solid #1a1108;
  padding: 7px 12px 7px 32px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;
  outline: none; color: #1a1108; border-radius: 0;
  transition: all 0.2s;
}
.yu-search::placeholder { color: #8a7a6a; }
.yu-search:focus { background: #fff; box-shadow: 3px 3px 0 #e8637e; }

/* ── Load more ── */
.load-more { width:100%; padding:14px; margin-top:48px; border:2px dashed #1a1108; background:transparent; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#1a1108; cursor:pointer; transition:all 0.15s; }
.load-more:hover { background:#1a1108; color:#f5f0e4; border-style:solid; }

/* ── Section title block ── */
.section-title { display:inline-block; background:#1a1108; padding:6px 14px; }
.section-title span { font-family:'Bangers',cursive; font-size:22px; color:#f5f0e4; letter-spacing:0.06em; }

/* ── Entry animations ── */
@keyframes slide-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
.anim-1 { animation:slide-up 0.5s ease both; }
.anim-2 { animation:slide-up 0.5s 0.12s ease both; }
.anim-3 { animation:slide-up 0.5s 0.24s ease both; }

/* ── SFX background ── */
.sfx-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.sfx { font-family:'Bangers',cursive; position:absolute; opacity:0.032; color:#1a1108; white-space:nowrap; user-select:none; }

/* ── Diagonal corner triangle ── */
.corner-tri { position:absolute; top:0; right:0; width:0; height:0; border-top:64px solid #e8637e; border-left:64px solid transparent; z-index:20; }
.corner-tri-icon { position:absolute; top:4px; right:5px; z-index:21; }

/* ── Horizontal rule ── */
.ink-rule { border:none; border-top:2px solid #1a1108; margin:0; }

/* ── Stat icon box ── */
.stat-icon { width:36px; height:36px; background:#e8637e; border:2px solid #1a1108; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#fff; position:relative; z-index:1; }

/* ── Sidebar sticky ── */
.sidebar-sticky { position:sticky; top:80px; display:flex; flex-direction:column; gap:20px; }
`;

// ─── SPEED LINES ─────────────────────────────────────────────────────────────
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
      className="absolute inset-0 w-full h-full speed-spin"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transformOrigin: "200px 200px" }}
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#1a1108"
          strokeWidth={l.thick}
          opacity={l.op}
        />
      ))}
    </svg>
  );
}

// ─── HALFTONE ────────────────────────────────────────────────────────────────
function Halftone({
  uid,
  size = 8,
  r = 2.2,
  opacity = 0.12,
  color = "#1a1108",
}: {
  uid: string;
  size?: number;
  r?: number;
  opacity?: number;
  color?: string;
}) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
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

// ─── STAR BURST ──────────────────────────────────────────────────────────────
function StarBurst({
  label,
  size = 60,
  bg = "#f5c518",
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
      className="relative flex items-center justify-center flex-shrink-0 badge-rock"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 w-full h-full"
        style={{ filter: "drop-shadow(2px 2px 0 #1a1108)" }}
      >
        <polygon points={pts} fill={bg} stroke="#1a1108" strokeWidth="1.5" />
      </svg>
      <span
        className="font-manga relative z-10 text-center leading-none"
        style={{
          fontSize: size * 0.16,
          color: "#1a1108",
          whiteSpace: "pre-line",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── CARD SKELETON ────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{ opacity: 0.6 }}>
      <div
        style={{
          aspectRatio: "3/4",
          background: "#ede6d0",
          border: "2px solid #d4c9b0",
          marginBottom: 10,
        }}
      />
      <div
        style={{ height: 8, width: 48, background: "#ede6d0", marginBottom: 6 }}
      />
      <div
        style={{
          height: 12,
          width: 120,
          background: "#e8dfc8",
          marginBottom: 4,
        }}
      />
      <div style={{ height: 8, width: 64, background: "#ede6d0" }} />
    </div>
  );
}

// ─── TRENDING SKELETON ────────────────────────────────────────────────────────
function TrendingSkeleton({ rank }: { rank: number }) {
  return (
    <div className="trend-row" style={{ opacity: 0.5 }}>
      <span
        className="font-manga"
        style={{
          fontSize: 34,
          color: "#d4c9b0",
          width: 36,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {rank}
      </span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 12,
            width: 140,
            background: "#ede6d0",
            marginBottom: 4,
          }}
        />
        <div style={{ height: 8, width: 80, background: "#e8dfc8" }} />
      </div>
    </div>
  );
}

// ─── GENRES ───────────────────────────────────────────────────────────────────
const genres = [
  "Action",
  "Isekai",
  "Romance",
  "Seinen",
  "Shonen",
  "Horror",
  "Comedy",
  "Fantasy",
  "Sci-Fi",
  "Sports",
];

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function YuumeManga({
  featuredTitle,
  latestSeries = [],
  trending = [],
  isLoading = false,
}: {
  featuredTitle?: { title: string; subtitle: string; chapter: number };
  latestSeries?: MangaSeries[];
  trending?: TrendingEntry[];
  isLoading?: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const showSkeletons = isLoading || latestSeries.length === 0;
  const showTrendingSkeletons = isLoading || trending.length === 0;

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="yu-root min-h-screen"
        style={{ background: "#f5f0e4", color: "#1a1108", overflowX: "hidden" }}
      >
        {/* ── SFX BACKGROUND DECORATIONS ── */}
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
            ZOOM!!
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
          <span
            className="sfx"
            style={{
              fontSize: 170,
              top: "68%",
              left: "-2%",
              transform: "rotate(13deg)",
            }}
          >
            WOOSH
          </span>
          <span
            className="sfx font-jp"
            style={{
              fontSize: 150,
              top: "15%",
              right: "20%",
              transform: "rotate(-20deg)",
            }}
          >
            バーン
          </span>
        </div>

        {/* ── NAV ── */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "#f5f0e4",
            borderBottom: "3px solid #1a1108",
          }}
        >
          <div
            className="max-w-7xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-6"
            style={{ position: "relative", zIndex: 1 }}
          >
            {/* Logo */}
            <a
              href="#"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  background: "#e8637e",
                  border: "2px solid #1a1108",
                  padding: "2px 10px",
                  boxShadow: "2px 2px 0 #1a1108",
                }}
              >
                <span
                  className="font-manga"
                  style={{
                    color: "#fff",
                    fontSize: 22,
                    lineHeight: 1.3,
                    display: "block",
                  }}
                >
                  ユーメ
                </span>
              </div>
              <span
                className="font-manga"
                style={{ fontSize: 21, color: "#1a1108" }}
              >
                MANGA
              </span>
            </a>

            {/* Desktop links */}
            <div
              className="hidden md:flex items-center gap-8"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {["Browse", "Popular", "New", "Completed"].map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{
                    color: "#5a4a3a",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#e8637e")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#5a4a3a")
                  }
                >
                  {l}
                </a>
              ))}
            </div>

            {/* Search + CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                className="hidden md:flex items-center"
                style={{ position: "relative" }}
              >
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 10,
                    color: "#8a7a6a",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search series…"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="yu-search"
                  style={{
                    width: searchFocused ? 200 : 150,
                    transition: "all 0.25s",
                  }}
                />
              </div>
              <div className="hidden md:block yu-btn yu-btn-rose">
                <SignUpButton />
              </div>
              <button
                className="md:hidden p-2"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#1a1108",
                }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div
              className="md:hidden px-5 py-4 flex flex-col gap-4"
              style={{ borderTop: "2px solid #1a1108" }}
            >
              {["Browse", "Popular", "New", "Completed"].map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#5a4a3a",
                    textDecoration: "none",
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          )}
        </nav>

        {/* ── MAIN ── */}
        <main
          className="max-w-7xl mx-auto px-5 md:px-10 py-10"
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* ── HERO (manga panel grid) ── */}
          <section
            className="anim-1 grid grid-cols-1 lg:grid-cols-5 mb-16"
            style={{
              border: "3px solid #1a1108",
              boxShadow: "7px 7px 0 #1a1108",
            }}
          >
            {/* ── Featured panel ── */}
            <div
              className="lg:col-span-3 relative overflow-hidden"
              style={{
                height: 500,
                background: "#f0e6cc",
                borderRight: "3px solid #1a1108",
              }}
            >
              {/* Speed lines */}
              <div className="absolute inset-0 overflow-hidden">
                <SpeedLines />
              </div>
              {/* Halftone on lower half */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{ height: "55%" }}
              >
                <Halftone uid="hero-ht" size={10} r={2.2} opacity={0.07} />
              </div>

              {featuredTitle ? (
                <>
                  {/* Featured label */}
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
                        background: "#f5c518",
                        border: "2px solid #1a1108",
                        padding: "3px 12px",
                        boxShadow: "2px 2px 0 #1a1108",
                        display: "inline-block",
                      }}
                    >
                      <span
                        className="font-manga"
                        style={{
                          fontSize: 12,
                          color: "#1a1108",
                          letterSpacing: "0.12em",
                        }}
                      >
                        ✦ FEATURED TODAY ✦
                      </span>
                    </div>
                  </div>
                  {/* Star burst */}
                  <div
                    className="absolute"
                    style={{ top: 14, right: 20, zIndex: 10 }}
                  >
                    <StarBurst label={"HOT\nPICK"} size={70} />
                  </div>
                  {/* Corner triangle */}
                  <div className="corner-tri" />
                  <div className="corner-tri-icon">
                    <BookOpen
                      size={18}
                      style={{ color: "rgba(255,255,255,0.9)" }}
                    />
                  </div>
                  {/* Title overlay */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      padding: "36px 32px",
                      background:
                        "linear-gradient(to top, rgba(26,17,8,0.9) 55%, transparent)",
                    }}
                  >
                    <h2
                      className="font-manga"
                      style={{
                        fontSize: 56,
                        color: "#fff",
                        lineHeight: 0.95,
                        marginBottom: 8,
                        textShadow: "4px 4px 0 #e8637e",
                      }}
                    >
                      {featuredTitle.title}
                    </h2>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 13,
                        marginBottom: 22,
                        fontWeight: 500,
                      }}
                    >
                      {featuredTitle.subtitle}
                    </p>
                    <button className="yu-btn yu-btn-paper">
                      Read Ch.{featuredTitle.chapter} <ChevronRight size={13} />
                    </button>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      border: "3px solid #d4c9b0",
                      padding: 24,
                      display: "inline-flex",
                    }}
                  >
                    <BookOpen size={32} style={{ color: "#d4c9b0" }} />
                  </div>
                  <p
                    style={{ fontWeight: 700, color: "#8a7a6a", fontSize: 13 }}
                  >
                    No featured series yet
                  </p>
                </div>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="lg:col-span-2 flex flex-col">
              {/* Stats */}
              <div
                className="grid grid-cols-2"
                style={{ borderBottom: "3px solid #1a1108" }}
              >
                {[
                  { icon: <BookOpen size={17} />, label: "Series", value: "—" },
                  {
                    icon: <Flame size={17} />,
                    label: "Active Today",
                    value: "—",
                  },
                ].map(({ icon, label, value }, i) => (
                  <div
                    key={label}
                    style={{
                      padding: 20,
                      borderRight: i === 0 ? "3px solid #1a1108" : "none",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Halftone
                      uid={`stat${i}`}
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
                        color: "#1a1108",
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
                        color: "#8a7a6a",
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

              {/* Trending */}
              <div
                style={{
                  flex: 1,
                  padding: "20px 22px",
                  position: "relative",
                  overflow: "hidden",
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
                        background: "#e8637e",
                        flexShrink: 0,
                      }}
                    />
                    <TrendingUp size={14} style={{ color: "#e8637e" }} />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                      }}
                    >
                      Trending This Week
                    </span>
                  </div>
                  <a
                    href="#"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#e8637e",
                      textDecoration: "none",
                    }}
                  >
                    All <ArrowUpRight size={11} />
                  </a>
                </div>

                <div style={{ position: "relative", zIndex: 1 }}>
                  {showTrendingSkeletons
                    ? [1, 2, 3, 4].map((r) => (
                        <TrendingSkeleton key={r} rank={r} />
                      ))
                    : trending.slice(0, 4).map((entry) => (
                        <div key={entry.rank} className="trend-row">
                          <span
                            className="font-manga"
                            style={{
                              fontSize: 36,
                              color: entry.rank <= 3 ? "#e8637e" : "#d4c9b0",
                              width: 36,
                              flexShrink: 0,
                              lineHeight: 1,
                              WebkitTextStroke:
                                entry.rank === 1 ? "1px #1a1108" : "none",
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
                                color: "#1a1108",
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
                                color: "#e8637e",
                                marginTop: 1,
                              }}
                            >
                              {entry.delta} readers
                            </p>
                          </div>
                          <ChevronRight
                            size={13}
                            style={{ color: "#d4c9b0", flexShrink: 0 }}
                          />
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── BODY ── */}
          <div className="flex flex-col lg:flex-row gap-12">
            {/* ── FEED ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header */}
              <div className="anim-2 flex items-center justify-between mb-8">
                <div className="section-title">
                  <span>Latest Updates</span>
                </div>
                <a
                  href="#"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#e8637e",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                  }}
                >
                  Browse all <ArrowUpRight size={12} />
                </a>
              </div>

              {/* Card grid */}
              <div className="anim-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-9">
                {showSkeletons
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))
                  : latestSeries.map((m) => (
                      <div key={m.id} className="manga-card">
                        <div
                          className="ink-panel-sm relative overflow-hidden"
                          style={{
                            aspectRatio: "3/4",
                            marginBottom: 10,
                            background: "#ede6d0",
                          }}
                        >
                          <div className="screentone-layer" />

                          {m.coverUrl ? (
                            <img
                              src={m.coverUrl}
                              alt={m.title}
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
                                background: "#f0e8d8",
                              }}
                            >
                              <BookOpen
                                size={32}
                                style={{ color: "#d4c9b0" }}
                              />
                            </div>
                          )}

                          {/* HOT badge */}
                          {m.isHot && (
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
                          )}

                          {/* Hover overlay */}
                          <div className="card-overlay">
                            <div
                              style={{
                                border: "2px solid #fff",
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

                          {/* Chapter tag */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              background: "#1a1108",
                              padding: "2px 8px",
                              zIndex: 12,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#f5f0e4",
                                letterSpacing: "0.08em",
                              }}
                            >
                              CH.{m.latestChapter}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "#e8637e",
                          }}
                        >
                          {m.genre}
                        </span>
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#1a1108",
                            lineHeight: 1.3,
                            marginTop: 2,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {m.title}
                        </h4>
                      </div>
                    ))}
              </div>

              {/* Empty state */}
              {!isLoading && latestSeries.length === 0 && (
                <div
                  style={{
                    border: "2px dashed #d4c9b0",
                    padding: "80px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <BookOpen size={36} style={{ color: "#d4c9b0" }} />
                  <p
                    style={{ fontWeight: 700, color: "#8a7a6a", fontSize: 14 }}
                  >
                    No series loaded yet
                  </p>
                  <p style={{ color: "#a89880", fontSize: 12 }}>
                    Connect your data source to get started
                  </p>
                </div>
              )}

              {latestSeries.length > 0 && (
                <button className="load-more">— Load More —</button>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <aside style={{ width: "100%", maxWidth: 264, flexShrink: 0 }}>
              <div className="sidebar-sticky">
                {/* Genre */}
                <div className="ink-panel" style={{ padding: 20 }}>
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
                    <span style={{ color: "#e8637e" }}>✦</span> Browse by Genre
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {genres.map((g) => (
                      <button
                        key={g}
                        onClick={() =>
                          setActiveGenre(activeGenre === g ? null : g)
                        }
                        className={`genre-pill${activeGenre === g ? " active" : ""}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification CTA */}
                <div
                  className="ink-panel"
                  style={{
                    padding: 24,
                    background: "#f5e9c4",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Halftone uid="nl-ht" size={8} r={2} opacity={0.1} />
                  {/* Starburst decoration (top-right) */}
                  <div
                    style={{
                      position: "absolute",
                      top: -18,
                      right: -18,
                      zIndex: 10,
                    }}
                  >
                    <StarBurst label={"FREE\nACCT"} size={80} bg="#e8637e" />
                  </div>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        border: "2px solid #1a1108",
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#1a1108",
                        marginBottom: 14,
                      }}
                    >
                      <Bell size={18} style={{ color: "#f5c518" }} />
                    </div>
                    <h4
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: "#1a1108",
                        lineHeight: 1.2,
                        marginBottom: 6,
                      }}
                    >
                      Never miss a chapter
                    </h4>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#5a4a3a",
                        lineHeight: 1.6,
                        marginBottom: 20,
                        fontWeight: 500,
                      }}
                    >
                      Get notified the moment your favourite series updates.
                    </p>
                    <button className="yu-btn yu-btn-full">
                      Create Free Account
                    </button>
                  </div>
                </div>

                {/* Mini trending panel (bonus) */}
                <div
                  className="ink-panel"
                  style={{
                    padding: "16px 18px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Halftone uid="mini-ht" size={7} r={1.6} opacity={0.06} />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Flame size={12} style={{ color: "#e8637e" }} /> New This
                      Week
                    </p>
                    {["Sorairo Days", "Kimi no Nawa", "Chainsaw Act"].map(
                      (t, i) => (
                        <div
                          key={t}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 0",
                            borderBottom: i < 2 ? "1px solid #d4c9b0" : "none",
                          }}
                        >
                          <span
                            className="font-manga"
                            style={{
                              fontSize: 18,
                              color: "#e8637e",
                              width: 22,
                              flexShrink: 0,
                              lineHeight: 1,
                            }}
                          >
                            {i + 1}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#1a1108",
                            }}
                          >
                            {t}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer
          className="mt-24 py-12 px-5 md:px-10"
          style={{
            borderTop: "3px solid #1a1108",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  background: "#e8637e",
                  border: "2px solid #1a1108",
                  padding: "2px 10px",
                  boxShadow: "2px 2px 0 #1a1108",
                }}
              >
                <span
                  className="font-manga"
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    lineHeight: 1.3,
                    display: "block",
                  }}
                >
                  ユーメ
                </span>
              </div>
              <span
                className="font-manga"
                style={{ fontSize: 17, color: "#1a1108" }}
              >
                MANGA
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 28,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {["Discord", "Translation Team"].map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{
                    color: "#8a7a6a",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#e8637e")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#8a7a6a")
                  }
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
