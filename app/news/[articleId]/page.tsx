import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, Newspaper } from "lucide-react";
import prisma from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth";
import { premiumDaysRemaining } from "@/lib/plans";
import { ARTICLE_KEY } from "@/lib/news";
import { MARKDOWN_STYLES, excerptOf, renderMarkdown } from "@/lib/markdown";
import { formatDateMn } from "@/lib/relative-time";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import { MarkArticleSeen } from "@/app/news/NewsFeedList";
import { NEWS_STYLES } from "@/app/news/news-styles";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ articleId: string }>;
};

function loadArticle(articleId: string) {
  return prisma.article.findFirst({
    where: { id: articleId, publishedAt: { lte: new Date() } },
    select: {
      id: true,
      title: true,
      body: true,
      imageUrl: true,
      authorName: true,
      publishedAt: true,
    },
  });
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { articleId } = await params;
  const article = await loadArticle(articleId);

  return article
    ? {
        title: `${article.title} — ЮҮМЭ Орчуулагч`,
        description: excerptOf(article.body, 160),
      }
    : {};
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { articleId } = await params;
  const [article, currentUser] = await Promise.all([
    loadArticle(articleId),
    getCurrentDbUser(),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <>
      <style>{NEWS_STYLES}</style>
      <style>{MARKDOWN_STYLES}</style>

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
          <Link href="/news" className="yn-back motion-ink-up">
            <ChevronLeft size={14} />
            Мэдээ
          </Link>

          <article className="yn-article motion-ink-up motion-ink-up-delay-1 mt-6">
            <p className="yn-meta">
              <Newspaper size={13} />
              <span>Мэдээ</span>
            </p>
            <h1 className="yn-article-title">{article.title}</h1>
            <p className="yn-byline">
              <strong>{article.authorName}</strong> ·{" "}
              <time dateTime={article.publishedAt.toISOString()}>
                {formatDateMn(article.publishedAt)}
              </time>
            </p>

            {article.imageUrl ? (
              <div className="yn-hero">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.imageUrl} alt="" />
              </div>
            ) : null}

            <div className="yn-body yume-md">{renderMarkdown(article.body)}</div>
          </article>
        </main>

        <MarkArticleSeen itemKey={ARTICLE_KEY(article.id)} />
      </div>
    </>
  );
}
