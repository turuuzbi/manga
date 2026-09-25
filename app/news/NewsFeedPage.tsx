import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getArticlePage } from "@/lib/news";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import {
  SectionHeader,
  YUME_CARD_STYLES,
} from "@/app/_components/MangaPosterCard";
import { NewsFeedList } from "@/app/news/NewsFeedList";
import { NEWS_STYLES } from "@/app/news/news-styles";

export function newsPageHref(page: number) {
  return page <= 1 ? "/news" : `/news/page/${page}`;
}

/**
 * One page of the МЭДЭЭ feed, rendered identically for every reader so it can
 * be cached (see the `revalidate` export on the routes using this). No auth or
 * cookies are read here: the menu's admin/premium state and the "new" markers
 * come from the browser's status call.
 */
export async function NewsFeedPage({ page }: { page: number }) {
  const { items, hasMore } = await getArticlePage(page);

  // Past the last page: a 404, not an empty page cached for five minutes.
  if (page > 1 && items.length === 0) {
    notFound();
  }

  return (
    <>
      <style>{YUME_CARD_STYLES}</style>
      <style>{NEWS_STYLES}</style>

      <div className="yume-surface yume-news relative min-h-screen">
        <CelestialFrame />

        <MangaTopNav />

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

          <NewsFeedList items={items} includeNotices={page === 1} />

          {page > 1 || hasMore ? (
            <nav className="yn-pager" aria-label="Хуудаслалт">
              {page > 1 ? (
                <Link href={newsPageHref(page - 1)} className="yume-pill">
                  <ChevronLeft size={13} className="-mt-0.5 inline" /> Өмнөх
                </Link>
              ) : null}
              {hasMore ? (
                <Link href={newsPageHref(page + 1)} className="yume-pill">
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
