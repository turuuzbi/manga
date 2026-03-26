import prisma from "@/lib/db";
import { HomeLanding } from "@/app/_components/HomeLanding";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const mangas = await prisma.manga.findMany({
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
  });

  const featured = mangas[0];

  return (
    <HomeLanding
      featuredTitle={
        featured
          ? {
              id: featured.id,
              title: featured.mangaName,
              subtitle:
                featured.description ??
                "Open the preview page and pick a chapter to start reading.",
              chapter: featured.chapters[0]?.chapterNumber ?? 1,
            }
          : undefined
      }
      latestSeries={mangas.map((manga, index) => ({
        id: manga.id,
        title: manga.mangaName,
        genre: manga.genres[0]?.genre.name ?? "Manga",
        latestChapter: manga.chapters[0]?.chapterNumber ?? 0,
        coverUrl: manga.coverImage ?? undefined,
        isHot: index === 0,
      }))}
      trending={mangas.slice(0, 4).map((manga, index) => ({
        rank: index + 1,
        title: manga.mangaName,
        delta: `${manga._count.chapters} chapters`,
      }))}
    />
  );
}
