import prisma from "@/lib/db";
import { HomeLanding } from "@/app/_components/HomeLanding";
import { getCurrentDbUser } from "@/lib/auth";
import { premiumDaysRemaining } from "@/lib/plans";

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

  const continueReading = currentUser
    ? await loadContinueReading(currentUser.id)
    : [];

  const byLatestUpdate = [...mangas].sort(
    (left, right) => latestPublishedAt(right) - latestPublishedAt(left),
  );
  // Fully translated series get their own shelf, newest update first.
  const completed = byLatestUpdate.filter(
    (manga) => manga.status === "COMPLETED",
  );

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
      latestUpdates={byLatestUpdate.slice(0, 10).map(toSeries)}
      completed={completed.slice(0, 12).map(toSeries)}
      allManga={mangas.map(toSeries)}
      genreFilters={genreFilters.map((genre) => ({
        name: genre.name,
        mangaCount: genre._count.mangas,
      }))}
    />
  );
}
