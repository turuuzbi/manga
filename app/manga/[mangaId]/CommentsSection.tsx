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
    <section
      id="comments"
      className="panel-frame motion-ink-up motion-ink-up-delay-3 p-5 sm:p-7"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="section-block">
            <span>Reader Comments</span>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5f5146] sm:text-base">
            Let readers leave reviews, reactions, and quick thoughts about the
            manga. Replies keep the conversation tied to each comment thread.
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6a57]">
          {totalMessages} total messages
        </p>
      </div>

      <CommentComposer mangaId={mangaId} currentUserId={currentUserId} />

      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <div className="panel-box bg-[#fff9ee] p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-[#1a1108] bg-[#f5c518] text-[#1a1108]">
              <MessageSquareMore size={24} />
            </div>
            <p className="mt-4 text-lg font-semibold text-[#1a1108]">
              No comments yet.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6f5c50]">
              Be the first reader to leave a quick review for this series.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="panel-box overflow-hidden bg-[#fffaf1]">
              <div className="border-b-2 border-[#1a1108] bg-[#fff7ea] px-4 py-4 sm:px-5">
                <CommentHeader user={comment.user} createdAt={comment.createdAt} />
              </div>
              <div className="px-4 py-4 sm:px-5">
                <p className="text-sm leading-7 text-[#2a211b] sm:text-[15px]">
                  {comment.body}
                </p>

                <ReplyComposer
                  mangaId={mangaId}
                  parentId={comment.id}
                  currentUserId={currentUserId}
                />

                {currentUserId === comment.user.id ? (
                  <div className="mt-3">
                    <DeleteCommentButton
                      mangaId={mangaId}
                      commentId={comment.id}
                    />
                  </div>
                ) : null}

                {comment.replies.length > 0 ? (
                  <div className="mt-5 space-y-3 border-l-4 border-[#f1dcc0] pl-3 sm:pl-5">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="border-2 border-[#1a1108]/15 bg-[#fffdf8] px-4 py-4"
                      >
                        <CommentHeader
                          user={reply.user}
                          createdAt={reply.createdAt}
                          compact
                        />
                        <p className="mt-3 text-sm leading-7 text-[#3f342b]">
                          {reply.body}
                        </p>
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
              </div>
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

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/users/${user.id}`}
        className="flex items-center gap-3 text-[#1a1108] transition hover:text-[#e8637e]"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            className={`${compact ? "h-9 w-9" : "h-11 w-11"} rounded-full border-2 border-[#1a1108] object-cover`}
          />
        ) : (
          <div
            className={`${
              compact ? "h-9 w-9 text-sm" : "h-11 w-11 text-base"
            } flex items-center justify-center rounded-full border-2 border-[#1a1108] bg-[#f5c518] font-extrabold uppercase`}
          >
            {getUserInitial(user)}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">
            {displayName}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6a57]">
            View profile
          </p>
        </div>
      </Link>

      <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6a57]">
        {formatRelativeTime(createdAt)}
      </span>
    </div>
  );
}
