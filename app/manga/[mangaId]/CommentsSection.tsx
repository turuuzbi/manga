import Link from "next/link";
import { MessageSquareMore } from "lucide-react";
import {
  CommentComposer,
  DeleteCommentButton,
  ReplyComposer,
} from "@/app/manga/[mangaId]/CommentComposer";
import {
  formatRelativeTime,
  getUserDisplayName,
  getUserInitial,
} from "@/lib/community";

type CommentUser = {
  id: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
};

type ReplyItem = {
  id: string;
  body: string;
  createdAt: Date;
  user: CommentUser;
};

type CommentItem = {
  id: string;
  body: string;
  createdAt: Date;
  user: CommentUser;
  replies: ReplyItem[];
};

export function CommentsSection({
  mangaId,
  comments,
  currentUserId,
}: {
  mangaId: string;
  comments: CommentItem[];
  currentUserId?: string | null;
}) {
  const totalMessages =
    comments.length +
    comments.reduce((count, comment) => count + comment.replies.length, 0);

  return (
    <section id="comments" className="motion-ink-up motion-ink-up-delay-4 yd-panel">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="yd-section-title">Уншигчдын сэтгэгдэл</h2>
          <p className="yd-desc-soft">
            Уншсан цувралын талаарх сэтгэгдэлээ үлдээж бусад уншигчидтай санал
            бодлоо хуваалцаарай.
          </p>
        </div>
        <p className="yd-count">{totalMessages} нийт сэтгэгдэл</p>
      </div>

      <CommentComposer mangaId={mangaId} currentUserId={currentUserId} />

      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <div className="yd-reply flex flex-col items-center py-12 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, var(--home-gold-soft), var(--home-rose))",
                color: "#fff",
              }}
            >
              <MessageSquareMore size={24} />
            </span>
            <p
              className="mt-5"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--home-plum)",
              }}
            >
              Одоогоор сэтгэгдэл алга.
            </p>
            <p className="yd-desc-soft" style={{ marginTop: 6 }}>
              Энэ цувралын анхны сэтгэгдэлээ үлдээсэн уншигч болоорой.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="yd-comment">
              <CommentHeader user={comment.user} createdAt={comment.createdAt} />
              <p className="yd-comment-body">{comment.body}</p>

              <div className="yd-comment-actions">
                <ReplyComposer
                  mangaId={mangaId}
                  parentId={comment.id}
                  currentUserId={currentUserId}
                />
                {currentUserId === comment.user.id ? (
                  <DeleteCommentButton mangaId={mangaId} commentId={comment.id} />
                ) : null}
              </div>

              {comment.replies.length > 0 ? (
                <div className="yd-replies">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="yd-reply">
                      <CommentHeader
                        user={reply.user}
                        createdAt={reply.createdAt}
                        compact
                      />
                      <p className="yd-comment-body">{reply.body}</p>
                      {currentUserId === reply.user.id ? (
                        <div className="mt-3">
                          <DeleteCommentButton
                            mangaId={mangaId}
                            commentId={reply.id}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function CommentHeader({
  user,
  createdAt,
  compact = false,
}: {
  user: CommentUser;
  createdAt: Date;
  compact?: boolean;
}) {
  const displayName = getUserDisplayName(user);
  const size = compact ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  return (
    <div className="yd-comment-head">
      <Link href={`/users/${user.id}`} className="flex min-w-0 items-center gap-3">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            className={`yd-avatar ${size}`}
          />
        ) : (
          <span className={`yd-avatar ${size}`}>{getUserInitial(user)}</span>
        )}

        <span className="min-w-0">
          <span className="yd-name block truncate">{displayName}</span>
          <span className="yd-sub block">Профайл харах</span>
        </span>
      </Link>

      <span className="yd-time">{formatRelativeTime(createdAt)}</span>
    </div>
  );
}
