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
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";
import { CommentsSection } from "@/app/manga/[mangaId]/CommentsSection";
import { MangaTopNav } from "@/app/_components/MangaTopNav";

export const dynamic = "force-dynamic";

const PREVIEW_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap');

.yume-detail { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-detail * { box-sizing: border-box; }

.yume-detail .yd-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--home-plum-soft); text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}
.yume-detail .yd-back:hover { color: var(--home-rose-deep); transform: translateX(-2px); }

.yume-detail .yd-eyebrow {
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;
  color: var(--home-gold);
  display: inline-flex; align-items: center; gap: 8px;
}

.yume-detail .yd-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic; line-height: 0.98;
}

/* ── Hero ── */
.yume-detail .yd-hero {
  position: relative;
  border-radius: 26px;
  overflow: hidden;
  min-height: clamp(380px, 54vw, 540px);
  border: 1px solid var(--home-line-strong);
  box-shadow: 0 30px 60px -28px var(--home-shadow-strong);
  background: var(--home-paper-2);
}
.yume-detail .yd-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.yume-detail .yd-hero-empty {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 28% 26%, color-mix(in srgb, var(--home-rose) 38%, transparent), transparent 56%),
    radial-gradient(circle at 76% 70%, color-mix(in srgb, var(--home-gold) 30%, transparent), transparent 58%),
    var(--home-paper-2);
  display: flex; align-items: center; justify-content: center;
  color: var(--home-gold);
}
.yume-detail .yd-hero-overlay { position: absolute; inset: 0; background: var(--home-overlay); }
.yume-detail .yd-hero-body {
  position: absolute; inset: 0; z-index: 2;
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: clamp(22px, 4vw, 48px);
}
.yume-detail .yd-hero-eyebrow { color: var(--home-gold-soft); }
.yume-detail .yd-hero .yd-title {
  color: #fff;
  font-size: clamp(2.4rem, 6.4vw, 4.6rem);
  text-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  max-width: 18ch; margin-top: 14px;
}
.yume-detail .yd-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.yume-detail .yd-tag {
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 5px 12px; border-radius: 999px;
  color: var(--home-on-dark-soft);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(4px);
}
.yume-detail .yd-hero-actions { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 12px; }

/* ── Buttons ── */
.yume-detail .yd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 13px 28px; border-radius: 999px;
  color: #fff; text-decoration: none; cursor: pointer;
  background: linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%);
  box-shadow: 0 14px 30px -12px var(--home-rose-deep);
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}
.yume-detail .yd-btn:hover { transform: translateY(-2px); box-shadow: 0 20px 36px -12px var(--home-rose-deep); }
.yume-detail .yd-btn-ghost {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 13px 26px; border-radius: 999px;
  text-decoration: none; cursor: pointer;
  color: var(--home-rose-deep); background: var(--home-paper);
  border: 1px solid var(--home-line);
  transition: transform 0.2s, border-color 0.2s, color 0.2s;
}
.yume-detail .yd-btn-ghost:hover { transform: translateY(-2px); border-color: var(--home-rose); }
.yume-detail .yd-btn-muted {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  padding: 13px 26px; border-radius: 999px;
  color: var(--home-on-dark-soft);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
}

/* ── Panels & stats ── */
.yume-detail .yd-panel {
  border-radius: 22px;
  background: var(--home-paper);
  border: 1px solid var(--home-line);
  box-shadow: 0 22px 48px -30px var(--home-shadow-strong);
  padding: clamp(22px, 3vw, 36px);
}
.yume-detail .yd-desc { margin-top: 14px; font-size: 15px; line-height: 1.85; color: var(--home-plum); }
.yume-detail .yd-stats {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px; border-radius: 16px; overflow: hidden;
  background: var(--home-line); border: 1px solid var(--home-line);
}
.yume-detail .yd-stat { background: var(--home-paper); padding: 16px 18px; }
.yume-detail .yd-stat-label {
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--home-gold);
}
.yume-detail .yd-stat-value {
  margin-top: 6px;
  font-family: 'Cormorant Garamond', serif; font-weight: 600;
  font-size: 20px; color: var(--home-plum);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── Section heading ── */
.yume-detail .yd-section-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic;
  font-size: clamp(26px, 3.4vw, 38px); color: var(--home-plum);
}
.yume-detail .yd-count {
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--home-plum-soft);
}

