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
import { syncCurrentClerkUser } from "@/lib/auth";
import { CommentsSection } from "@/app/manga/[mangaId]/CommentsSection";
import { MangaTopNav } from "@/app/_components/MangaTopNav";

export const dynamic = "force-dynamic";

const PREVIEW_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bangers&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&family=Noto+Sans+JP:wght@700;900&display=swap');

.preview-root { font-family: 'Plus Jakarta Sans', sans-serif; }
.preview-root * { box-sizing: border-box; }
.font-manga-preview { font-family: 'Bangers', cursive !important; letter-spacing: 0.05em; }
.panel-frame { border: 3px solid var(--manga-border); box-shadow: 7px 7px 0 var(--manga-shadow); background: var(--manga-bg); position: relative; }
.panel-box { border: 2px solid var(--manga-border); box-shadow: 3px 3px 0 var(--manga-shadow); background: var(--manga-paper); position: relative; }
.dot-tone {
  background-image: radial-gradient(circle, color-mix(in srgb, var(--manga-border) 12%, transparent) 1px, transparent 1px);
  background-size: 8px 8px;
}
.section-block { display:inline-block; background:var(--manga-border); padding:6px 14px; }
.section-block span { font-family:'Bangers',cursive; font-size:22px; color:var(--manga-bg); letter-spacing:0.06em; }
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
  bg = "var(--manga-highlight)",
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
        style={{ filter: "drop-shadow(2px 2px 0 var(--manga-shadow))" }}
      >
        <polygon
          points={points}
          fill={bg}
          stroke="var(--manga-border)"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className="font-manga-preview relative z-10 text-center leading-none"
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
  const currentDbUser = await syncCurrentClerkUser();

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
      comments: {
        where: {
          parentId: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
            },
          },
          replies: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  avatarUrl: true,
                },
              },
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
    <div
      className="preview-root min-h-screen"
      style={{
        background: "var(--manga-bg)",
        color: "var(--manga-text)",
      }}
    >
      <style>{PREVIEW_STYLES}</style>
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--manga-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--manga-grid) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, var(--manga-radial-a), transparent 38%), radial-gradient(circle at bottom right, var(--manga-radial-b), transparent 30%)",
        }}
      />

      <MangaTopNav isAdmin={currentDbUser?.role === "ADMIN"} />

      <main className="motion-ink-fade relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="motion-ink-up inline-flex items-center gap-2 text-sm font-semibold transition"
          style={{ color: "var(--manga-muted)" }}
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <section className="panel-frame motion-ink-up motion-ink-up-delay-1 overflow-hidden">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div
              className="relative min-h-[520px] border-b-[3px] lg:min-h-[640px] lg:border-b-0 lg:border-r-[3px]"
              style={{
                background: "var(--manga-paper)",
                borderColor: "var(--manga-border)",
              }}
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

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, var(--manga-hero-overlay), transparent 68%)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at top left, var(--manga-hero-overlay-soft), transparent 24%)",
                }}
              />

              <div
                className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 border-2 px-3 py-1 sm:left-6 sm:top-6"
                style={{
                  borderColor: "var(--manga-border)",
                  background: "var(--manga-highlight)",
                  boxShadow: "2px 2px 0 var(--manga-shadow)",
                }}
              >
                <Sparkles size={13} style={{ color: "var(--manga-highlight-text)" }} />
                <span
                  className="font-manga-preview text-xs"
                  style={{ color: "var(--manga-highlight-text)" }}
                >
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
                      textShadow:
                        "4px 4px 0 var(--manga-accent-shadow)",
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

            <div
              className="grid grid-rows-[auto_1fr]"
              style={{ background: "var(--manga-bg)" }}
            >
              <div
                className="grid grid-cols-3 border-b-[3px]"
                style={{ borderColor: "var(--manga-border)" }}
              >
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

              <div className="flex flex-col justify-between gap-6 p-5 sm:p-6">
                <div
                  className="panel-box overflow-hidden"
                  style={{ background: "var(--manga-bg)" }}
                >
                  <div
                    className="border-b-2 px-4 py-3"
                    style={{
                      borderColor: "var(--manga-border)",
                      background: "var(--manga-paper-2)",
                    }}
                  >
                    <p
                      className="text-[11px] font-extrabold uppercase tracking-[0.24em]"
                      style={{ color: "var(--manga-text)" }}
                    >
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
                      className="inline-flex items-center justify-center gap-2 border-2 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] transition hover:-translate-x-px hover:-translate-y-px"
                      style={{
                        borderColor: "var(--manga-border)",
                        background: "var(--manga-border)",
                        color: "var(--manga-bg)",
                        boxShadow: "3px 3px 0 var(--manga-accent)",
                      }}
                    >
                      Start Reading
                      <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <span
                      className="inline-flex items-center justify-center border-2 px-5 py-3 text-sm font-semibold"
                      style={{
                        borderColor: "var(--manga-border)",
                        background: "var(--manga-paper-2)",
                        color: "var(--manga-muted)",
                      }}
                    >
                      No readable chapters yet
                    </span>
                  )}

                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 border-2 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] transition hover:-translate-x-px hover:-translate-y-px"
                    style={{
                      borderColor: "var(--manga-border)",
                      background: "var(--manga-paper)",
                      color: "var(--manga-accent)",
                      boxShadow: "3px 3px 0 var(--manga-shadow)",
                    }}
                  >
                    Browse More
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel-frame motion-ink-up motion-ink-up-delay-2 p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="section-block">
                <span>Chapter Select</span>
              </div>
              <p
                className="mt-4 max-w-2xl text-sm leading-7 sm:text-base"
                style={{ color: "var(--manga-muted)" }}
              >
                Pick where you want to start reading. Every chapter routes into
                the responsive reader with scroll mode and side-tap paging.
              </p>
            </div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--manga-muted-2)" }}
            >
              {manga.chapters.length} total chapters
            </p>
          </div>

          {manga.chapters.length === 0 ? (
            <div
              className="border-2 border-dashed px-6 py-14 text-center"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--manga-border) 25%, transparent)",
                background: "var(--manga-paper-2)",
              }}
            >
              <p className="text-lg font-semibold" style={{ color: "var(--manga-text)" }}>
                No chapters yet.
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--manga-muted)" }}>
                Add a chapter from the admin panel and it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {manga.chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/reader/${chapter.id}`}
                  className="group panel-box motion-ink-up overflow-hidden transition hover:-translate-x-px hover:-translate-y-px"
                  style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
                >
                  <div className="grid grid-cols-[72px_1fr] gap-0 sm:grid-cols-[84px_1fr_auto]">
                    <div
                      className="flex min-h-[74px] items-center justify-center border-r-2 px-3 sm:min-h-full sm:px-4"
                      style={{
                        borderColor: "var(--manga-border)",
                        background: "var(--manga-highlight)",
                      }}
                    >
                      <span
                        className="font-manga-preview text-[1.9rem] leading-none sm:text-[2.3rem]"
                        style={{ color: "var(--manga-highlight-text)" }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div
                      className="relative overflow-hidden px-3 py-3 sm:px-5 sm:py-4"
                      style={{ background: "var(--manga-bg)" }}
                    >
                      <Halftone
                        uid={`chapter-tone-${chapter.id}`}
                        size={9}
                        r={2}
                        opacity={0.05}
                      />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className="text-base font-semibold leading-6 sm:text-lg"
                            style={{ color: "var(--manga-text)" }}
                          >
                            {formatChapterLabel(
                              chapter.chapterNumber,
                              chapter.title,
                            )}
                          </p>
                          <span
                            className="inline-flex shrink-0 items-center gap-1 border px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] sm:hidden"
                            style={{
                              borderColor:
                                "color-mix(in srgb, var(--manga-border) 20%, transparent)",
                              background: "var(--manga-paper-2)",
                              color: "var(--manga-muted-2)",
                            }}
                          >
                            Read
                            <ChevronRight
                              size={12}
                              style={{ color: "var(--manga-text)" }}
                            />
                          </span>
                        </div>
                        <div
                          className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm"
                          style={{ color: "var(--manga-muted)" }}
                        >
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

                    <div
                      className="hidden items-center justify-between gap-3 border-l-2 px-4 py-4 sm:flex sm:px-5"
                      style={{
                        borderColor: "var(--manga-border)",
                        background: "var(--manga-paper-2)",
                      }}
                    >
                      <span
                        className="text-[11px] font-extrabold uppercase tracking-[0.22em]"
                        style={{ color: "var(--manga-muted-2)" }}
                      >
                        Read now
                      </span>
                      <ChevronRight
                        size={18}
                        className="transition group-hover:translate-x-1"
                        style={{ color: "var(--manga-text)" }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <CommentsSection
          mangaId={manga.id}
          currentUserId={currentDbUser?.id}
          comments={manga.comments}
        />
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
      style={{
        borderRight: borderRight ? "3px solid var(--manga-border)" : undefined,
      }}
    >
      <p
        className="text-[11px] font-extrabold uppercase tracking-[0.24em]"
        style={{ color: "var(--manga-muted-2)" }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-lg font-semibold sm:text-xl"
        style={{ color: "var(--manga-text)" }}
      >
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
        borderRight: borderRight ? "2px solid var(--manga-border)" : undefined,
      }}
    >
      <p
        className="text-[11px] font-extrabold uppercase tracking-[0.24em]"
        style={{ color: "var(--manga-muted-2)" }}
      >
        {label}
      </p>
      <p className="mt-2 text-base font-semibold" style={{ color: "var(--manga-text)" }}>
        {value}
      </p>
    </div>
  );
}
