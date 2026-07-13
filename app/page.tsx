import prisma from "@/lib/db";
import { HomeLanding } from "@/app/_components/HomeLanding";
import { getCurrentDbUser } from "@/lib/auth";

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
    coverUrl: manga.homeCoverImage ?? manga.coverImage ?? undefined,
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
      coverUrl: manga.homeCoverImage ?? manga.coverImage ?? undefined,
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

  const byPopularity = [...mangas].sort(
    (left, right) => right._count.chapters - left._count.chapters,
  );
  const byLatestUpdate = [...mangas].sort(
    (left, right) => latestPublishedAt(right) - latestPublishedAt(left),
  );

  const featured = byPopularity.slice(0, 5).map((manga) => ({
    id: manga.id,
    title: manga.mangaName,
    subtitle:
      manga.description ??
      "Романтик, уран зөгнөлт ертөнцөд умбан, дуртай цувралаа нээгээрэй.",
    chapter: manga.chapters[0]?.chapterNumber ?? 1,
    coverUrl:
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
      featured={featured}
      continueReading={continueReading}
      newlyAdded={mangas.slice(0, 12).map(toSeries)}
      latestUpdates={byLatestUpdate.slice(0, 12).map(toSeries)}
      popular={byPopularity.slice(0, 12).map(toSeries)}
      allManga={mangas.map(toSeries)}
      genreFilters={genreFilters.map((genre) => ({
        name: genre.name,
        mangaCount: genre._count.mangas,
      }))}
    />
  );
}
