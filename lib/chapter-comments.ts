import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { getUserDisplayName, getUserInitial } from "@/lib/community";
import { formatRelativeMn } from "@/lib/relative-time";
import {
  COMMENT_PAGE_SIZE,
  COMMENT_PREVIEW_SIZE,
  type ChapterCommentView,
  type CommentPage,
  type CommentPreview,
  type RecentCommentCard,
} from "@/lib/comment-rules";

export * from "@/lib/comment-rules";

/**
 * Chapter comments: the ones under a chapter's last page (Comment rows with a
 * chapterId; see the schema). Series comments on the manga page are separate
 * and untouched by everything here.
 */

export const RECENT_COMMENTS_TAG = "home-recent-comments";
const RECENT_COMMENTS_MAX = 10;
const RECENT_COMMENTS_MIN = 3;
const RECENT_COMMENTS_WINDOW_DAYS = 14;
/** How far back to look for 10 different commenters. */
const RECENT_COMMENTS_SCAN = 200;

type CommentViewer = { id: string; role: string } | null;

export const COMMENT_SELECT = {
  id: true,
  body: true,
  isSpoiler: true,
  createdAt: true,
  userId: true,
  user: { select: { username: true, email: true, avatarUrl: true } },
} satisfies Prisma.CommentSelect;

type CommentRow = Prisma.CommentGetPayload<{ select: typeof COMMENT_SELECT }>;

function visibleIn(chapterId: string): Prisma.CommentWhereInput {
  return { chapterId, deletedAt: null };
}

export function toCommentView(
  row: CommentRow,
  viewer: CommentViewer,
  now: Date = new Date(),
): ChapterCommentView {
  return {
    id: row.id,
    body: row.body,
    isSpoiler: row.isSpoiler,
    createdAt: row.createdAt.toISOString(),
    timeLabel: formatRelativeMn(row.createdAt, now),
    author: {
      name: getUserDisplayName(row.user),
      initial: getUserInitial(row.user),
      avatarUrl: row.user.avatarUrl,
    },
    canDelete: Boolean(
      viewer && (viewer.id === row.userId || viewer.role === "ADMIN"),
    ),
  };
}

/**
 * Trims, and folds runs of blank lines to one so a comment cannot be mostly
 * empty space. Length is then checked in characters (an emoji counts as one).
 */
export function normalizeCommentBody(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function commentLength(body: string): number {
  return Array.from(body).length;
}

export async function loadCommentPreview(
  chapterId: string,
  viewer: CommentViewer,
): Promise<CommentPreview> {
  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where: visibleIn(chapterId),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: COMMENT_PREVIEW_SIZE,
      select: COMMENT_SELECT,
    }),
    prisma.comment.count({ where: visibleIn(chapterId) }),
  ]);
  const now = new Date();

  return { total, latest: rows.map((row) => toCommentView(row, viewer, now)) };
}

/**
 * The cursor is the last comment's time and id, not a Prisma row cursor: a
 * soft-deleted cursor row would still be found by id and quietly throw the
 * page off by one.
 */
function encodeCursor(row: { createdAt: Date; id: string }) {
  return `${row.createdAt.toISOString()}~${row.id}`;
}

function decodeCursor(cursor: string | null) {
  const [iso, id] = (cursor ?? "").split("~");
  const createdAt = iso ? new Date(iso) : null;

  return createdAt && !Number.isNaN(createdAt.getTime()) && id
    ? { createdAt, id }
    : null;
}

/** A chapter's comments, newest first, COMMENT_PAGE_SIZE at a time. */
export async function listChapterComments({
  chapterId,
  cursor,
  viewer,
}: {
  chapterId: string;
  cursor: string | null;
  viewer: CommentViewer;
}): Promise<CommentPage> {
  const after = decodeCursor(cursor);
  const where: Prisma.CommentWhereInput = after
    ? {
        ...visibleIn(chapterId),
        OR: [
          { createdAt: { lt: after.createdAt } },
          { createdAt: after.createdAt, id: { lt: after.id } },
        ],
      }
    : visibleIn(chapterId);

  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: COMMENT_PAGE_SIZE + 1,
      select: COMMENT_SELECT,
    }),
    after ? undefined : prisma.comment.count({ where: visibleIn(chapterId) }),
  ]);

  const page = rows.slice(0, COMMENT_PAGE_SIZE);
  const now = new Date();

  return {
    comments: page.map((row) => toCommentView(row, viewer, now)),
    nextCursor:
      rows.length > COMMENT_PAGE_SIZE ? encodeCursor(page[page.length - 1]) : null,
    ...(total === undefined ? {} : { total }),
  };
}

const ubDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ulaanbaatar",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

async function loadRecentCommentsUncached(): Promise<RecentCommentCard[]> {
  const chapterComment = { chapterId: { not: null }, deletedAt: null };
  const since = new Date(Date.now() - RECENT_COMMENTS_WINDOW_DAYS * 86_400_000);

  const recentCount = await prisma.comment.count({
    where: { ...chapterComment, createdAt: { gte: since } },
  });

  // A quiet site shows no section at all rather than two stale cards.
  if (recentCount < RECENT_COMMENTS_MIN) {
    return [];
  }

  // Newest first, keeping each person's latest only, so one reader cannot
  // fill the whole carousel.
  const candidates = await prisma.comment.findMany({
    where: chapterComment,
    orderBy: { createdAt: "desc" },
    take: RECENT_COMMENTS_SCAN,
    select: { id: true, userId: true },
  });
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.userId)) continue;
    seen.add(candidate.userId);
    ids.push(candidate.id);
    if (ids.length === RECENT_COMMENTS_MAX) break;
  }

  const rows = await prisma.comment.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "desc" },
    select: {
      ...COMMENT_SELECT,
      chapter: {
        select: {
          id: true,
          chapterNumber: true,
          manga: {
            select: {
              mangaName: true,
              defaultPoster: true,
              homeCoverImage: true,
              coverImage: true,
            },
          },
        },
      },
    },
  });

  return rows.flatMap((row) => {
    if (!row.chapter) return [];
    const { manga } = row.chapter;

    return [
      {
        id: row.id,
        chapterId: row.chapter.id,
        mangaTitle: manga.mangaName,
        chapterLabel: `${row.chapter.chapterNumber}-р бүлэг`,
        coverUrl: manga.defaultPoster ?? manga.homeCoverImage ?? manga.coverImage ?? null,
        body: row.body,
        isSpoiler: row.isSpoiler,
        author: toCommentView(row, null).author,
        dateLabel: ubDate.format(row.createdAt).replaceAll("-", "."),
      },
    ];
  });
}

/**
 * The homepage carousel, cached for a minute so the (dynamic) homepage does
 * not query comments on every visit. Deleting a comment expires it at once.
 * Empty when the section should be hidden.
 */
export const loadRecentComments = unstable_cache(
  loadRecentCommentsUncached,
  [RECENT_COMMENTS_TAG],
  { revalidate: 60, tags: [RECENT_COMMENTS_TAG] },
);
