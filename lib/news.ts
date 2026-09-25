import prisma from "@/lib/db";
import { excerptOf } from "@/lib/markdown";
import { premiumDaysRemaining } from "@/lib/plans";
import { formatRelativeMn } from "@/lib/relative-time";

/**
 * МЭДЭЭ: admin articles (everyone) and personal notices (one reader), listed
 * together newest first and counted in one unread badge.
 *
 * Seen state: an article is seen once its popup is dismissed or it is opened.
 * Signed-in readers store that in ArticleSeen / UserNotification.seenAt;
 * signed-out readers keep the same keys in localStorage (lib/news-client).
 * Item keys are "a:<articleId>" and "n:<notificationId>" on both sides.
 */

/**
 * Only articles from this window count as unread. Without it, a brand-new or
 * signed-out reader would open the site to a badge for every post ever
 * written. Older articles stay in the feed; they just are not "new".
 */
export const NEWS_UNREAD_WINDOW_DAYS = 30;

export type NewsItem = {
  key: string;
  kind: "article" | "notice";
  title: string;
  excerpt: string;
  href: string;
  imageUrl: string | null;
  /** ISO date. */
  date: string;
  /** e.g. "3 цагийн өмнө", set wherever the item is sent to the browser. */
  dateLabel?: string;
  /** Null when the server cannot know (signed-out; the browser decides). */
  seen: boolean | null;
};

/**
 * Everything per-reader that a page needs, fetched once per page load by
 * lib/news-client. Pages that look the same for everyone (/news, /updates,
 * the library) are served from the cache without running any server code, so
 * their menu learns who is looking — admin, premium — from this instead.
 */
export type NewsStatus = {
  signedIn: boolean;
  isAdmin: boolean;
  /** Days left on the reader's subscription; null when they have none. */
  premiumDaysLeft: number | null;
  /** The reader's latest personal notices, seen or not, for the МЭДЭЭ feed. */
  notices: NewsItem[];
  /** Unread items for signed-in readers; for guests, see `recent`. */
  unreadCount: number;
  /** Keys of those unread items, so the badge can drop exactly the ones seen. */
  unreadKeys: string[];
  /** Newest unread item, for the one-time popup. */
  popup: NewsItem | null;
  /**
   * Guests only: every article inside the unread window, newest first. The
   * browser subtracts what it has already seen to get its count and popup.
   */
  recent: NewsItem[];
  /** The earned background this reader applied, if any. */
  backgroundUrl: string | null;
};

export const ARTICLE_KEY = (id: string) => `a:${id}`;
export const NOTICE_KEY = (id: string) => `n:${id}`;

function unreadWindowStart(now: Date) {
  return new Date(now.getTime() - NEWS_UNREAD_WINDOW_DAYS * 86_400_000);
}

type ArticleRow = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: Date;
};

type NoticeRow = {
  id: string;
  message: string;
  href: string | null;
  createdAt: Date;
  seenAt: Date | null;
  reward: { imageUrl: string } | null;
};

export function articleToItem(article: ArticleRow, seen: boolean | null): NewsItem {
  return {
    key: ARTICLE_KEY(article.id),
    kind: "article",
    title: article.title,
    excerpt: excerptOf(article.body),
    href: `/news/${article.id}`,
    imageUrl: article.imageUrl,
    date: article.publishedAt.toISOString(),
    seen,
  };
}

export function noticeToItem(notice: NoticeRow): NewsItem {
  return {
    key: NOTICE_KEY(notice.id),
    kind: "notice",
    // Notices are one sentence; it is both the headline and the whole text.
    title: notice.message,
    excerpt: "",
    href: notice.href ?? "/news",
    imageUrl: notice.reward?.imageUrl ?? null,
    date: notice.createdAt.toISOString(),
    seen: Boolean(notice.seenAt),
  };
}

const ARTICLE_SELECT = {
  id: true,
  title: true,
  body: true,
  imageUrl: true,
  publishedAt: true,
} as const;

const NOTICE_SELECT = {
  id: true,
  message: true,
  href: true,
  createdAt: true,
  seenAt: true,
  reward: { select: { imageUrl: true } },
} as const;

function byNewest(left: NewsItem, right: NewsItem) {
  return right.date.localeCompare(left.date);
}

/** Only article keys for articles that exist — never trust the browser's list. */
function parseArticleKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) {
    return [];
  }

  return [
    ...new Set(
      keys
        .filter((key): key is string => typeof key === "string")
        .filter((key) => key.startsWith("a:"))
        .map((key) => key.slice(2))
        .filter((id) => id.length > 0 && id.length <= 64),
    ),
  ].slice(0, 200);
}

