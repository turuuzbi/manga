import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";
import {
  getFreeSpendChapterIds,
  resolveChapterAccess,
} from "@/lib/reading-access";
import { resolvePaywalledChapters } from "@/lib/plans";
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
          paywalledChapters: true,
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
    chapter: {
      id: chapter.id,
      mangaId: chapter.mangaId,
      chapterNumber: chapter.chapterNumber,
      paywalledChapters: chapter.manga.paywalledChapters,
    },
    premiumUntil: dbUser.premiumUntil,
  });

  if (!access.allowed) {
    return (
      <Paywall
        reason={access.reason}
        manga={{ id: chapter.manga.id, name: chapter.manga.mangaName }}
        chapterNumber={chapter.chapterNumber}
        paywallWindow={resolvePaywalledChapters(chapter.manga.paywalledChapters)}
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

  // Confirm before a neighbouring chapter spends a free unlock, so a stray tap
  // on "next" can't burn the daily allowance. `chapters` is ordered ascending,
  // so the paywalled window is its tail.
  const neighbourIds = [previousChapter?.id, nextChapter?.id].filter(
    (id): id is string => Boolean(id),
  );
  const neighbourReads =
    neighbourIds.length > 0
      ? await prisma.readingProgress.findMany({
          where: { userId: dbUser.id, chapterId: { in: neighbourIds } },
          select: { chapterId: true },
        })
      : [];
  const paywallWindow = resolvePaywalledChapters(
    chapter.manga.paywalledChapters,
  );
  const freeSpendChapterIds = await getFreeSpendChapterIds({
    user: dbUser,
    chapterIds: neighbourIds,
    readChapterIds: new Set(neighbourReads.map((row) => row.chapterId)),
    paywalledChapterIds: new Set(
      paywallWindow > 0
        ? chapters.slice(-paywallWindow).map((entry) => entry.id)
        : [],
    ),
  });

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
              spendsFreeRead: freeSpendChapterIds.has(previousChapter.id),
            }
          : null
      }
      nextChapter={
        nextChapter
          ? {
              id: nextChapter.id,
              number: nextChapter.chapterNumber,
              spendsFreeRead: freeSpendChapterIds.has(nextChapter.id),
            }
          : null
      }
    />
  );
}
