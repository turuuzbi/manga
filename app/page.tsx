import prisma from "@/lib/db";
import { HomeLanding } from "@/app/_components/HomeLanding";
import { getCurrentDbUser } from "@/lib/auth";
import { loadChapterFeed } from "@/lib/chapter-feed";
import { premiumDaysRemaining } from "@/lib/plans";

/** Chapter cards on the homepage rail; "Бүгдийг үзэх" pages through the rest. */
const HOME_CHAPTER_FEED_SIZE = 10;

export const dynamic = "force-dynamic";

type MangaWithMeta = Awaited<ReturnType<typeof loadMangas>>[number];

function loadMangas() {
  return prisma.manga.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      chapters: {
        orderBy: {
          publishedAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          chapterNumber: true,
          publishedAt: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      _count: {
        select: {
          chapters: true,
        },
      },
    },
  });
}

function toSeries(manga: MangaWithMeta) {
  return {
    id: manga.id,
    title: manga.mangaName,
    genres: manga.genres.map((entry) => entry.genre.name),
    latestChapter: manga.chapters[0]?.chapterNumber ?? 0,
    // The owner's chosen poster wins over whatever ingestion guessed.
    coverUrl:
      manga.defaultPoster ?? manga.homeCoverImage ?? manga.coverImage ?? undefined,
    status: manga.status,
    titleFont: manga.titleFont ?? null,
  };
}

function latestPublishedAt(manga: MangaWithMeta) {
  return manga.chapters[0]?.publishedAt?.getTime() ?? 0;
}

// The manga this user has read, most-recently-read first (one entry per manga).
async function loadContinueReading(userId: string) {
  const recent = await prisma.readingProgress.groupBy({
    by: ["mangaId"],
    where: { userId },
    _max: { readAt: true },
    orderBy: { _max: { readAt: "desc" } },
    take: 12,
  });

  if (recent.length === 0) {
    return [];
  }

  const mangas = await prisma.manga.findMany({
    where: { id: { in: recent.map((entry) => entry.mangaId) } },
    select: {
      id: true,
      mangaName: true,
      defaultPoster: true,
      homeCoverImage: true,
      coverImage: true,
    },
  });

  const byId = new Map(mangas.map((manga) => [manga.id, manga]));

  return recent
    .map((entry) => byId.get(entry.mangaId))
    .filter((manga): manga is NonNullable<typeof manga> => Boolean(manga))
    .map((manga) => ({
      id: manga.id,
      title: manga.mangaName,
      coverUrl:
        manga.defaultPoster ??
        manga.homeCoverImage ??
        manga.coverImage ??
        undefined,
    }));
}

export default async function HomePage() {
  const [currentUser, mangas, genreFilters] = await Promise.all([
    getCurrentDbUser(),
    loadMangas(),
    prisma.genre.findMany({
      // Only tags something is actually filed under. Admin writes prune empty
      // genres, but filtering here means a stale row can never reach a reader
      // even in the window before that runs.
      where: {
        mangas: {
          some: {},
        },
      },
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            mangas: true,
          },
        },
      },
    }),
  ]);

  const [continueReading, chapterFeed] = await Promise.all([
    currentUser ? loadContinueReading(currentUser.id) : [],
    loadChapterFeed({ take: HOME_CHAPTER_FEED_SIZE, viewer: currentUser }),
  ]);

  const byLatestUpdate = [...mangas].sort(
    (left, right) => latestPublishedAt(right) - latestPublishedAt(left),
  );
  // Fully translated series get their own shelf, newest update first.
  const completed = byLatestUpdate.filter(
    (manga) => manga.status === "COMPLETED",
  );

  // Most-opened series, highest first. Sorted from the already-loaded rows
  // rather than re-querying. Series with no opens yet are left out so the rail
  // ranks real interest instead of padding itself with arbitrary titles.
  // `toSeries` deliberately does not carry viewCount — readers see the order,
  // never the numbers.
  const topViewed = [...mangas]
    .filter((manga) => manga.viewCount > 0)
    .sort(
      (left, right) =>
        right.viewCount - left.viewCount ||
        left.mangaName.localeCompare(right.mangaName),
    )
    .slice(0, 10)
    .map(toSeries);

  // Ad panels: four fixed slots between the shelves (see HomeLanding), one
  // banner each. A banner needs both artwork and a slot to show; an empty
  // slot renders nothing at all.
  const promoSlots = [1, 2, 3, 4].map((slot) => {
    const manga = mangas.find(
      (entry) => entry.promoSlot === slot && Boolean(entry.promoImageUrl),
    );

    return manga
      ? {
          id: manga.id,
          title: manga.mangaName,
          imageUrl: manga.promoImageUrl as string,
        }
      : null;
  });

  // Owner-curated hero. Ordered by the admin-set featuredOrder; anything left
  // without an order falls to the end, alphabetically.
  const featuredManga = mangas
    .filter((manga) => manga.isFeatured)
    .sort(
      (left, right) =>
        (left.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.featuredOrder ?? Number.MAX_SAFE_INTEGER) ||
        left.mangaName.localeCompare(right.mangaName),
    );

  const featured = featuredManga.map((manga) => ({
    id: manga.id,
    title: manga.mangaName,
    coverUrl:
      manga.defaultPoster ??
      manga.detailCoverImage ??
      manga.homeCoverImage ??
      manga.coverImage ??
      undefined,
    titleFont: manga.titleFont ?? null,
    genres: manga.genres.map((entry) => entry.genre.name).slice(0, 3),
  }));

  return (
    <HomeLanding
      isAdmin={currentUser?.role === "ADMIN"}
      premiumDaysLeft={premiumDaysRemaining(currentUser)}
      featured={featured}
      continueReading={continueReading}
      latestChapters={chapterFeed.cards}
      freeRemaining={chapterFeed.freeRemaining}
      topViewed={topViewed}
      promoSlots={promoSlots}
      completed={completed.slice(0, 12).map(toSeries)}
      allManga={mangas.map(toSeries)}
      genreFilters={genreFilters.map((genre) => ({
        name: genre.name,
        mangaCount: genre._count.mangas,
      }))}
    />
  );
}
