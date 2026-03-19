"use client";

import React, { useState } from "react";
import {
  Search,
  TrendingUp,
  ChevronRight,
  Bell,
  BookOpen,
  Flame,
  Sparkles,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
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
  delta: string; // e.g. "+12"
}

function CardSkeleton() {
  return (
    <div className="group cursor-pointer animate-pulse">
      <div className="relative aspect-[3/4] mb-3 rounded-2xl bg-rose-50 overflow-hidden" />
      <div className="space-y-1.5">
        <div className="h-2 w-12 rounded bg-rose-100" />
        <div className="h-3 w-32 rounded bg-slate-100" />
        <div className="h-2 w-20 rounded bg-slate-50" />
      </div>
    </div>
  );
}

function TrendingSkeleton({ rank }: { rank: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-rose-50 animate-pulse">
      <span className="text-3xl font-black tabular-nums text-rose-100 w-8 shrink-0">
        {rank}
      </span>
      <div className="flex-1 space-y-1">
        <div className="h-3 w-28 rounded bg-slate-100" />
        <div className="h-2 w-16 rounded bg-rose-50" />
      </div>
    </div>
  );
}

// ─── GENRE PILL ─────────────────────────────────────────────────────────────
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

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function PrismLanding({
  // Wire up your actual data props here
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
    <div
      className="min-h-screen text-slate-900 font-sans selection:bg-rose-100"
      style={{ background: "#fdfcfc" }}
    >
      {/* ── AMBIENT GLOW (purely decorative) ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 60% -10%, rgba(251,207,220,0.35) 0%, transparent 70%), radial-gradient(ellipse 50% 30% at 100% 60%, rgba(253,186,202,0.18) 0%, transparent 60%)",
        }}
      />

      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(253,252,252,0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(251,207,220,0.4)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <a href="#" className="shrink-0 flex items-center gap-1.5">
            <span
              className="text-[22px] font-black tracking-[-0.04em]"
              style={{ color: "#e8637e" }}
            >
              Юүмэ
            </span>
            <span className="text-[22px] font-light tracking-[-0.04em] text-slate-300">
              Manga
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {["Browse", "Popular", "New", "Completed"].map((l) => (
              <a
                key={l}
                href="#"
                className="hover:text-rose-400 transition-colors duration-200"
              >
                {l}
              </a>
            ))}
          </div>

          {/* Search + CTA */}
          <div className="flex items-center gap-3">
            <div
              className="relative hidden md:flex items-center transition-all duration-300"
              style={{ width: searchFocused ? "220px" : "160px" }}
            >
              <Search
                size={13}
                className="absolute left-3 text-slate-300 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search series…"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full rounded-full py-2 pl-8 pr-4 text-[12px] placeholder:text-slate-300 text-slate-700 outline-none transition-all duration-300"
                style={{
                  background: searchFocused ? "#fff" : "#fdf3f5",
                  boxShadow: searchFocused
                    ? "0 0 0 2px rgba(232,99,126,0.2), 0 2px 12px rgba(232,99,126,0.08)"
                    : "none",
                  border: "1px solid",
                  borderColor: searchFocused
                    ? "rgba(232,99,126,0.3)"
                    : "rgba(251,207,220,0.5)",
                }}
              />
            </div>

            <button
              className="hidden md:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #f47b96 0%, #e8637e 100%)",
                color: "#fff",
                boxShadow:
                  "0 4px 20px rgba(232,99,126,0.3), 0 1px 0 rgba(255,255,255,0.2) inset",
              }}
            >
              Sign Up
            </button>

            {/* Mobile burger */}
            <button
              className="md:hidden p-2 text-slate-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t px-5 py-4 flex flex-col gap-4"
            style={{ borderColor: "rgba(251,207,220,0.4)" }}
          >
            {["Browse", "Popular", "New", "Completed"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-sm font-semibold text-slate-500 hover:text-rose-400 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── MAIN ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 py-10">
        {/* ── HERO SECTION ── */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-16">
          {/* Feature card */}
          <div
            className="lg:col-span-3 relative h-[480px] rounded-[2.5rem] overflow-hidden group cursor-pointer"
            style={{
              boxShadow:
                "0 20px 60px rgba(232,99,126,0.12), 0 1px 0 rgba(255,255,255,0.9) inset",
            }}
          >
            {featuredTitle ? (
              <>
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(135deg, #fde8ee 0%, #fcd0dc 50%, #f9b8ca 100%)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-10 left-10 text-white">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Sparkles size={10} /> Featured Today
                  </span>
                  <h2 className="text-5xl font-black tracking-[-0.03em] leading-none mb-2">
                    {featuredTitle.title}
                  </h2>
                  <p className="text-white/60 text-sm mb-6">
                    {featuredTitle.subtitle}
                  </p>
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-200 hover:gap-3"
                    style={{
                      background: "#fff",
                      color: "#e8637e",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    }}
                  >
                    Read Chapter {featuredTitle.chapter}
                    <ChevronRight size={13} />
                  </button>
                </div>
              </>
            ) : (
              /* Empty / no featured series state */
              <div
                className="h-full flex flex-col items-center justify-center gap-4"
                style={{
                  background:
                    "linear-gradient(135deg, #fef2f5 0%, #fde8ee 100%)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(232,99,126,0.1)" }}
                >
                  <BookOpen size={28} style={{ color: "#e8637e" }} />
                </div>
                <p className="text-sm font-medium text-rose-300">
                  No featured series yet
                </p>
              </div>
            )}
          </div>

          {/* Right column: stats + trending */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Quick stats row */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: <BookOpen size={18} />, label: "Series", value: "—" },
                {
                  icon: <Flame size={18} />,
                  label: "Active Today",
                  value: "—",
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-[1.5rem] p-5 flex flex-col gap-3"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(251,207,220,0.5)",
                    boxShadow: "0 2px 16px rgba(232,99,126,0.06)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#fef2f5", color: "#e8637e" }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">
                      {value}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trending panel */}
            <div
              className="flex-1 rounded-[1.5rem] p-6 flex flex-col"
              style={{
                background: "#fff",
                border: "1px solid rgba(251,207,220,0.5)",
                boxShadow: "0 2px 16px rgba(232,99,126,0.06)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{ color: "#e8637e" }} />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Trending This Week
                  </span>
                </div>
                <a
                  href="#"
                  className="flex items-center gap-0.5 text-[10px] font-bold text-rose-300 hover:text-rose-400 transition-colors"
                >
                  See all <ArrowUpRight size={11} />
                </a>
              </div>

              <div className="flex flex-col divide-y divide-rose-50">
                {showTrendingSkeletons
                  ? [1, 2, 3, 4].map((r) => (
                      <TrendingSkeleton key={r} rank={r} />
                    ))
                  : trending.slice(0, 4).map((entry) => (
                      <div
                        key={entry.rank}
                        className="flex items-center gap-4 py-3 group cursor-pointer"
                      >
                        <span
                          className="text-2xl font-black tabular-nums w-8 shrink-0"
                          style={{
                            color: entry.rank <= 3 ? "#f47b96" : "#f0c4cf",
                          }}
                        >
                          {entry.rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-700 truncate group-hover:text-rose-400 transition-colors">
                            {entry.title}
                          </p>
                          <p className="text-[10px] text-rose-300 font-medium">
                            {entry.delta} readers
                          </p>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-slate-200 group-hover:text-rose-300 transition-colors shrink-0"
                        />
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── BODY: FEED + SIDEBAR ── */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Feed */}
          <div className="flex-1 min-w-0">
            {/* Section header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className="w-1.5 h-7 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, #f47b96, #e8637e)",
                  }}
                />
                <h3 className="text-[22px] font-black tracking-[-0.03em] text-slate-800">
                  Latest Updates
                </h3>
              </div>
              <a
                href="#"
                className="flex items-center gap-1 text-[11px] font-bold text-rose-300 hover:text-rose-400 transition-colors uppercase tracking-widest"
              >
                Browse all <ArrowUpRight size={12} />
              </a>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-9">
              {showSkeletons
                ? Array.from({ length: 8 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))
                : latestSeries.map((m) => (
                    <div key={m.id} className="group cursor-pointer">
                      <div
                        className="relative aspect-[3/4] mb-3 rounded-2xl overflow-hidden transition-all duration-500 group-hover:-translate-y-1"
                        style={{
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                      >
                        {m.coverUrl ? (
                          <img
                            src={m.coverUrl}
                            alt={m.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              background:
                                "linear-gradient(135deg, #fef2f5 0%, #fde8ee 100%)",
                            }}
                          >
                            <BookOpen size={32} className="text-rose-200" />
                          </div>
                        )}

                        {/* Hot badge */}
                        {m.isHot && (
                          <div
                            className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                            style={{
                              background: "rgba(232,99,126,0.9)",
                              color: "#fff",
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            <Flame size={8} /> Hot
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                          style={{ background: "rgba(232,99,126,0.85)" }}
                        >
                          <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                            <BookOpen size={12} /> Read Now
                          </span>
                        </div>
                      </div>

                      <div>
                        <span
                          className="text-[9px] font-black uppercase tracking-widest"
                          style={{ color: "#e8637e" }}
                        >
                          {m.genre}
                        </span>
                        <h4 className="text-[13px] font-bold text-slate-700 leading-snug mt-0.5 line-clamp-2 group-hover:text-rose-400 transition-colors">
                          {m.title}
                        </h4>
                        <p className="text-[10px] font-medium text-slate-300 mt-1">
                          Ch. {m.latestChapter}
                        </p>
                      </div>
                    </div>
                  ))}
            </div>

            {/* Empty state */}
            {!isLoading && latestSeries.length === 0 && (
              <div
                className="rounded-3xl py-20 flex flex-col items-center gap-4"
                style={{ background: "#fef9fa" }}
              >
                <BookOpen size={36} className="text-rose-200" />
                <p className="text-sm font-semibold text-slate-400">
                  No series loaded yet
                </p>
                <p className="text-xs text-slate-300">
                  Connect your data source to get started
                </p>
              </div>
            )}

            {/* Load more */}
            {latestSeries.length > 0 && (
              <button
                className="w-full mt-12 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: "#fff",
                  border: "1.5px dashed rgba(232,99,126,0.25)",
                  color: "#e8637e",
                }}
              >
                Load More
              </button>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-68 shrink-0">
            <div className="sticky top-24 flex flex-col gap-6">
              {/* Genre filter */}
              <div
                className="rounded-[1.5rem] p-5"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(251,207,220,0.5)",
                  boxShadow: "0 2px 16px rgba(232,99,126,0.06)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Browse by Genre
                </p>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <button
                      key={g}
                      onClick={() =>
                        setActiveGenre(activeGenre === g ? null : g)
                      }
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all duration-150"
                      style={
                        activeGenre === g
                          ? {
                              background:
                                "linear-gradient(135deg, #f47b96, #e8637e)",
                              color: "#fff",
                              boxShadow: "0 4px 12px rgba(232,99,126,0.3)",
                            }
                          : {
                              background: "#fef2f5",
                              color: "#e8637e",
                              border: "1px solid rgba(251,207,220,0.6)",
                            }
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Newsletter / notification CTA */}
              <div
                className="rounded-[1.5rem] p-6 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #fce4ec 0%, #ffd0dd 100%)",
                  border: "1px solid rgba(251,207,220,0.6)",
                }}
              >
                {/* decorative circle */}
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-30"
                  style={{
                    background: "radial-gradient(circle, #f47b96, transparent)",
                  }}
                />
                <Bell
                  size={22}
                  className="mb-4 relative z-10"
                  style={{ color: "#e8637e" }}
                />
                <h4 className="text-[15px] font-black text-slate-800 leading-snug mb-1 relative z-10">
                  Never miss a chapter
                </h4>
                <p className="text-[11px] text-rose-400 leading-relaxed mb-5 relative z-10">
                  Get notified the moment your favourite series updates.
                </p>
                <button
                  className="w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 relative z-10 hover:scale-[1.02]"
                  style={{
                    background:
                      "linear-gradient(135deg, #f47b96 0%, #e8637e 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(232,99,126,0.3)",
                  }}
                >
                  Create Free Account
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer
        className="mt-24 py-12 px-5 md:px-10"
        style={{ borderTop: "1px solid rgba(251,207,220,0.4)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-lg font-black tracking-[-0.04em]">
            <span style={{ color: "#e8637e" }}>Prism</span>
            <span className="text-slate-200 font-light">Manga</span>
          </span>

          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
            {["Discord", "Translation Team", "DMCA", "Privacy"].map((l) => (
              <a
                key={l}
                href="#"
                className="hover:text-rose-400 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>

          <p className="text-[10px] text-slate-300 font-medium">
            © 2026 Prism Reader Network
          </p>
        </div>
      </footer>
    </div>
  );
}
