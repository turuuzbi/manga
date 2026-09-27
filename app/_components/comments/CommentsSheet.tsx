"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { SendHorizontal, TriangleAlert, X } from "lucide-react";
import {
  createChapterCommentAction,
  deleteChapterCommentAction,
} from "@/app/_components/comments/actions";
import { CommentItem, type CommentListItem } from "@/app/_components/comments/CommentItem";
import { COMMENT_STYLES } from "@/app/_components/comments/comment-styles";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_PREVIEW_SIZE,
  type CommentPage,
  type CommentPreview,
} from "@/lib/comment-rules";
import { formatRelativeMn } from "@/lib/relative-time";

/**
 * A chapter's full comment list: a bottom sheet on phones, a centred panel
 * from 640px. Newest first with infinite scroll, and the composer pinned to
 * the bottom (a sign-in prompt for guests). Mounted only while open.
 */
export function CommentsSheet({
  chapterId,
  heading,
  initial,
  focusComposer = false,
  onSummary,
  onClose,
}: {
  chapterId: string;
  /** "Series – 12-р бүлэг", under the title. */
  heading: string;
  /** Shown straight away while the first page loads. */
  initial?: CommentPreview;
  focusComposer?: boolean;
  /** Reports the count and newest comments, so the card behind stays in step. */
  onSummary?: (summary: CommentPreview) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [items, setItems] = useState<CommentListItem[]>(initial?.latest ?? []);
  const [total, setTotal] = useState<number | null>(initial?.total ?? null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const loadingRef = useRef(false);
  /** Comments posted from this sheet, kept even if a page fetched earlier lacks them. */
  const postedRef = useRef(new Set<string>());

  const loadPage = useCallback(
    async (cursor: string | null) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setLoadFailed(false);

      try {
        const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
        const response = await fetch(`/api/comments/${chapterId}${query}`, {
          cache: "no-store",
        });

        if (!response.ok) throw new Error(String(response.status));

        const page = (await response.json()) as CommentPage;

        setItems((current) => {
          // The first page replaces the preview; later pages append. Anything
          // posted from this sheet meanwhile stays on top either way.
          if (!cursor) {
            const fetched = new Set(page.comments.map((item) => item.id));
            const posted = current.filter(
              (item) =>
                (item.pending || postedRef.current.has(item.id)) && !fetched.has(item.id),
            );
            return [...posted, ...page.comments];
          }

          const known = new Set(current.map((item) => item.id));
          return [...current, ...page.comments.filter((item) => !known.has(item.id))];
        });
        if (page.total !== undefined) setTotal(page.total);
        setNextCursor(page.nextCursor);
      } catch {
        setLoadFailed(true);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [chapterId],
  );

  useEffect(() => {
    void loadPage(null);
  }, [loadPage]);

  // Infinite scroll: the next page loads as the list's end comes into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadPage(nextCursor);
        }
      },
      { root: scrollRef.current, rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loadPage]);

  useEffect(() => {
    if (total !== null) {
      onSummary?.({ total, latest: items.slice(0, COMMENT_PREVIEW_SIZE) });
    }
  }, [items, total, onSummary]);

  // The page behind stays still while the sheet is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (focusComposer && textareaRef.current) {
      textareaRef.current.focus();
    } else {
      closeRef.current?.focus();
    }
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Keys typed here never reach the reader (its arrow keys turn pages).
    event.stopPropagation();

    if (event.key === "Escape") {
      onClose();
    }
  }

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();

    if (!body || sending) return;

    const displayName =
      user?.username || user?.primaryEmailAddress?.emailAddress.split("@")[0] || "Уншигч";
    const now = new Date();
    const optimistic: CommentListItem = {
      id: `pending-${now.getTime()}`,
      body,
      isSpoiler: spoiler,
      createdAt: now.toISOString(),
      timeLabel: formatRelativeMn(now, now),
      author: {
        name: displayName,
        initial: displayName.charAt(0).toUpperCase(),
        avatarUrl: user?.imageUrl ?? null,
      },
      canDelete: false,
      pending: true,
    };

    setItems((current) => [optimistic, ...current]);
    setTotal((current) => (current ?? 0) + 1);
    setDraft("");
    setSpoiler(false);
    setError("");
    setSending(true);
    scrollRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(resizeTextarea);

    const rollBack = (message: string) => {
      setItems((current) => current.filter((item) => item.id !== optimistic.id));
      setTotal((current) => Math.max(0, (current ?? 1) - 1));
      setDraft(body);
      setSpoiler(optimistic.isSpoiler);
      setError(message);
    };

    try {
      const result = await createChapterCommentAction({
        chapterId,
        body,
        isSpoiler: optimistic.isSpoiler,
      });

      if (result.ok) {
        postedRef.current.add(result.comment.id);
        setItems((current) =>
          current.map((item) => (item.id === optimistic.id ? result.comment : item)),
        );
        setTotal(result.total);
      } else {
        rollBack(result.message);
      }
    } catch {
      rollBack("Илгээж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setSending(false);
    }
  }

  async function remove(commentId: string) {
    const index = items.findIndex((item) => item.id === commentId);
    const removed = items[index];

    if (!removed) return;

    setItems((current) => current.filter((item) => item.id !== commentId));
    setTotal((current) => Math.max(0, (current ?? 1) - 1));
    setError("");

    const restore = (message: string) => {
      setItems((current) => {
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
      setTotal((current) => (current ?? 0) + 1);
      setError(message);
    };

    try {
      const result = await deleteChapterCommentAction(commentId);

      if (result.ok) {
        setTotal(result.total);
      } else {
        restore(result.message);
      }
    } catch {
      restore("Устгаж чадсангүй. Дахин оролдоно уу.");
    }
  }

  const length = draft.length;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(pathname || "/")}`;

  return createPortal(
    <div
      className="ycm ycm-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <style>{COMMENT_STYLES}</style>
      <div className="ycm-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="ycm-grip" aria-hidden="true" />
        <header className="ycm-sheet-head">
          <div className="ycm-sheet-title">
            <h2 id={titleId}>Сэтгэгдэл ({total ?? "…"})</h2>
            <p>{heading}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ycm-close"
            onClick={onClose}
            aria-label="Хаах"
          >
            <X size={18} />
          </button>
        </header>

        <div ref={scrollRef} className="ycm-scroll">
          {items.length > 0 ? (
            <div className="ycm-list">
              {items.map((item) => (
                <CommentItem key={item.id} comment={item} onDelete={remove} />
              ))}
            </div>
          ) : !loading && !loadFailed ? (
            <p className="ycm-status">Анхны сэтгэгдлийг та үлдээгээрэй</p>
          ) : null}

          {loading ? <p className="ycm-status">Ачаалж байна…</p> : null}
          {loadFailed ? (
            <p className="ycm-status">
              Сэтгэгдлийг ачаалж чадсангүй.{" "}
              <button
                type="button"
                className="ycm-link-btn"
                onClick={() => void loadPage(items.length > 0 ? nextCursor : null)}
              >
                Дахин оролдох
              </button>
            </p>
          ) : null}
          <div ref={sentinelRef} aria-hidden="true" />
        </div>

        <footer className="ycm-foot">
          {!isLoaded ? null : isSignedIn ? (
            <form onSubmit={submit}>
              <textarea
                ref={textareaRef}
                className="ycm-textarea"
                value={draft}
                maxLength={COMMENT_MAX_LENGTH}
                rows={1}
                placeholder="Сэтгэгдлээ бичээрэй…"
                aria-label="Сэтгэгдэл"
                onChange={(event) => {
                  setDraft(event.target.value);
                  resizeTextarea();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    void submit();
                  }
                }}
              />
              <div className="ycm-compose-row">
                <button
                  type="button"
                  className="ycm-toggle"
                  aria-pressed={spoiler}
                  onClick={() => setSpoiler((value) => !value)}
                >
                  <TriangleAlert size={14} />
                  Спойлер
                </button>
                <span
                  className={`ycm-counter${length > COMMENT_MAX_LENGTH - 50 ? " is-near" : ""}`}
                  aria-live="polite"
                >
                  {length}/{COMMENT_MAX_LENGTH}
                </span>
                <button
                  type="submit"
                  className="ycm-send"
                  disabled={!draft.trim() || sending}
                  aria-label="Илгээх"
                >
                  <SendHorizontal size={18} />
                </button>
              </div>
              {error ? (
                <p className="ycm-error" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          ) : (
            <div className="ycm-guest">
              <span>Сэтгэгдэл бичихийн тулд нэвтэрнэ үү</span>
              <Link href={signInHref} className="ycm-btn ycm-btn-gold">
                Нэвтрэх
              </Link>
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
