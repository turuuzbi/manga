"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Gift, Newspaper } from "lucide-react";
import { useNewsState } from "@/app/_components/NewsNotifier";
import { markNewsSeen } from "@/lib/news-client";
import type { NewsItem } from "@/lib/news";

export type NewsFeedEntry = NewsItem & { dateLabel: string };

/**
 * The МЭДЭЭ feed. The "new" marker comes from the shared client state once it
 * has loaded — that is the only place signed-out readers' seen state exists —
 * and from the server's answer until then.
 */
export function NewsFeedList({ items }: { items: NewsFeedEntry[] }) {
  const news = useNewsState();
  const unread = new Set(news.unreadKeys);

  return (
    <div className="yn-list">
      {items.map((item, index) => {
        const isUnread = news.loaded ? unread.has(item.key) : item.seen === false;
        const isNotice = item.kind === "notice";

        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => markNewsSeen([item.key])}
            className={`yn-item motion-ink-up${isUnread ? " is-unread" : ""}${isNotice ? " is-notice" : ""}`}
            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
          >
            <div className={`yn-thumb${item.imageUrl ? "" : " yn-thumb-icon"}`}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" loading="lazy" />
              ) : isNotice ? (
                <Gift size={24} />
              ) : (
                <Newspaper size={24} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="yn-meta">
                <span>{isNotice ? "Бэлэг" : "Мэдээ"}</span>
                <time dateTime={item.date}>{item.dateLabel}</time>
                {isUnread ? <span className="yn-new">Шинэ</span> : null}
              </p>
              <h2 className="yn-title">{item.title}</h2>
              {item.excerpt ? <p className="yn-excerpt">{item.excerpt}</p> : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Marks an article seen when its page is opened. The key is also kept
 * locally, and lib/news-client subtracts local keys from every status answer,
 * so even a status request already in flight cannot pop this article's own
 * popup over it.
 */
export function MarkArticleSeen({ itemKey }: { itemKey: string }) {
  useEffect(() => {
    markNewsSeen([itemKey]);
  }, [itemKey]);

  return null;
}
