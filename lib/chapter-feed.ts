import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { isPremium, resolvePaywalledChapters } from "@/lib/plans";
import {
  getFreeReadState,
  getFreeSpendChapterIds,
} from "@/lib/reading-access";
import { formatRelativeMn } from "@/lib/relative-time";
import type { MangaStatusValue } from "@/app/_components/MangaPosterCard";

/**
 * "Сүүлийн шинэчлэл" as a feed of chapters: every published chapter gets its
 * own card, newest first — three new chapters of one series are three cards.
 *
 * Card image, in order: the chapter's own cover (the "Бүлгийн thumbnail" set
 * in БҮЛГҮҮД or at upload), then the chapter's first page, then the series
 * poster. Clicking opens the chapter in the reader, where the usual free and
 * paid gating applies; cards that would spend a daily free read ask first,
 * exactly like the detail page's chapter list.
 */

export type ChapterFeedCard = {
  chapterId: string;
  chapterNumber: number;
  mangaId: string;
  mangaTitle: string;
  titleFont: string | null;
  status: MangaStatusValue;
  genre: string;
  imageUrl: string | null;
  /** "top" for a first page: long webtoon strips should show their start. */
  imagePosition: "center" | "top";
  /** e.g. "8 өдрийн өмнө". */
  timeLabel: string;
  publishedAt: string;
  /** Inside the series' subscriber-only window, for a non-premium viewer. */
  isPaywalled: boolean;
  /** Opening it would spend one of the viewer's daily free reads. */
  spendsFreeRead: boolean;
};

export type ChapterFeed = {
  cards: ChapterFeedCard[];
  total: number;
  /** Viewer's free reads left today (0 when signed out or premium). */
  freeRemaining: number;
};

// A chapter with no pages cannot be opened, and a future publishedAt is not
// out yet; neither belongs in the feed.
function publishedWhere(now: Date): Prisma.ChapterWhereInput {
  return { publishedAt: { lte: now }, pages: { some: {} } };
}

export async function loadChapterFeed({
  skip = 0,
  take,
  viewer,
}: {
  skip?: number;
  take: number;
  viewer: { id: string; premiumUntil: Date | null } | null;
}): Promise<ChapterFeed> {
  const now = new Date();
  const where = publishedWhere(now);

  const [chapters, total] = await Promise.all([
    prisma.chapter.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { chapterNumber: "desc" }, { id: "desc" }],
      skip,
      take,
      select: {
        id: true,
        chapterNumber: true,
        coverImage: true,
        publishedAt: true,
        pages: {
          orderBy: { pageNumber: "asc" },
          take: 1,
          select: { imageUrl: true },
        },
        manga: {
          select: {
            id: true,
            mangaName: true,
            status: true,
            titleFont: true,
            paywalledChapters: true,
            defaultPoster: true,
            homeCoverImage: true,
            coverImage: true,
            genres: { select: { genre: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.chapter.count({ where }),
  ]);

  if (chapters.length === 0) {
    return { cards: [], total, freeRemaining: 0 };
  }

  const chapterIds = chapters.map((chapter) => chapter.id);
  const paywalledChapterIds = await findPaywalledChapterIds(chapterIds);
  const flags = await getViewerFeedFlags(viewer, chapterIds, paywalledChapterIds);
  const spendIds = new Set(flags.spendIds);
  const viewerIsPremium = flags.premium;
  const freeRemaining = flags.freeRemaining;

  const cards = chapters.map((chapter): ChapterFeedCard => {
    const firstPage = chapter.pages[0]?.imageUrl ?? null;
    const poster =
      chapter.manga.defaultPoster ??
      chapter.manga.homeCoverImage ??
      chapter.manga.coverImage ??
      null;

    return {
      chapterId: chapter.id,
      chapterNumber: chapter.chapterNumber,
      mangaId: chapter.manga.id,
      mangaTitle: chapter.manga.mangaName,
      titleFont: chapter.manga.titleFont ?? null,
      status: chapter.manga.status,
      genre: chapter.manga.genres[0]?.genre.name ?? "Манга",
      imageUrl: chapter.coverImage ?? firstPage ?? poster,
      imagePosition: !chapter.coverImage && firstPage ? "top" : "center",
      timeLabel: formatRelativeMn(chapter.publishedAt, now),
      publishedAt: chapter.publishedAt.toISOString(),
      isPaywalled: !viewerIsPremium && paywalledChapterIds.has(chapter.id),
      spendsFreeRead: spendIds.has(chapter.id),
    };
  });

  return { cards, total, freeRemaining };
}

/**
 * Which of these chapters sit inside their series' subscriber-only window.
 * The rolling paywall locks each series' newest N chapters, so this counts the
 * newer chapters each one has within its own series.
 */
async function findPaywalledChapterIds(chapterIds: string[]): Promise<Set<string>> {
  if (chapterIds.length === 0) {
    return new Set();
  }

  const rows = await prisma.$queryRaw<
    Array<{ id: string; paywalledChapters: number | null; newer: number }>
  >(
    Prisma.sql`
      SELECT c.id, m."paywalledChapters",
        (SELECT COUNT(*)::int FROM "public"."Chapter" c2
          WHERE c2."mangaId" = c."mangaId" AND c2."chapterNumber" > c."chapterNumber") AS newer
      FROM "public"."Chapter" c
      JOIN "public"."Manga" m ON m.id = c."mangaId"
      WHERE c.id = ANY(${chapterIds}::text[])
    `,
  );

  return new Set(
    rows
      .filter((row) => {
        const window = resolvePaywalledChapters(row.paywalledChapters);
        return window > 0 && row.newer < window;
      })
      .map((row) => row.id),
  );
}

export type ViewerFeedFlags = {
  premium: boolean;
  /** Free reads left today (0 when signed out or premium). */
  freeRemaining: number;
  /** Chapters whose opening would spend one of today's free reads. */
  spendIds: string[];
};

/**
 * The per-reader half of a chapter card: is the reader premium (no locks), and
 * which chapters would cost a daily free read (ask first). The homepage
 * computes it while rendering; the cached /updates page asks for it from the
 * browser (app/api/reading/feed-flags) so the page itself can stay shared.
 */
export async function getViewerFeedFlags(
  viewer: { id: string; premiumUntil: Date | null } | null,
  chapterIds: string[],
  paywalledChapterIds?: Set<string>,
): Promise<ViewerFeedFlags> {
  if (!viewer || chapterIds.length === 0) {
    return { premium: isPremium(viewer), freeRemaining: 0, spendIds: [] };
  }

  if (isPremium(viewer)) {
    return { premium: true, freeRemaining: 0, spendIds: [] };
  }

  const paywalled = paywalledChapterIds ?? (await findPaywalledChapterIds(chapterIds));
  const reads = await prisma.readingProgress.findMany({
    where: { userId: viewer.id, chapterId: { in: chapterIds } },
    select: { chapterId: true },
  });
  const [spend, freeState] = await Promise.all([
    getFreeSpendChapterIds({
      user: viewer,
      chapterIds,
      readChapterIds: new Set(reads.map((row) => row.chapterId)),
      paywalledChapterIds: paywalled,
    }),
    getFreeReadState(viewer),
  ]);

  return {
    premium: false,
    freeRemaining: freeState.remaining,
    spendIds: [...spend],
  };
}
