import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { ReaderExperience } from "@/app/reader/ReaderExperience";

export const dynamic = "force-dynamic";

type ReaderChapterPageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export default async function ReaderChapterPage({
  params,
}: ReaderChapterPageProps) {
  const { chapterId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      manga: {
        select: {
          id: true,
          mangaName: true,
        },
      },
      pages: {
        orderBy: {
          pageNumber: "asc",
        },
        select: {
          id: true,
          pageNumber: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!chapter || chapter.pages.length === 0) {
    notFound();
  }

  const chapters = await prisma.chapter.findMany({
    where: {
      mangaId: chapter.mangaId,
    },
    orderBy: {
      chapterNumber: "asc",
    },
    select: {
      id: true,
      chapterNumber: true,
    },
  });

  const currentChapterIndex = chapters.findIndex(
    (entry) => entry.id === chapter.id,
  );
  const previousChapter =
    currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1
      ? chapters[currentChapterIndex + 1]
      : null;

  return (
    <ReaderExperience
      manga={{
        id: chapter.manga.id,
        name: chapter.manga.mangaName,
      }}
      chapter={{
        id: chapter.id,
        number: chapter.chapterNumber,
        title: chapter.title,
      }}
      pages={chapter.pages}
      previousChapter={
        previousChapter
          ? {
              id: previousChapter.id,
              number: previousChapter.chapterNumber,
            }
          : null
      }
      nextChapter={
        nextChapter
          ? {
              id: nextChapter.id,
              number: nextChapter.chapterNumber,
            }
          : null
      }
    />
  );
}
