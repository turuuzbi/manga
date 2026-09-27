"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { ChapterCommentView, CommentAuthorView } from "@/lib/comment-rules";

/** A comment in a list; `pending` while an optimistic post is in flight. */
export type CommentListItem = ChapterCommentView & { pending?: boolean };

/** Profile picture, or the first letter of the name when there is none. */
export function CommentAvatar({
  author,
  small = false,
}: {
  author: CommentAuthorView;
  small?: boolean;
}) {
  return (
    <span className={`ycm-avatar${small ? " is-sm" : ""}`} aria-hidden="true">
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={author.avatarUrl} alt="" loading="lazy" />
      ) : (
        author.initial
      )}
    </span>
  );
}

export function CommentItem({
  comment,
  clamp = false,
  onDelete,
}: {
  comment: CommentListItem;
  /** Three lines at most (the end-of-chapter preview). */
  clamp?: boolean;
  /** Offered on comments the viewer may delete. */
  onDelete?: (commentId: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const hidden = comment.isSpoiler && !revealed;

  return (
    <article className={`ycm-item${comment.pending ? " is-pending" : ""}`}>
      <CommentAvatar author={comment.author} />
      <div className="ycm-item-main">
        <p className="ycm-meta">
          <span className="ycm-name">{comment.author.name}</span>
          <time className="ycm-time" dateTime={comment.createdAt}>
            {comment.timeLabel}
          </time>
        </p>

        {hidden ? (
          <p className="ycm-spoiler-row">
            ⚠️ Спойлер агуулж болзошгүй
            <button type="button" className="ycm-reveal" onClick={() => setRevealed(true)}>
              Харах
            </button>
          </p>
        ) : null}
        <p
          className={`ycm-body${clamp ? " ycm-clamp" : ""}${hidden ? " ycm-blur" : ""}`}
          aria-hidden={hidden || undefined}
        >
          {comment.body}
        </p>

        {onDelete && comment.canDelete && !comment.pending ? (
          <div className="ycm-actions">
            {confirming ? (
              <>
                <span>Устгах уу?</span>
                <button
                  type="button"
                  className="ycm-link-btn is-danger"
                  onClick={() => onDelete(comment.id)}
                >
                  Тийм, устгах
                </button>
                <button
                  type="button"
                  className="ycm-link-btn"
                  onClick={() => setConfirming(false)}
                >
                  Болих
                </button>
              </>
            ) : (
              <button
                type="button"
                className="ycm-link-btn inline-flex items-center gap-1"
                onClick={() => setConfirming(true)}
              >
                <Trash2 size={12} />
                Устгах
              </button>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
