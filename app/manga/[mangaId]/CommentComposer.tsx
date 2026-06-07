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
      <div className="yd-reply flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "linear-gradient(135deg, var(--home-gold-soft), var(--home-rose))",
              color: "#fff",
            }}
          >
            <MessageCircleMore size={18} />
          </span>
          <p style={{ fontSize: 14, color: "var(--home-plum)" }}>
            Хаягаараа нэвтэрч сэтгэгдэлээ хуваалцана уу.
          </p>
        </div>
        <Link href="/sign-in" className="yd-btn yd-btn-sm shrink-0">
          Нэвтрэх
          <SendHorizontal size={14} />
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="yd-reply">
      <input type="hidden" name="mangaId" value={mangaId} />
      <textarea
        name="body"
        rows={4}
        maxLength={1000}
        placeholder="Энэ цувралын талаар бодлоо бичнэ үү..."
        className="yd-textarea"
        required
      />

      {state.message ? (
        <p className={`yd-note ${state.ok ? "yd-note-ok" : "yd-note-err"}`}>
          {state.message}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={pending} className="yd-btn yd-btn-sm">
          <SendHorizontal size={14} />
          {pending ? "Нийтэлж байна..." : "Сэтгэгдэл нийтлэх"}
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
      <Link href="/sign-in" className="yd-textbtn">
        <Reply size={13} />
        Хариулахын тулд нэвтрэх
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)} className="yd-textbtn">
        <Reply size={13} />
        {open ? "Хаах" : "Хариулах"}
      </button>

      {open ? (
        <form
          ref={formRef}
          action={formAction}
          className="mt-2 w-full basis-full"
        >
          <input type="hidden" name="mangaId" value={mangaId} />
          <input type="hidden" name="parentId" value={parentId} />
          <textarea
            name="body"
            rows={3}
            maxLength={1000}
            placeholder="Хариултаа бичнэ үү..."
            className="yd-textarea"
            required
          />

          {state.message ? (
            <p className={`yd-note ${state.ok ? "yd-note-ok" : "yd-note-err"}`}>
              {state.message}
            </p>
          ) : null}

          <div className="mt-3 flex justify-end">
            <button type="submit" disabled={pending} className="yd-btn yd-btn-sm">
              <SendHorizontal size={13} />
              {pending ? "Илгээж байна..." : "Хариулт нийтлэх"}
            </button>
          </div>
        </form>
      ) : null}
    </>
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
      <button type="submit" disabled={pending} className="yd-textbtn yd-danger">
        <Trash2 size={13} />
        {pending ? "Устгаж байна..." : "Устгах"}
      </button>

      {state.message && !state.ok ? (
        <span className="yd-note yd-note-err" style={{ marginTop: 0 }}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
