import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";
import { resolveChapterAccess } from "@/lib/reading-access";
import { ReaderExperience } from "@/app/reader/ReaderExperience";
import { Paywall } from "@/app/reader/Paywall";

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

  // Reading is gated: send logged-out users to sign in, then back to this
  // chapter. The homepage and manga detail pages stay public.
  const dbUser = await syncCurrentClerkUser();

  if (!dbUser) {
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(`/reader/${chapterId}`)}`,
    );
  }

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

  // Subscription / free-tier gate. Consumes a free unlock when needed.
  const access = await resolveChapterAccess({
    userId: dbUser.id,
    chapterId: chapter.id,
    premiumUntil: dbUser.premiumUntil,
  });

  if (!access.allowed) {
    return (
      <Paywall
        reason={access.reason}
        manga={{ id: chapter.manga.id, name: chapter.manga.mangaName }}
        chapterNumber={chapter.chapterNumber}
      />
    );
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
      isPremium={access.isPremium}
      freeRemaining={access.remainingFree}
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
