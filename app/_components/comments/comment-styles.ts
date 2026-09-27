/**
 * Chapter comment styles. The end-of-chapter card and the comment sheet are
 * always dark ink with gold, like the reader they open from; the homepage
 * carousel follows the site theme through the `.yume-surface` tokens.
 */

const EMOJI_SAFE_FONT = `var(--font-sans), "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;

export const COMMENT_STYLES = `
.ycm { font-family: ${EMOJI_SAFE_FONT}; color: #f3ece4; text-align: left; }
.ycm *, .ycr * { box-sizing: border-box; }

.ycm-avatar {
  flex-shrink: 0; width: 34px; height: 34px; border-radius: 999px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #2a2118;
  background: radial-gradient(circle at 35% 30%, #e4cd93, #b69a64 70%);
}
.ycm-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ycm-avatar.is-sm { width: 22px; height: 22px; font-size: 10px; }

/* End-of-chapter card */
.ycm-card {
  max-width: 640px; margin: 0 auto 36px; padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(200, 162, 76, 0.28);
}
.ycm-card-head {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 700; color: #f4e3b2;
}
.ycm-card-head svg { color: #c8a24c; }
.ycm-list { display: grid; gap: 16px; margin-top: 14px; }
.ycm-empty { margin-top: 12px; text-align: center; font-size: 14px; color: rgba(243, 236, 228, 0.72); }

/* One comment */
.ycm-item { display: flex; gap: 10px; align-items: flex-start; }
.ycm-item.is-pending { opacity: 0.55; }
.ycm-item-main { min-width: 0; flex: 1; }
.ycm-meta { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 8px; }
.ycm-name { font-size: 13.5px; font-weight: 700; color: #fff; overflow-wrap: anywhere; }
.ycm-time { font-size: 12px; color: rgba(243, 236, 228, 0.5); }
.ycm-body {
  margin-top: 3px; font-size: 14.5px; line-height: 1.55;
  color: rgba(243, 236, 228, 0.9);
  white-space: pre-line; overflow-wrap: anywhere;
}
.ycm-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.ycm-blur { filter: blur(6px); user-select: none; pointer-events: none; }
.ycm-spoiler-row {
  margin-top: 4px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px;
  font-size: 12.5px; font-weight: 600; color: #f4e3b2;
}
.ycm-reveal {
  border-radius: 999px; padding: 4px 12px; cursor: pointer;
  font-size: 12px; font-weight: 700; font-family: inherit;
  background: rgba(200, 162, 76, 0.18); border: 1px solid rgba(200, 162, 76, 0.55); color: #f4e3b2;
}
.ycm-actions { margin-top: 6px; display: flex; align-items: center; gap: 10px; font-size: 12px; }
.ycm-link-btn {
  padding: 0; border: 0; background: none; cursor: pointer; font-family: inherit;
  font-size: 12px; font-weight: 600; color: rgba(243, 236, 228, 0.55);
}
.ycm-link-btn:hover { color: #f4e3b2; }
.ycm-link-btn.is-danger { color: #f0a3a3; }

.ycm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; border-radius: 14px; padding: 0 18px; cursor: pointer;
  font-family: inherit; font-size: 14px; font-weight: 700; text-decoration: none;
}
.ycm-btn-line { background: rgba(255, 255, 255, 0.05); color: #f4e3b2; border: 1px solid rgba(200, 162, 76, 0.4); }
.ycm-btn-line:hover { background: rgba(200, 162, 76, 0.12); }
.ycm-btn-gold { background: linear-gradient(135deg, #e4cd93, #c8a24c); color: #2a1f0e; border: 0; }
.ycm-card .ycm-btn { width: 100%; margin-top: 16px; }

/* Bottom sheet (a centred panel from 640px) */
.ycm-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(5, 4, 8, 0.62);
  animation: ycm-fade 0.2s ease;
}
.ycm-sheet {
  width: 100%; max-width: 560px; height: min(88dvh, 760px);
  display: flex; flex-direction: column;
  background: #141217;
  border: 1px solid rgba(200, 162, 76, 0.3); border-bottom: 0;
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.5);
  animation: ycm-up 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
@media (min-width: 640px) {
  .ycm-overlay { align-items: center; padding: 24px; }
  .ycm-sheet { height: min(80vh, 760px); border-radius: 22px; border-bottom: 1px solid rgba(200, 162, 76, 0.3); }
  .ycm-grip { display: none; }
  .ycm-sheet-head { padding-top: 14px; }
}
@keyframes ycm-fade { from { opacity: 0; } }
@keyframes ycm-up { from { transform: translateY(40px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ycm-overlay, .ycm-sheet { animation: none; } }

.ycm-grip { width: 40px; height: 4px; margin: 8px auto 0; border-radius: 999px; background: rgba(255, 255, 255, 0.18); }
.ycm-sheet-head {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.ycm-sheet-title { min-width: 0; flex: 1; }
.ycm-sheet-title h2 { font-size: 16px; font-weight: 700; color: #f4e3b2; }
.ycm-sheet-title p {
  margin-top: 2px; font-size: 12.5px; color: rgba(243, 236, 228, 0.55);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ycm-close {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.06); border: 0; color: #f3ece4;
}
.ycm-scroll { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 16px 18px; }
.ycm-scroll .ycm-list { margin-top: 0; gap: 20px; }
.ycm-status { padding: 18px 0; text-align: center; font-size: 13px; color: rgba(243, 236, 228, 0.55); }

.ycm-foot {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
}
.ycm-textarea {
  display: block; width: 100%; resize: none;
  min-height: 46px; max-height: 140px;
  border-radius: 14px; padding: 11px 13px;
  font-family: inherit; font-size: 16px; line-height: 1.45; color: #fff;
  background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
  outline: none;
}
.ycm-textarea:focus { border-color: rgba(200, 162, 76, 0.7); }
.ycm-textarea::placeholder { color: rgba(243, 236, 228, 0.4); }
.ycm-compose-row { margin-top: 8px; display: flex; align-items: center; gap: 8px; }
.ycm-toggle {
  display: inline-flex; align-items: center; gap: 6px; min-height: 36px;
  border-radius: 999px; padding: 0 12px; cursor: pointer; font-family: inherit;
  font-size: 12.5px; font-weight: 700;
  background: transparent; border: 1px solid rgba(255, 255, 255, 0.18); color: rgba(243, 236, 228, 0.7);
}
.ycm-toggle[aria-pressed="true"] { background: rgba(200, 162, 76, 0.18); border-color: rgba(200, 162, 76, 0.6); color: #f4e3b2; }
.ycm-counter { margin-left: auto; font-size: 12px; font-variant-numeric: tabular-nums; color: rgba(243, 236, 228, 0.45); }
.ycm-counter.is-near { color: #f0a3a3; }
.ycm-send {
  flex-shrink: 0; width: 42px; height: 42px; border-radius: 999px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #e4cd93, #c8a24c); color: #2a1f0e; border: 0;
}
.ycm-send:disabled { opacity: 0.4; cursor: not-allowed; }
.ycm-error { margin-top: 8px; font-size: 12.5px; color: #f0a3a3; }
.ycm-guest { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; font-size: 14px; color: rgba(243, 236, 228, 0.8); }
`;

export const RECENT_COMMENTS_STYLES = `
.ycr { margin-bottom: 56px; font-family: ${EMOJI_SAFE_FONT}; }
.ycr-track {
  display: flex; gap: 14px; overflow-x: auto;
  scroll-snap-type: x mandatory; scrollbar-width: none;
  padding: 4px 2px 10px; margin: 0 -2px;
}
.ycr-track::-webkit-scrollbar { display: none; }
.ycr-slide { flex: 0 0 100%; min-width: 0; scroll-snap-align: start; }
@media (min-width: 768px) { .ycr-slide { flex-basis: calc((100% - 14px) / 2); } }
@media (min-width: 1100px) { .ycr-slide { flex-basis: calc((100% - 28px) / 3); } }

.ycr-card {
  height: 100%; display: flex; gap: 12px; padding: 14px;
  border-radius: 20px; cursor: pointer; text-align: left;
  background: color-mix(in srgb, var(--home-paper) 92%, transparent);
  border: 1px solid var(--home-line);
  box-shadow: 0 16px 36px -28px var(--home-shadow-strong);
  transition: border-color 0.25s, transform 0.25s;
}
.ycr-card:hover { border-color: var(--home-line-strong); transform: translateY(-2px); }
.ycr-card:focus-visible { outline: 2px solid var(--home-rose); outline-offset: 2px; }
.ycr-cover {
  flex-shrink: 0; width: 64px; aspect-ratio: 3 / 4; align-self: flex-start;
  overflow: hidden; border-radius: 12px;
  background: var(--home-paper-2); border: 1px solid var(--home-line);
}
.ycr-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ycr-main { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 6px; }
.ycr-title {
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: 17px; line-height: 1.2; color: var(--home-plum);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.ycr-body {
  font-size: 14px; line-height: 1.55; color: var(--home-plum);
  white-space: pre-line; overflow-wrap: anywhere;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.ycr-card .is-blurred { filter: blur(7px); user-select: none; }
.ycr-spoiler {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px;
  font-size: 12.5px; font-weight: 600; color: var(--home-rose-deep);
}
.ycr-reveal {
  border-radius: 999px; padding: 4px 12px; cursor: pointer; font-family: inherit;
  font-size: 12px; font-weight: 700;
  background: var(--home-paper-2); border: 1px solid var(--home-line-strong); color: var(--home-plum);
}
.ycr-foot {
  margin-top: auto; padding-top: 4px;
  display: flex; align-items: center; gap: 8px; min-width: 0;
  font-size: 12px; color: var(--home-plum-soft);
}
.ycr-foot .ycr-name { min-width: 0; font-weight: 700; color: var(--home-plum); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ycr-foot time { margin-left: auto; flex-shrink: 0; font-variant-numeric: tabular-nums; }

.ycr-nav { margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 10px; }
.ycr-arrow {
  width: 36px; height: 36px; border-radius: 999px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--home-paper); border: 1px solid var(--home-line); color: var(--home-plum);
}
.ycr-arrow:disabled { opacity: 0.35; cursor: default; }
.ycr-dots { display: flex; align-items: center; }
.ycr-dot { width: 18px; height: 24px; padding: 0; border: 0; background: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.ycr-dot span { width: 7px; height: 7px; border-radius: 999px; background: var(--home-line-strong); transition: width 0.25s, background 0.25s; }
.ycr-dot.is-active span { width: 16px; background: var(--home-rose); }
`;
