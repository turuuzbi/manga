import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { NewsFeedPage } from "@/app/news/NewsFeedPage";

// Older pages of the feed. A path segment rather than ?page=: reading search
// params would force every view to render on the server. Built on first
// request, then cached like /news.
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = {
  title: "Мэдээ — ЮҮМЭ Орчуулагч",
};

export default async function NewsPagedPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: raw } = await params;
  const page = Number(raw);

  if (!Number.isInteger(page) || page < 1 || page > 500) {
    notFound();
  }

  if (page === 1) {
    permanentRedirect("/news");
  }

  return <NewsFeedPage page={page} />;
}
