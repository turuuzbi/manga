"use client";

import Link from "next/link";
import { BookOpen, ShieldAlert } from "lucide-react";
import {
  CONTENT_WARNINGS,
  type ContentWarningValue,
} from "@/lib/content-warning";

/**
 * Same card language as FreeReadConfirm (paper card on a dark scrim), on the
 * reader's black so nothing of the chapter shows behind it.
 */
const STYLES = `
.ycw-screen {
  position: fixed; inset: 0; z-index: 90;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at top, rgba(249, 115, 22, 0.08), transparent 32%),
    #050505;
  animation: ycw-fade 0.18s ease;
}
.ycw-card {
  width: 100%; max-width: 380px;
  max-height: 100%; overflow-y: auto;
  border-radius: 24px;
  padding: 26px 24px 22px;
  text-align: center;
  color: #56414c;
  background: #fffdfb;
  border: 1px solid rgba(200, 162, 76, 0.7);
  box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.55);
  animation: ycw-pop 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.ycw-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 52px; height: 52px; border-radius: 999px;
  color: #b9577b;
  background: #f8ecee;
  border: 1px solid rgba(200, 162, 76, 0.42);
}
.ycw-eyebrow {
  margin-top: 14px;
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
  color: #c8a24c;
}
.ycw-badge {
  display: inline-block; margin-top: 10px;
  padding: 4px 14px; border-radius: 999px;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic; font-size: 24px; line-height: 1.15;
  color: #b9577b;
  background: #f8ecee;
}
.ycw-body {
  margin-top: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; line-height: 1.65; color: #6f5a65;
}
.ycw-chapter { margin-top: 8px; font-size: 12px; color: #8c7681; }
.ycw-actions { margin-top: 20px; display: flex; flex-direction: column; gap: 9px; }
.ycw-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 46px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;
  padding: 13px 22px; border-radius: 999px;
  cursor: pointer; border: 1px solid transparent; text-decoration: none;
  transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
}
.ycw-btn-read {
  color: #fff;
  background: linear-gradient(135deg, #d27d9c 0%, #b9577b 100%);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 14px 28px -12px #b9577b;
}
.ycw-btn-read:hover { transform: translateY(-2px); }
.ycw-btn-leave {
  color: #8c7681;
  background: #f8ecee;
  border-color: rgba(200, 162, 76, 0.42);
}
.ycw-btn-leave:hover { color: #b9577b; }
@keyframes ycw-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ycw-pop { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .ycw-screen, .ycw-card { animation: none; }
  .ycw-btn-read:hover { transform: none; }
}
`;

/**
 * Full-screen notice for a chapter marked 18+ or violent. The reader renders
 * this instead of the chapter, so no page image is requested until "УНШИХ".
 * There is no backdrop dismiss: the reader picks one of the two buttons.
 */
export function ContentWarningModal({
  warning,
  chapterLabel,
  mangaId,
  onAccept,
}: {
  warning: ContentWarningValue;
  chapterLabel: string;
  mangaId: string;
  onAccept: () => void;
}) {
  const copy = CONTENT_WARNINGS[warning];

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="ycw-screen"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ycw-title"
        aria-describedby="ycw-body"
      >
        <div className="ycw-card">
          <span className="ycw-icon">
            <ShieldAlert size={22} />
          </span>
          <p className="ycw-eyebrow" id="ycw-title">
            Анхааруулга
          </p>
          <p className="ycw-badge">{copy.badge}</p>
          <p className="ycw-body" id="ycw-body">
            {copy.body}
          </p>
          <p className="ycw-chapter">{chapterLabel}</p>
          <div className="ycw-actions">
            <button
              type="button"
              className="ycw-btn ycw-btn-read"
              onClick={onAccept}
              autoFocus
            >
              <BookOpen size={15} />
              УНШИХ
            </button>
            <Link href={`/manga/${mangaId}`} className="ycw-btn ycw-btn-leave">
              ГАРАХ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
