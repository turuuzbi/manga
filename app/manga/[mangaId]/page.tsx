import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Sparkles,
} from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const PREVIEW_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bangers&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&display=swap');

.preview-root { font-family: 'Plus Jakarta Sans', sans-serif; }
.preview-root * { box-sizing: border-box; }
.font-manga-preview { font-family: 'Bangers', cursive !important; letter-spacing: 0.05em; }
.panel-frame { border: 3px solid #1a1108; box-shadow: 7px 7px 0 #1a1108; background: #fffdf8; position: relative; }
.panel-box { border: 2px solid #1a1108; box-shadow: 3px 3px 0 #1a1108; background: #fffaf1; position: relative; }
.dot-tone {
  background-image: radial-gradient(circle, rgba(26,17,8,0.12) 1px, transparent 1px);
  background-size: 8px 8px;
}
.section-block { display:inline-block; background:#1a1108; padding:6px 14px; }
.section-block span { font-family:'Bangers',cursive; font-size:22px; color:#fffaf1; letter-spacing:0.06em; }
.preview-root::before {
  content: '';
  position: fixed; inset: 0; z-index: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: multiply;
}
`;

type MangaPreviewPageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

function formatChapterLabel(chapterNumber: number, title: string | null) {
  return title
    ? `Chapter ${chapterNumber} • ${title}`
    : `Chapter ${chapterNumber}`;
}

function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

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
  size = 66,
  bg = "#f5c518",
}: {
  label: string;
  size?: number;
  bg?: string;
}) {
  const points = Array.from({ length: 14 }, (_, index) => {
    const angle = (index / 14) * Math.PI * 2 - Math.PI / 2;
    const radius = index % 2 === 0 ? size / 2 - 1 : size * 0.32;
    return `${size / 2 + Math.cos(angle) * radius},${size / 2 + Math.sin(angle) * radius}`;
  }).join(" ");

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full"
        style={{ filter: "drop-shadow(2px 2px 0 #1a1108)" }}
      >
        <polygon points={points} fill={bg} stroke="#1a1108" strokeWidth="1.5" />
      </svg>
      <span
        className="font-manga-preview relative z-10 text-center leading-none text-[#1a1108]"
        style={{ fontSize: size * 0.15, whiteSpace: "pre-line" }}
      >
        {label}
      </span>
    </div>
  );
}

export default async function MangaPreviewPage({
  params,
}: MangaPreviewPageProps) {
  const { mangaId } = await params;

  const manga = await prisma.manga.findUnique({
    where: {
      id: mangaId,
    },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      chapters: {
        orderBy: {
          chapterNumber: "desc",
        },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          publishedAt: true,
          _count: {
            select: {
              pages: true,
            },
          },
        },
      },
    },
  });

  if (!manga) {
    notFound();
  }

  const firstReadableChapter = [...manga.chapters].sort(
    (left, right) => left.chapterNumber - right.chapterNumber,
  )[0];

  return (
    <div className="preview-root min-h-screen bg-[#fffdf8] text-[#1f1a16]">
      <style>{PREVIEW_STYLES}</style>
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(38,31,25,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(38,31,25,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.94),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(243,239,233,0.45),transparent_30%)]" />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-14 pt-24 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6a584c] transition hover:text-[#1e1813]"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <section className="panel-frame overflow-hidden">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div
              className="relative min-h-[520px] border-b-[3px] border-[#1a1108] lg:min-h-[640px] lg:border-b-0 lg:border-r-[3px]"
              style={{ background: "#fffbf3" }}
            >
              <div className="absolute inset-0">
                {manga.coverImage ? (
                  <img
                    src={manga.coverImage}
                    alt={manga.mangaName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="dot-tone h-full w-full" />
                )}
              </div>

              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(26,17,8,0.9),rgba(26,17,8,0.16))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_24%)]" />

              <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 border-2 border-[#1a1108] bg-[#f5c518] px-3 py-1 shadow-[2px_2px_0_#1a1108] sm:left-6 sm:top-6">
                <Sparkles size={13} className="text-[#1a1108]" />
                <span className="font-manga-preview text-xs text-[#1a1108]">
                  Series Preview
                </span>
              </div>

              <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
                <StarBurst label={"HOT\nPICK"} />
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-7">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                    {formatStatusLabel(manga.status)}
                  </p>
                  <h1
                    className="font-manga-preview mt-3 text-white"
                    style={{
                      fontSize: "clamp(2.5rem, 7vw, 5rem)",
                      lineHeight: 0.95,
                      textShadow: "4px 4px 0 #e8637e",
                    }}
                  >
                    {manga.mangaName}
                  </h1>
                  <p className="mt-4 line-clamp-5 max-w-xl text-sm leading-6 text-white/78 sm:line-clamp-none sm:text-base sm:leading-7">
                    {manga.description ??
                      "Choose a chapter below to start reading."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(manga.genres.length > 0
                      ? manga.genres
                      : [{ genreId: "fallback", genre: { name: "Manga" } }]
                    ).map((entry) => (
                      <span
                        key={entry.genreId}
                        className="border-2 border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur"
                      >
                        {entry.genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-rows-[auto_auto_1fr] bg-[#fffefe]">
              <div className="grid grid-cols-3 border-b-[3px] border-[#1a1108]">
                <MetricPanel
                  label="Chapters"
                  value={String(manga.chapters.length)}
                  borderRight
                />
                <MetricPanel
                  label="Author"
                  value={manga.author ?? "Unknown"}
                  borderRight
                />
                <MetricPanel
                  label="Artist"
                  value={manga.artist ?? "Unknown"}
                />
              </div>

              <div className="relative border-b-[3px] border-[#1a1108] p-5 sm:p-6">
                <Halftone uid="preview-side-tone" size={9} r={2} opacity={0.05} />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 bg-[#e8637e]" />
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#1a1108]">
                      Preview Notes
                    </p>
                  </div>
                  <p className="text-sm leading-7 text-[#5f5146]">
                    This page is your series hub. It keeps the manga-panel look,
                    lets readers jump by chapter, and points them straight into
                    the responsive reader.
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 p-5 sm:p-6">
                <div className="panel-box overflow-hidden bg-[#fffdf7]">
                  <div className="border-b-2 border-[#1a1108] bg-[#fbf5ea] px-4 py-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#1a1108]">
                      Read Flow
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2">
                    <InfoCell
                      label="First Chapter"
                      value={
                        firstReadableChapter
                          ? `Ch. ${firstReadableChapter.chapterNumber}`
                          : "Unavailable"
                      }
                      borderRight
                    />
                    <InfoCell
                      label="Latest Drop"
                      value={
                        manga.chapters[0]
                          ? `Ch. ${manga.chapters[0].chapterNumber}`
                          : "None"
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {firstReadableChapter ? (
                    <Link
                      href={`/reader/${firstReadableChapter.id}`}
                      className="inline-flex items-center justify-center gap-2 border-2 border-[#1a1108] bg-[#1a1108] px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#fffaf1] shadow-[3px_3px_0_#e8637e] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#e8637e]"
                    >
                      Start Reading
                      <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center border-2 border-[#1a1108] bg-[#f8efde] px-5 py-3 text-sm font-semibold text-[#6a584c]">
                      No readable chapters yet
                    </span>
                  )}

                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 border-2 border-[#1a1108] bg-[#fffaf1] px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#e8637e] shadow-[3px_3px_0_#1a1108] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#1a1108]"
                  >
                    Browse More
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel-frame p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="section-block">
                <span>Chapter Select</span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f5146] sm:text-base">
                Pick where you want to start reading. Every chapter routes into
                the responsive reader with scroll mode and side-tap paging.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6a57]">
              {manga.chapters.length} total chapters
            </p>
          </div>

          {manga.chapters.length === 0 ? (
            <div className="border-2 border-dashed border-[#1a1108]/25 bg-[#fff9ee] px-6 py-14 text-center">
              <p className="text-lg font-semibold text-[#1e1813]">
                No chapters yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6f5c50]">
                Add a chapter from the admin panel and it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {manga.chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/reader/${chapter.id}`}
                  className="group panel-box overflow-hidden transition hover:-translate-x-px hover:-translate-y-px"
                >
                  <div className="grid grid-cols-[72px_1fr] gap-0 sm:grid-cols-[84px_1fr_auto]">
                    <div className="flex min-h-[74px] items-center justify-center border-r-2 border-[#1a1108] bg-[#f5c518] px-3 sm:min-h-full sm:px-4">
                      <span className="font-manga-preview text-[1.9rem] leading-none text-[#1a1108] sm:text-[2.3rem]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="relative overflow-hidden bg-[#fffdf8] px-3 py-3 sm:px-5 sm:py-4">
                      <Halftone
                        uid={`chapter-tone-${chapter.id}`}
                        size={9}
                        r={2}
                        opacity={0.05}
                      />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base font-semibold leading-6 text-[#18130f] sm:text-lg">
                            {formatChapterLabel(
                              chapter.chapterNumber,
                              chapter.title,
                            )}
                          </p>
                          <span className="inline-flex shrink-0 items-center gap-1 border border-[#1a1108]/20 bg-[#fff3d6] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8a6a57] sm:hidden">
                            Read
                            <ChevronRight size={12} className="text-[#1a1108]" />
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b594d] sm:text-sm">
                          <span className="inline-flex items-center gap-2">
                            <BookOpen size={14} />
                            {chapter._count.pages} pages
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Clock3 size={14} />
                            {chapter.publishedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden items-center justify-between gap-3 border-l-2 border-[#1a1108] bg-[#fff7e6] px-4 py-4 sm:flex sm:px-5">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#8a6a57]">
                        Read now
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-[#1a1108] transition group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function MetricPanel({
  label,
  value,
  borderRight = false,
}: {
  label: string;
  value: string;
  borderRight?: boolean;
}) {
  return (
    <div
      className="p-4 sm:p-5"
      style={{ borderRight: borderRight ? "3px solid #1a1108" : undefined }}
    >
      <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#8a6a57]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[#18130f] sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function InfoCell({
  label,
  value,
  borderRight = false,
}: {
  label: string;
  value: string;
  borderRight?: boolean;
}) {
  return (
    <div
      className="px-4 py-4"
      style={{
        borderRight: borderRight ? "2px solid #1a1108" : undefined,
      }}
    >
      <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#8a6a57]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[#18130f]">{value}</p>
    </div>
  );
}
