"use client";

import { useEffect } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { FREE_CHAPTERS_PER_DAY } from "@/lib/plans";

/**
 * Asks before an open spends one of the reader's daily free unlocks, so a
 * mistaken tap can't burn the allowance. It only guards the navigation — the
 * allowance rules themselves still live in lib/reading-access.
 *
 * Carries its own palette (paper card on a dark scrim) because it is used both
 * on the soft detail page and inside the dark reader.
 */
const STYLES = `
.yfc-overlay {
  position: fixed; inset: 0; z-index: 90;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  background: rgba(22, 12, 18, 0.62);
  backdrop-filter: blur(5px);
  animation: yfc-fade 0.18s ease;
}
.yfc-card {
  width: 100%; max-width: 380px;
  border-radius: 24px;
  padding: 26px 24px 22px;
  text-align: center;
  color: #56414c;
  background: #fffdfb;
  border: 1px solid rgba(200, 162, 76, 0.7);
  box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.55);
  animation: yfc-pop 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.yfc-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 52px; height: 52px; border-radius: 999px;
  color: #b9577b;
  background: #f8ecee;
  border: 1px solid rgba(200, 162, 76, 0.42);
}
.yfc-eyebrow {
  margin-top: 14px;
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
  color: #c8a24c;
}
.yfc-title {
  margin-top: 8px;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic; font-size: 27px; line-height: 1.15;
  color: #56414c;
}
.yfc-body {
  margin-top: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13.5px; line-height: 1.65; color: #8c7681;
}
.yfc-count { color: #b9577b; font-weight: 600; }
.yfc-actions { margin-top: 20px; display: flex; flex-direction: column; gap: 9px; }
.yfc-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Marcellus', serif;
  font-size: 11.5px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 13px 22px; border-radius: 999px;
  cursor: pointer; border: 1px solid transparent;
  transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
}
.yfc-btn-go {
  color: #fff;
  background: linear-gradient(135deg, #d27d9c 0%, #b9577b 100%);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 14px 28px -12px #b9577b;
}
.yfc-btn-go:hover { transform: translateY(-2px); }
.yfc-btn-cancel {
  color: #8c7681;
  background: #f8ecee;
  border-color: rgba(200, 162, 76, 0.42);
}
.yfc-btn-cancel:hover { color: #b9577b; }
@keyframes yfc-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes yfc-pop { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .yfc-overlay, .yfc-card { animation: none; }
  .yfc-btn-go:hover { transform: none; }
}
`;

export function FreeReadConfirm({
  chapterNumber,
  remaining,
  onConfirm,
  onCancel,
}: {
  /** Chapter about to be opened; null closes the dialog. */
  chapterNumber: number | null;
  /** Free unlocks the reader has left today, before this one. */
  remaining: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isOpen = chapterNumber !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="yfc-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Үнэгүй бүлэг унших баталгаажуулалт"
        onClick={onCancel}
      >
        <div className="yfc-card" onClick={(event) => event.stopPropagation()}>
          <span className="yfc-icon">
            <Sparkles size={22} />
          </span>
          <p className="yfc-eyebrow">Өдрийн үнэгүй эрх</p>
          <h2 className="yfc-title">
            Бүлэг {chapterNumber}-ыг үнэгүй унших уу?
          </h2>
          <p className="yfc-body">
            Өнөөдрийн үнэгүй эрхээс нэг нь зарцуулагдана. Одоо{" "}
            <span className="yfc-count">
              {remaining}/{FREE_CHAPTERS_PER_DAY}
            </span>{" "}
            эрх үлдсэн байна.
          </p>
          <div className="yfc-actions">
            <button
              type="button"
              className="yfc-btn yfc-btn-go"
              onClick={onConfirm}
              autoFocus
            >
              <BookOpen size={15} />
              Үнэгүй унших
            </button>
            <button
              type="button"
              className="yfc-btn yfc-btn-cancel"
              onClick={onCancel}
            >
              Болих
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