/* ── Chapter cards ── */
.yume-detail .yd-chapter {
  display: grid; grid-template-columns: 96px 1fr; align-items: stretch;
  border-radius: 16px; overflow: hidden; text-decoration: none;
  background: var(--home-paper); border: 1px solid var(--home-line);
  box-shadow: 0 12px 26px -20px var(--home-shadow-strong);
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
}
.yume-detail .yd-chapter:hover {
  transform: translateY(-3px);
  box-shadow: 0 22px 40px -22px var(--home-shadow-strong);
  border-color: var(--home-line-strong);
}
.yume-detail .yd-chapter-thumb {
  position: relative; min-height: 104px;
  background: var(--home-paper-2);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.yume-detail .yd-chapter-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.yume-detail .yd-chapter-thumb .badge { position: relative; z-index: 1; object-fit: contain; }
.yume-detail .yd-chapter-num {
  font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 700;
  font-size: 30px; color: var(--home-gold);
}
.yume-detail .yd-chapter-body { padding: 14px 18px; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.yume-detail .yd-chapter-title {
  font-family: 'Cormorant Garamond', serif; font-weight: 600;
  font-size: 19px; line-height: 1.2; color: var(--home-plum);
}
.yume-detail .yd-chapter:hover .yd-chapter-title { color: var(--home-rose-deep); }
.yume-detail .yd-chapter-meta {
  margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px 16px;
  font-size: 12.5px; color: var(--home-plum-soft);
}
.yume-detail .yd-chapter-meta span { display: inline-flex; align-items: center; gap: 6px; }
.yume-detail .yd-chapter-go {
  display: none; align-items: center; gap: 8px;
  padding: 0 22px; border-left: 1px solid var(--home-line);
  color: var(--home-rose-deep);
  font-family: 'Marcellus', serif; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  white-space: nowrap;
}
.yume-detail .yd-chapter-go svg { transition: transform 0.2s; }
.yume-detail .yd-chapter:hover .yd-chapter-go svg { transform: translateX(3px); }
@media (min-width: 640px) {
  .yume-detail .yd-chapter { grid-template-columns: 124px 1fr auto; }
  .yume-detail .yd-chapter-go { display: flex; }
}

.yume-detail .yd-empty {
  border-radius: 16px; border: 1px dashed var(--home-line-strong);
  background: var(--home-paper-2); padding: 52px 24px; text-align: center;
  color: var(--home-plum);
  font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 22px;
}

/* ── Comments ── */
.yume-detail .yd-btn-sm { padding: 10px 20px; font-size: 11px; }
.yume-detail .yd-desc-soft { margin-top: 10px; font-size: 14px; line-height: 1.7; color: var(--home-plum-soft); max-width: 60ch; }
.yume-detail .yd-comment {
  border-radius: 18px; background: var(--home-paper);
  border: 1px solid var(--home-line);
  box-shadow: 0 12px 26px -22px var(--home-shadow-strong);
  padding: 18px 20px;
}
.yume-detail .yd-comment-body {
  margin-top: 13px; font-size: 14.5px; line-height: 1.75;
  color: var(--home-plum); white-space: pre-wrap; word-break: break-word;
}
.yume-detail .yd-comment-head { display: flex; align-items: center; gap: 12px; }
.yume-detail .yd-avatar {
  border-radius: 999px; object-fit: cover;
  border: 1px solid var(--home-line-strong);
  background: linear-gradient(135deg, var(--home-gold-soft), var(--home-rose));
  display: flex; align-items: center; justify-content: center;
  font-family: 'Marcellus', serif; font-weight: 600; color: #fff;
  text-transform: uppercase; flex-shrink: 0;
}
.yume-detail .yd-name {
  font-family: 'Cormorant Garamond', serif; font-weight: 600;
  font-size: 17px; color: var(--home-plum); line-height: 1.1;
  transition: color 0.2s;
}
.yume-detail a:hover .yd-name { color: var(--home-rose-deep); }
.yume-detail .yd-sub {
  font-family: 'Marcellus', serif;
  font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--home-gold); margin-top: 2px;
}
.yume-detail .yd-time {
  margin-left: auto;
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--home-plum-soft); white-space: nowrap;
}
.yume-detail .yd-comment-actions { margin-top: 14px; display: flex; flex-wrap: wrap; align-items: center; gap: 18px; }
.yume-detail .yd-replies {
  margin-top: 16px; padding-left: 16px;
  border-left: 2px solid var(--home-line);
  display: flex; flex-direction: column; gap: 12px;
}
.yume-detail .yd-reply {
  border-radius: 14px; background: var(--home-paper-2);
  border: 1px solid var(--home-line); padding: 14px 16px;
}
.yume-detail .yd-textarea {
  width: 100%; border-radius: 14px;
  border: 1px solid var(--home-line); background: var(--home-paper);
  padding: 12px 15px; font-size: 14px; line-height: 1.65;
  color: var(--home-plum); outline: none; resize: vertical;
  font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.yume-detail .yd-textarea::placeholder { color: var(--home-plum-soft); }
.yume-detail .yd-textarea:focus {
  border-color: var(--home-rose);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-rose) 16%, transparent);
}
.yume-detail .yd-textbtn {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--home-plum-soft); background: none; border: none;
  cursor: pointer; padding: 0; text-decoration: none;
  transition: color 0.2s;
}
.yume-detail .yd-textbtn:hover { color: var(--home-rose-deep); }
.yume-detail .yd-danger { color: #b8617a; }
.yume-detail .yd-danger:hover { color: #94405b; }
.yume-detail .yd-note { font-size: 13px; margin-top: 12px; }
.yume-detail .yd-note-ok { color: #3f7d57; }
.yume-detail .yd-note-err { color: #c44d66; }
`;

const STATUS_LABELS: Record<string, string> = {
  ONGOING: "Гарч байгаа",
  COMPLETED: "Дууссан",
  CATCHING_UP: "Гүйцэж байна",
  FINISHED_RELEASING: "Эх дууссан",
  HIATUS: "Завсарласан",
};

type MangaPreviewPageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

function formatChapterLabel(chapterNumber: number, title: string | null) {
  return title ? `Бүлэг ${chapterNumber} • ${title}` : `Бүлэг ${chapterNumber}`;
}

function formatStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
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
          coverImage: true,
          badgeImage: true,
          badgeScale: true,
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

  // When a chapter has no custom badge and no thumbnail, fall back to a random
  // page from the middle of the chapter (skipping the first/last ~30% so we
  // avoid intro pages and ending spoilers). The random pick is done in the DB
  // via `random()` so this server render stays pure.
  const fallbackBandConditions = manga.chapters
    .filter(
      (chapter) =>
        !chapter.badgeImage &&
        !chapter.coverImage &&
        chapter._count.pages > 0,
    )
    .map((chapter) => {
      const pageCount = chapter._count.pages;
      const lowerPage = Math.floor(pageCount * 0.3) + 1;
      const upperPage = Math.max(lowerPage, Math.ceil(pageCount * 0.7));

      return Prisma.sql`("chapterId" = ${chapter.id} AND "pageNumber" BETWEEN ${lowerPage} AND ${upperPage})`;
    });

  const fallbackPages =
    fallbackBandConditions.length > 0
      ? await prisma.$queryRaw<Array<{ chapterId: string; imageUrl: string }>>(
          Prisma.sql`
            SELECT DISTINCT ON ("chapterId") "chapterId", "imageUrl"
            FROM "public"."Page"
            WHERE ${Prisma.join(fallbackBandConditions, " OR ")}
            ORDER BY "chapterId", random()
          `,
        )
      : [];

  const fallbackPageByChapter = new Map(
    fallbackPages.map((page) => [page.chapterId, page.imageUrl]),
  );

  const heroCover = manga.detailCoverImage ?? manga.coverImage ?? null;
  const genreTags =
    manga.genres.length > 0
      ? manga.genres.map((entry) => ({ id: entry.genreId, name: entry.genre.name }))
      : [{ id: "fallback", name: "Манга" }];

  const firstNum = firstReadableChapter?.chapterNumber ?? null;
  const lastNum = manga.chapters[0]?.chapterNumber ?? null;
  const rangeLabel =
    firstNum !== null && lastNum !== null
      ? firstNum === lastNum
        ? `Ch. ${lastNum}`
        : `Ch. ${firstNum}–${lastNum}`
      : "—";

  return (
    <div className="yume-surface yume-detail min-h-screen">
      <style>{PREVIEW_STYLES}</style>

      <MangaTopNav isAdmin={currentDbUser?.role === "ADMIN"} />

      <main className="motion-ink-fade relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link href="/" className="motion-ink-up yd-back">
          <ArrowLeft size={15} />
          Нүүр
        </Link>

        {/* Hero */}
        <section className="motion-ink-up motion-ink-up-delay-1 yd-hero">
          {heroCover ? (
            <img src={heroCover} alt={manga.mangaName} className="yd-hero-img" />
          ) : (
            <div className="yd-hero-empty">
              <Sparkles size={42} />
            </div>
          )}
          <div className="yd-hero-overlay" />
          <div className="yd-hero-body">
            <span className="yd-eyebrow yd-hero-eyebrow">
              <Sparkles size={13} />
              {formatStatusLabel(manga.status)}
            </span>
            <h1 className="yd-title">{manga.mangaName}</h1>
            <div className="yd-tags">
              {genreTags.map((tag) => (
                <span key={tag.id} className="yd-tag">
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="yd-hero-actions">
              {firstReadableChapter ? (
                <Link href={`/reader/${firstReadableChapter.id}`} className="yd-btn">
                  <BookOpen size={15} />
                  Уншиж эхлэх
                  <ChevronRight size={15} />
                </Link>
              ) : (
                <span className="yd-btn-muted">Уншах боломжтой бүлэг алга</span>
              )}
            </div>
          </div>
        </section>

        {/* About + stats */}
        <section className="motion-ink-up motion-ink-up-delay-2 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          <div className="yd-panel">
            <p className="yd-eyebrow">Тойм</p>
            <p className="yd-desc">
              {manga.description ?? "Бүлгүүдээс сонгоод уншиж эхэлээрэй."}
            </p>
            <div className="mt-7">
              <Link href="/" className="yd-btn-ghost">
                Илүү ихийг унших
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          <div className="yd-panel">
            <p className="yd-eyebrow">Мэдээлэл</p>
            <div className="yd-stats mt-5">
              <div className="yd-stat">
                <p className="yd-stat-label">Бүлгийн тоо</p>
                <p className="yd-stat-value">{manga.chapters.length}</p>
              </div>
              <div className="yd-stat">
                <p className="yd-stat-label">Бүлгийн хүрээ</p>
                <p className="yd-stat-value">{rangeLabel}</p>
              </div>
              <div className="yd-stat">
                <p className="yd-stat-label">Зохиолч</p>
                <p className="yd-stat-value">{manga.author ?? "Тодорхойгүй"}</p>
              </div>
              <div className="yd-stat">
                <p className="yd-stat-label">Зураач</p>
                <p className="yd-stat-value">{manga.artist ?? "Тодорхойгүй"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="motion-ink-up motion-ink-up-delay-3 yd-panel">
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="yd-section-title">Бүлгүүд</h2>
            <p className="yd-count">{manga.chapters.length} нийт бүлэг</p>
          </div>

          {manga.chapters.length === 0 ? (
            <div className="yd-empty">Одоогоор бүлэг алга</div>
          ) : (
            <div className="grid gap-4">
              {manga.chapters.map((chapter, index) => {
                const fallbackThumb = fallbackPageByChapter.get(chapter.id);

                return (
                  <Link
                    key={chapter.id}
                    href={`/reader/${chapter.id}`}
                    className="group motion-ink-up yd-chapter"
                    style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
                  >
                    <div className="yd-chapter-thumb">
                      {chapter.badgeImage ? (
                        <img
                          src={chapter.badgeImage}
                          alt={`Бүлэг ${chapter.chapterNumber} тэмдэг`}
                          className="badge"
                          style={{
                            width: `${chapter.badgeScale ?? 85}%`,
                            height: `${chapter.badgeScale ?? 85}%`,
                          }}
                        />
                      ) : chapter.coverImage ? (
                        <img
                          src={chapter.coverImage}
                          alt={`Бүлэг ${chapter.chapterNumber}`}
                        />
                      ) : fallbackThumb ? (
                        <img src={fallbackThumb} alt={`Бүлэг ${chapter.chapterNumber}`} />
                      ) : (
                        <span className="yd-chapter-num">{chapter.chapterNumber}</span>
                      )}
                    </div>

                    <div className="yd-chapter-body">
                      <p className="yd-chapter-title">
                        {formatChapterLabel(chapter.chapterNumber, chapter.title)}
                      </p>
                      <div className="yd-chapter-meta">
                        <span>
                          <BookOpen size={14} />
                          {chapter._count.pages} хуудас
                        </span>
                        <span>
                          <Clock3 size={14} />
                          {chapter.publishedAt.toLocaleDateString()}-нд оруулав
                        </span>
                      </div>
                    </div>

                    <div className="yd-chapter-go">
                      Унших
                      <ChevronRight size={16} />
                    </div>
                  </Link>
                );
              })}
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
