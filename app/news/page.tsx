import type { Metadata } from "next";
import { NewsFeedPage } from "@/app/news/NewsFeedPage";

// The same for every reader, so served from the cache: no server code runs
// for a cached hit. Publishing or editing an article revalidates it at once
// (app/admin/news-actions); this is only the fallback refresh.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Мэдээ — ЮҮМЭ Орчуулагч",
};

export default function NewsPage() {
  return <NewsFeedPage page={1} />;
}
