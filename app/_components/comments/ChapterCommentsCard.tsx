"use client";

import { useState } from "react";
import { MessageCircle, PenLine } from "lucide-react";
import { CommentItem } from "@/app/_components/comments/CommentItem";
import { CommentsSheet } from "@/app/_components/comments/CommentsSheet";
import { COMMENT_STYLES } from "@/app/_components/comments/comment-styles";
import type { CommentPreview } from "@/lib/comment-rules";

/**
 * The comments block on a chapter's end screen: the count, the two newest
 * comments and the way into the full list. The first numbers come from the
 * reader page; posting or deleting in the sheet updates them here too.
 */
export function ChapterCommentsCard({
  chapterId,
  heading,
  initial,
}: {
  chapterId: string;
  heading: string;
  initial: CommentPreview;
}) {
  const [summary, setSummary] = useState(initial);
  const [sheet, setSheet] = useState<{ focusComposer: boolean } | null>(null);

  return (
    <section className="ycm ycm-card" aria-label="Сэтгэгдэл">
      <style>{COMMENT_STYLES}</style>

      <h2 className="ycm-card-head">
        <MessageCircle size={17} />
        Сэтгэгдэл ({summary.total})
      </h2>

      {summary.total === 0 ? (
        <>
          <p className="ycm-empty">Анхны сэтгэгдлийг та үлдээгээрэй</p>
          <button
            type="button"
            className="ycm-btn ycm-btn-gold"
            onClick={() => setSheet({ focusComposer: true })}
          >
            <PenLine size={15} />
            Сэтгэгдэл бичих
          </button>
        </>
      ) : (
        <>
          <div className="ycm-list">
            {summary.latest.map((comment) => (
              <CommentItem key={comment.id} comment={comment} clamp />
            ))}
          </div>
          <button
            type="button"
            className="ycm-btn ycm-btn-line"
            onClick={() => setSheet({ focusComposer: false })}
          >
            Бүгдийг харах
          </button>
        </>
      )}

      {sheet ? (
        <CommentsSheet
          chapterId={chapterId}
          heading={heading}
          initial={summary}
          focusComposer={sheet.focusComposer}
          onSummary={setSummary}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </section>
  );
}
