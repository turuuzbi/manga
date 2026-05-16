import prisma from "@/lib/db";
import { HomeLanding } from "@/app/_components/HomeLanding";
import { getCurrentDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [currentUser, mangas, genreFilters] = await Promise.all([
    getCurrentDbUser(),
    prisma.manga.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        chapters: {
          orderBy: {
            chapterNumber: "desc",
          },
          take: 1,
          select: {
            id: true,
            chapterNumber: true,
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
    }),
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

  const featured = mangas[0];

  return (
    <HomeLanding
      isAdmin={currentUser?.role === "ADMIN"}
      featuredTitle={
        featured
          ? {
              id: featured.id,
              title: featured.mangaName,
              subtitle: featured.description ?? "Манга санд бүх манга бий.",
              chapter: featured.chapters[0]?.chapterNumber ?? 1,
              titleFont: featured.titleFont ?? null,
            }
          : undefined
      }
      latestSeries={mangas.map((manga, index) => ({
        id: manga.id,
        title: manga.mangaName,
        genres: manga.genres.map((entry) => entry.genre.name),
        latestChapter: manga.chapters[0]?.chapterNumber ?? 0,
        coverUrl:
          manga.homeCoverImage ?? manga.coverImage ?? undefined,
        status: manga.status,
        titleFont: manga.titleFont ?? null,
        isHot: index === 0,
      }))}
      trending={mangas.slice(0, 4).map((manga, index) => ({
        id: manga.id,
        rank: index + 1,
        title: manga.mangaName,
        delta: `${manga._count.chapters} chapters`,
      }))}
      genreFilters={genreFilters.map((genre) => ({
        name: genre.name,
        mangaCount: genre._count.mangas,
      }))}
    />
  );
}
