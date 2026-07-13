import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";
import { ChapterList } from "@/app/manga/[mangaId]/ChapterList";
import { DetailHero } from "@/app/manga/[mangaId]/DetailHero";
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
.yume-detail .yd-btn-muted {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  padding: 13px 26px; border-radius: 999px;
  color: var(--home-on-dark-soft);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
}

/* Secondary "choose poster" action — glass button beside the primary CTA */
.yume-detail .yd-poster-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 12px 20px; border-radius: 999px;
  color: #fff; cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(6px);
  transition: transform 0.2s, background 0.2s, border-color 0.2s;
}
.yume-detail .yd-poster-btn:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* ── Poster picker sheet ── */
.yume-detail .yd-sheet-overlay {
  position: fixed; inset: 0; z-index: 70;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(22, 12, 18, 0.55);
  backdrop-filter: blur(4px);
  animation: yd-fade-in 0.2s ease;
}
.yume-detail .yd-sheet {
  width: 100%; max-width: 560px;
  max-height: 86vh; overflow-y: auto;
  background: var(--home-paper);
  border: 1px solid var(--home-line-strong);
  border-bottom: none;
  border-radius: 26px 26px 0 0;
  box-shadow: 0 -24px 60px -20px rgba(0, 0, 0, 0.5);
  padding: clamp(20px, 4vw, 30px);
  animation: yd-sheet-up 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.yume-detail .yd-sheet-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px; margin-bottom: 18px;
}
.yume-detail .yd-sheet-sub {
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--home-gold);
}
.yume-detail .yd-sheet-title {
  margin-top: 4px;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic; font-size: 27px;
  color: var(--home-plum);
}
.yume-detail .yd-sheet-close {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 999px;
  color: var(--home-plum-soft); cursor: pointer;
  background: var(--home-paper-2);
  border: 1px solid var(--home-line);
  transition: color 0.2s, border-color 0.2s;
}
.yume-detail .yd-sheet-close:hover { color: var(--home-rose-deep); border-color: var(--home-rose); }
.yume-detail .yd-poster-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;
}
@media (min-width: 480px) {
  .yume-detail .yd-poster-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.yume-detail .yd-poster-opt {
  position: relative; aspect-ratio: 3 / 4;
  border-radius: 14px; overflow: hidden; padding: 0; cursor: pointer;
  background: var(--home-paper-2);
  border: 1px solid var(--home-line);
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.yume-detail .yd-poster-opt img { width: 100%; height: 100%; object-fit: cover; display: block; }
.yume-detail .yd-poster-opt:hover { transform: translateY(-3px); border-color: var(--home-rose); }
.yume-detail .yd-poster-opt:disabled { cursor: default; opacity: 0.7; }
.yume-detail .yd-poster-opt.active {
  border-color: var(--home-rose-deep);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-rose) 45%, transparent);
}
.yume-detail .yd-poster-check {
  position: absolute; top: 6px; right: 6px; z-index: 2;
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 999px; color: #fff;
  background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
  box-shadow: 0 4px 10px -3px rgba(0, 0, 0, 0.4);
}
@keyframes yd-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes yd-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
@media (min-width: 640px) {
  .yume-detail .yd-sheet-overlay { align-items: center; padding: 24px; }
  .yume-detail .yd-sheet {
    border-radius: 26px; border-bottom: 1px solid var(--home-line-strong);
    box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.5);
    animation: yd-fade-in 0.22s ease;
  }
}
@media (prefers-reduced-motion: reduce) {
  .yume-detail .yd-sheet-overlay, .yume-detail .yd-sheet { animation: none; }
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

/* ── Chapter sort toggle ── */
.yume-detail .yd-sort {
  display: inline-flex; align-items: center; flex-shrink: 0;
  gap: 2px; padding: 3px; border-radius: 999px;
  background: var(--home-paper-2);
  border: 1px solid var(--home-line);
}
.yume-detail .yd-sort-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 7px 12px; border-radius: 999px;
  color: var(--home-plum-soft); background: none; border: none;
  cursor: pointer; white-space: nowrap;
  transition: color 0.2s, background 0.2s, box-shadow 0.2s;
}
.yume-detail .yd-sort-btn svg { flex-shrink: 0; }
.yume-detail .yd-sort-btn:hover { color: var(--home-rose-deep); }
.yume-detail .yd-sort-btn.active {
  color: #fff;
  background: linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%);
  box-shadow: 0 8px 18px -10px var(--home-rose-deep);
}
@media (max-width: 420px) {
  .yume-detail .yd-sort-btn { padding: 7px 10px; letter-spacing: 0.08em; }
}

