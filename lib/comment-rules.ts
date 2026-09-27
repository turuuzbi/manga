/**
 * Chapter-comment limits and the shapes the browser receives. Kept free of
 * server imports so client components can share them with lib/chapter-comments.
 */

export const COMMENT_MAX_LENGTH = 500;
/** One comment per user per this many seconds, checked in the database. */
export const COMMENT_COOLDOWN_SECONDS = 30;
export const COMMENT_PAGE_SIZE = 20;
/** Comments shown on the chapter's end screen before "Бүгдийг харах". */
export const COMMENT_PREVIEW_SIZE = 2;

export type CommentAuthorView = {
  name: string;
  initial: string;
  avatarUrl: string | null;
};

/** One chapter comment as the browser gets it. Times are text, set on the server. */
export type ChapterCommentView = {
  id: string;
  body: string;
  isSpoiler: boolean;
  createdAt: string;
  /** "5 минутын өмнө" */
  timeLabel: string;
  author: CommentAuthorView;
  /** The viewer may delete it: their own, or any comment for an admin. */
  canDelete: boolean;
};

export type CommentPreview = {
  total: number;
  latest: ChapterCommentView[];
};

export type CommentPage = {
  comments: ChapterCommentView[];
  /** Pass back as ?cursor= for the next page; null on the last one. */
  nextCursor: string | null;
  /** Only on the first page. */
  total?: number;
};

/** A card in the homepage "Сүүлд бичигдсэн сэтгэгдлүүд" carousel. */
export type RecentCommentCard = {
  id: string;
  chapterId: string;
  mangaTitle: string;
  /** "12-р бүлэг" */
  chapterLabel: string;
  coverUrl: string | null;
  body: string;
  isSpoiler: boolean;
  author: CommentAuthorView;
  /** "2026.09.28", Ulaanbaatar time */
  dateLabel: string;
};