function parseNoticeIds(keys: unknown): string[] {
  if (!Array.isArray(keys)) {
    return [];
  }

  return [
    ...new Set(
      keys
        .filter((key): key is string => typeof key === "string")
        .filter((key) => key.startsWith("n:"))
        .map((key) => key.slice(2))
        .filter((id) => id.length > 0 && id.length <= 64),
    ),
  ].slice(0, 200);
}

/**
 * Records items as seen for a signed-in reader. Unknown ids are ignored, and
 * repeats are no-ops, so the browser can send its whole local list.
 */
export async function markSeenForUser(userId: string, keys: unknown) {
  const articleIds = parseArticleKeys(keys);
  const noticeIds = parseNoticeIds(keys);

  if (articleIds.length > 0) {
    const existing = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true },
    });

    if (existing.length > 0) {
      await prisma.articleSeen.createMany({
        data: existing.map((article) => ({ userId, articleId: article.id })),
        skipDuplicates: true,
      });
    }
  }

  if (noticeIds.length > 0) {
    await prisma.userNotification.updateMany({
      where: { id: { in: noticeIds }, userId, seenAt: null },
      data: { seenAt: new Date() },
    });
  }
}

export async function getNewsStatus(
  user: {
    id: string;
    role: "READER" | "ADMIN";
    premiumUntil: Date | null;
    siteBackgroundId: string | null;
  } | null,
  guestSeenKeys: unknown,
): Promise<NewsStatus> {
  const now = new Date();
  const windowStart = unreadWindowStart(now);

  if (!user) {
    const articles = await prisma.article.findMany({
      where: { publishedAt: { gte: windowStart, lte: now } },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: ARTICLE_SELECT,
    });

    return {
      signedIn: false,
      isAdmin: false,
      premiumDaysLeft: null,
      notices: [],
      unreadCount: 0,
      unreadKeys: [],
      popup: null,
      recent: articles.map((article) => articleToItem(article, null)),
      backgroundUrl: null,
    };
  }

  // Anything this browser marked seen while signed out counts for the account
  // too, so signing in never resurrects a popup that was already dismissed.
  if (Array.isArray(guestSeenKeys) && guestSeenKeys.length > 0) {
    await markSeenForUser(user.id, guestSeenKeys);
  }

  const [articles, notices, background] = await Promise.all([
    prisma.article.findMany({
      where: {
        publishedAt: { gte: windowStart, lte: now },
        seenBy: { none: { userId: user.id } },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: ARTICLE_SELECT,
    }),
    // Newest notices, seen or not: the unread ones feed the badge and popup,
    // and all of them are listed in the (cached, shared) МЭДЭЭ feed.
    prisma.userNotification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: NEWS_PAGE_SIZE,
      select: NOTICE_SELECT,
    }),
    user.siteBackgroundId
      ? prisma.userReward.findFirst({
          where: { id: user.siteBackgroundId, userId: user.id },
          select: { imageUrl: true },
        })
      : null,
  ]);

  const noticeItems = notices.map((notice) => ({
    ...noticeToItem(notice),
    dateLabel: formatRelativeMn(notice.createdAt, now),
  }));
  const unread = [
    ...articles.map((article) => articleToItem(article, false)),
    ...noticeItems.filter((item) => !item.seen),
  ].sort(byNewest);

  return {
    signedIn: true,
    isAdmin: user.role === "ADMIN",
    premiumDaysLeft: premiumDaysRemaining(user, now),
    notices: noticeItems,
    unreadCount: unread.length,
    unreadKeys: unread.map((item) => item.key),
    popup: unread[0] ?? null,
    recent: [],
    backgroundUrl: background?.imageUrl ?? null,
  };
}

export const NEWS_PAGE_SIZE = 20;

/**
 * One page of МЭДЭЭ articles, newest first — identical for every reader, so
 * the page is cached and served without running any server code. What is
 * personal (unread markers, the reader's own notices) is layered on in the
 * browser from the status call (see app/news/NewsFeedList).
 */
export async function getArticlePage(page: number) {
  const now = new Date();
  const articles = await prisma.article.findMany({
    where: { publishedAt: { lte: now } },
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * NEWS_PAGE_SIZE,
    take: NEWS_PAGE_SIZE + 1,
    select: ARTICLE_SELECT,
  });

  return {
    items: articles.slice(0, NEWS_PAGE_SIZE).map((article) => ({
      ...articleToItem(article, null),
      dateLabel: formatRelativeMn(article.publishedAt, now),
    })),
    hasMore: articles.length > NEWS_PAGE_SIZE,
  };
}