/* ── Chapter cards ── */
.yume-detail .yd-chapter {
  position: relative;
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

/* ── Read (visited) state ── */
.yume-detail .yd-chapter.is-read { background: var(--home-paper-2); }
.yume-detail .yd-chapter.is-read .yd-chapter-thumb img { opacity: 0.5; }
.yume-detail .yd-chapter.is-read .yd-chapter-num { color: var(--home-plum-soft); }
.yume-detail .yd-chapter.is-read .yd-chapter-title { color: var(--home-plum-soft); }
.yume-detail .yd-chapter.is-read .yd-chapter-meta { color: var(--home-plum-soft); opacity: 0.85; }
.yume-detail .yd-chapter.is-read:hover .yd-chapter-title { color: var(--home-rose-deep); }

/* ── "You left off here" dog-ear on the most recently read chapter ── */
.yume-detail .yd-dogear {
  position: absolute; top: 0; right: 0; z-index: 4;
  width: 0; height: 0;
  border-top: 30px solid var(--home-rose-deep);
  border-left: 30px solid transparent;
  filter: drop-shadow(-1px 1px 1px rgba(0, 0, 0, 0.18));
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

/* Phones/tablets: full-bleed hero pushed up under the transparent header,
   blending into the content below. The back link is dropped since the header
   logo already returns home. Desktop is unchanged. */
@media (max-width: 900px) {
  .yume-detail main { padding-top: 0; }
  .yume-detail .yd-back { display: none; }
  .yume-detail .yd-hero {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    min-height: 62vh;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
}
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

  // Per-user chapter read-state: which chapters are read (muted) and which one
  // was read most recently (dog-ear marker). Empty for logged-out visitors.
  const readingRows = currentDbUser
    ? await prisma.readingProgress.findMany({
        where: { userId: currentDbUser.id, mangaId: manga.id },
        select: { chapterId: true, readAt: true },
      })
    : [];

  const readChapterIds = new Set(readingRows.map((row) => row.chapterId));
  const lastReadChapterId =
    readingRows.length > 0
      ? readingRows.reduce((latest, row) =>
          row.readAt > latest.readAt ? row : latest,
        ).chapterId
      : null;

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

  // Plain, serializable view-model for the client-sortable chapter list.
  // Must come after fallbackPageByChapter/read-state are computed above.
  const chapterItems = manga.chapters.map((chapter) => ({
    id: chapter.id,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    badgeImage: chapter.badgeImage,
    badgeScale: chapter.badgeScale,
    coverImage: chapter.coverImage,
    fallbackThumb: fallbackPageByChapter.get(chapter.id) ?? null,
    pageCount: chapter._count.pages,
    publishedLabel: `${chapter.publishedAt.toLocaleDateString()}-нд оруулав`,
    isRead: readChapterIds.has(chapter.id),
    isLastRead: chapter.id === lastReadChapterId,
  }));

  const heroCover = manga.detailCoverImage ?? manga.coverImage ?? null;
  const genreTags =
    manga.genres.length > 0
      ? manga.genres.map((entry) => ({ id: entry.genreId, name: entry.genre.name }))
      : [{ id: "fallback", name: "Манга" }];

  // Per-user poster preference. Only offer the picker to logged-in users when
  // the manga actually has more than one curated option to choose from.
  const posterOptions = manga.posterOptions;
  const posterChoice = currentDbUser
    ? await prisma.userPosterChoice.findUnique({
        where: {
          userId_mangaId: { userId: currentDbUser.id, mangaId: manga.id },
        },
        select: { posterUrl: true },
      })
    : null;
  const initialPoster =
    posterChoice && posterOptions.includes(posterChoice.posterUrl)
      ? posterChoice.posterUrl
      : null;
  const canChoosePoster = Boolean(currentDbUser) && posterOptions.length > 1;

  const firstNum = firstReadableChapter?.chapterNumber ?? null;
  const lastNum = manga.chapters[0]?.chapterNumber ?? null;
  const rangeLabel =
    firstNum !== null && lastNum !== null
      ? firstNum === lastNum
        ? `Ch. ${lastNum}`
        : `Ch. ${firstNum}–${lastNum}`
      : "—";

  return (
    <div className="yume-surface yume-detail relative min-h-screen">
      <style>{PREVIEW_STYLES}</style>

      <MangaTopNav isAdmin={currentDbUser?.role === "ADMIN"} overlay />

      <main className="motion-ink-fade relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link href="/" className="motion-ink-up yd-back">
          <ArrowLeft size={15} />
          Нүүр
        </Link>

        {/* Hero */}
        <DetailHero
          mangaId={manga.id}
          mangaName={manga.mangaName}
          statusLabel={formatStatusLabel(manga.status)}
          genreTags={genreTags}
          defaultCover={heroCover}
          posterOptions={posterOptions}
          initialPoster={initialPoster}
          firstChapterId={firstReadableChapter?.id ?? null}
          canChoosePoster={canChoosePoster}
        />

        {/* About + stats */}
        <section className="motion-ink-up motion-ink-up-delay-2 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          <div className="yd-panel">
            <p className="yd-eyebrow">Тойм</p>
            <p className="yd-desc">
              {manga.description ?? "Бүлгүүдээс сонгоод уншиж эхэлээрэй."}
            </p>
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
          <ChapterList items={chapterItems} />
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
