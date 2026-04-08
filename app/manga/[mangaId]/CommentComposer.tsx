"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircleMore, Reply, SendHorizontal, Trash2 } from "lucide-react";
import {
  createMangaCommentAction,
  deleteMangaCommentAction,
  type CommentActionState,
} from "@/app/manga/[mangaId]/actions";

const initialCommentState: CommentActionState = {
  ok: false,
  message: "",
};

export function CommentComposer({
  mangaId,
  currentUserId,
}: {
  mangaId: string;
  currentUserId?: string | null;
}) {
  const [state, formAction, pending] = useActionState<
    CommentActionState,
    FormData
  >(createMangaCommentAction, initialCommentState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  if (!currentUserId) {
    return (
      <div className="panel-box bg-[#fffaf1] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#1a1108] bg-[#f5c518] text-[#1a1108]">
            <MessageCircleMore size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1108]">
              Sign in to join the discussion.
            </p>
            <p className="mt-1 text-sm leading-6 text-[#6f5c50]">
              Readers can leave reviews, reactions, and chapter thoughts here.
            </p>
            <Link
              href="/sign-in"
              className="mt-4 inline-flex items-center gap-2 border-2 border-[#1a1108] bg-[#1a1108] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#fffaf1] shadow-[3px_3px_0_#e8637e] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#e8637e]"
            >
              Sign In
              <SendHorizontal size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="panel-box bg-[#fffaf1] p-5">
      <input type="hidden" name="mangaId" value={mangaId} />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#1a1108] bg-[#f5c518] text-[#1a1108]">
          <MessageCircleMore size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a6a57]">
            Reader Comments
          </p>
          <p className="mt-1 text-sm leading-6 text-[#6f5c50]">
            Drop a quick review, what you liked, or what chapter hit hardest.
          </p>
        </div>
      </div>

      <label className="mt-5 block">
        <textarea
          name="body"
          rows={4}
          maxLength={1000}
          placeholder="Write your thoughts about this manga..."
          className="w-full border-2 border-[#1a1108] bg-[#fffdf8] px-4 py-3 text-sm text-[#1f1a16] outline-none transition placeholder:text-[#9c8b7f] focus:bg-white"
          required
        />
      </label>

      {state.message ? (
        <p
          className={`mt-3 text-sm ${
            state.ok ? "text-emerald-700" : "text-[#c44d66]"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6a57]">
          1000 character max
        </span>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 border-2 border-[#1a1108] bg-[#1a1108] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#fffaf1] shadow-[3px_3px_0_#e8637e] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#e8637e] disabled:cursor-wait disabled:opacity-70"
        >
          <SendHorizontal size={14} />
          {pending ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
}

export function ReplyComposer({
  mangaId,
  parentId,
  currentUserId,
}: {
  mangaId: string;
  parentId: string;
  currentUserId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    CommentActionState,
    FormData
  >(createMangaCommentAction, initialCommentState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  if (!currentUserId) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6a57] transition hover:text-[#1a1108]"
      >
        <Reply size={13} />
        Sign in to reply
      </Link>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6a57] transition hover:text-[#1a1108]"
      >
        <Reply size={13} />
        {open ? "Close Reply" : "Reply"}
      </button>

      {open ? (
        <form
          ref={formRef}
          action={formAction}
          className="mt-3 border-2 border-[#1a1108] bg-[#fffdf8] p-3"
        >
          <input type="hidden" name="mangaId" value={mangaId} />
          <input type="hidden" name="parentId" value={parentId} />
          <textarea
            name="body"
            rows={3}
            maxLength={1000}
            placeholder="Write a reply..."
            className="w-full resize-y bg-transparent text-sm text-[#1f1a16] outline-none placeholder:text-[#9c8b7f]"
            required
          />

          {state.message ? (
            <p
              className={`mt-2 text-sm ${
                state.ok ? "text-emerald-700" : "text-[#c44d66]"
              }`}
            >
              {state.message}
            </p>
          ) : null}

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 border-2 border-[#1a1108] bg-[#fff3d6] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1a1108] shadow-[2px_2px_0_#1a1108] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#1a1108] disabled:cursor-wait disabled:opacity-70"
            >
              <SendHorizontal size={13} />
              {pending ? "Replying..." : "Post Reply"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function DeleteCommentButton({
  mangaId,
  commentId,
}: {
  mangaId: string;
  commentId: string;
}) {
  const [state, formAction, pending] = useActionState<
    CommentActionState,
    FormData
  >(deleteMangaCommentAction, initialCommentState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="mangaId" value={mangaId} />
      <input type="hidden" name="commentId" value={commentId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b14a60] transition hover:text-[#8a243c] disabled:cursor-wait disabled:opacity-70"
      >
        <Trash2 size={13} />
        {pending ? "Deleting..." : "Delete"}
      </button>

      {state.message && !state.ok ? (
        <span className="text-xs text-[#c44d66]">{state.message}</span>
      ) : null}
    </form>
  );
}
