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

  // How many newer chapters each one has within its own series — the rolling
  // paywall locks the newest N, so this is what decides "locked".
  const newerCounts = await prisma.$queryRaw<Array<{ id: string; newer: number }>>(
    Prisma.sql`
      SELECT c.id,
        (SELECT COUNT(*)::int FROM "public"."Chapter" c2
          WHERE c2."mangaId" = c."mangaId" AND c2."chapterNumber" > c."chapterNumber") AS newer
      FROM "public"."Chapter" c
      WHERE c.id = ANY(${chapterIds}::text[])
    `,
  );
  const newerById = new Map(newerCounts.map((row) => [row.id, row.newer]));

  const paywalledChapterIds = new Set(
    chapters
      .filter((chapter) => {
        const window = resolvePaywalledChapters(chapter.manga.paywalledChapters);
        return window > 0 && (newerById.get(chapter.id) ?? 0) < window;
      })
      .map((chapter) => chapter.id),
  );

  const viewerIsPremium = isPremium(viewer);
  let spendIds = new Set<string>();
  let freeRemaining = 0;

  if (viewer && !viewerIsPremium) {
    const reads = await prisma.readingProgress.findMany({
      where: { userId: viewer.id, chapterId: { in: chapterIds } },
      select: { chapterId: true },
    });
    const [spend, freeState] = await Promise.all([
      getFreeSpendChapterIds({
        user: viewer,
        chapterIds,
        readChapterIds: new Set(reads.map((row) => row.chapterId)),
        paywalledChapterIds,
      }),
      getFreeReadState(viewer),
    ]);
    spendIds = spend;
    freeRemaining = freeState.remaining;
  }

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
