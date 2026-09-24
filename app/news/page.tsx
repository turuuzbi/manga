import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth";
import { premiumDaysRemaining } from "@/lib/plans";
import { getNewsFeed } from "@/lib/news";
import { formatRelativeMn } from "@/lib/relative-time";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import {
  SectionHeader,
  YUME_CARD_STYLES,
} from "@/app/_components/MangaPosterCard";
import { NewsFeedList } from "@/app/news/NewsFeedList";
import { NEWS_STYLES } from "@/app/news/news-styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мэдээ — ЮҮМЭ Орчуулагч",
};

type NewsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const currentUser = await getCurrentDbUser();
  const { items, hasMore } = await getNewsFeed({
    userId: currentUser?.id ?? null,
    page,
  });
  const now = new Date();

  return (
    <>
      <style>{YUME_CARD_STYLES}</style>
      <style>{NEWS_STYLES}</style>

      <div className="yume-surface yume-news relative min-h-screen">
        <CelestialFrame />

        <MangaTopNav
          isAdmin={currentUser?.role === "ADMIN"}
          premiumDaysLeft={premiumDaysRemaining(currentUser)}
        />

        <main
          className="motion-ink-fade relative mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6"
          style={{ zIndex: 1 }}
        >
          <Link href="/" className="yn-back motion-ink-up">
            <ChevronLeft size={14} />
            Нүүр
          </Link>

          <div className="mt-6">
            <SectionHeader eyebrow="Юмэгийн мэдээ" title="Мэдээ" />
          </div>

          {items.length > 0 ? (
            <NewsFeedList
              items={items.map((item) => ({
                ...item,
                dateLabel: formatRelativeMn(new Date(item.date), now),
              }))}
            />
          ) : (
            <div className="yn-empty">
              {page > 1
                ? "Энэ хуудсанд мэдээ алга."
                : "Одоогоор мэдээ алга. Шинэ мэдээ гарахад энд харагдана."}
            </div>
          )}

          {page > 1 || hasMore ? (
            <nav className="yn-pager" aria-label="Хуудаслалт">
              {page > 1 ? (
                <Link
                  href={page === 2 ? "/news" : `/news?page=${page - 1}`}
                  className="yume-pill"
                >
                  <ChevronLeft size={13} className="-mt-0.5 inline" /> Өмнөх
                </Link>
              ) : null}
              {hasMore ? (
                <Link href={`/news?page=${page + 1}`} className="yume-pill">
                  Дараах <ChevronRight size={13} className="-mt-0.5 inline" />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </main>
      </div>
    </>
  );
}
