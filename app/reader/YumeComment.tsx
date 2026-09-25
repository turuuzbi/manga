import { yumeComicFont } from "@/lib/fonts";

/**
 * Yume's avatar for the end-of-chapter bubble. Put the image at
 * `public/yume-avatar.jpg` (square, at least 200×200). Until it exists, a
 * gold "Ю" shows instead. The photo is a CSS background layered over that
 * initial rather than an <img>, so a missing file draws nothing — no broken
 * image icon — and needs no script to detect.
 */
export const YUME_AVATAR_SRC = "/yume-avatar.jpg";

const STYLES = `
.yc {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 12px;
  align-items: start;
  max-width: 640px;
  margin: 0 auto 36px;
  text-align: left;
}
.yc-avatar {
  position: relative;
  width: 76px; height: 76px;
  border-radius: 999px;
  overflow: hidden;
  flex-shrink: 0;
  background: radial-gradient(circle at 35% 30%, #e4cd93, #b69a64 70%);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}
@media (min-width: 640px) { .yc-avatar { width: 92px; height: 92px; } }
.yc-avatar-fallback {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; color: #2a2118;
}
.yc-avatar::after {
  content: "";
  position: absolute; inset: 0;
  background: var(--yc-avatar) center / cover no-repeat;
}
.yc-name {
  margin: 10px 0 8px 2px;
  font-size: 22px; line-height: 1;
  letter-spacing: 0.04em;
  color: #fff;
  -webkit-text-stroke: 0.6px currentColor;
}
/* The bubble: white, slightly uneven corners like a hand-inked balloon, with
   a tail on its upper left pointing back at the avatar. */
.yc-bubble {
  position: relative;
  margin-left: -6px;
  padding: 14px 18px 15px;
  background: #fff;
  color: #151417;
  border-radius: 20px 26px 22px 28px / 24px 20px 28px 22px;
  box-shadow: 0 10px 28px -12px rgba(0, 0, 0, 0.6);
}
.yc-bubble::before {
  content: "";
  position: absolute;
  left: -11px; top: 10px;
  width: 0; height: 0;
  border-style: solid;
  border-width: 7px 14px 9px 0;
  border-color: transparent #fff transparent transparent;
  transform: rotate(-14deg);
}
.yc-text {
  margin: 0;
  text-align: center;
  text-transform: uppercase;
  font-size: 17px; line-height: 1.28;
  letter-spacing: 0.01em;
  -webkit-text-stroke: 0.35px currentColor;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
@media (min-width: 640px) { .yc-text { font-size: 19px; } }
`;

/**
 * Yume's note after a chapter's last page, as a comic speech bubble. Renders
 * nothing when the chapter has no note — no empty bubble.
 */
export function YumeComment({ comment }: { comment: string | null | undefined }) {
  const text = comment?.trim();

  if (!text) {
    return null;
  }

  return (
    <section className={`yc ${yumeComicFont.className}`} aria-label="Юүмэгийн сэтгэгдэл">
      <style>{STYLES}</style>
      <div
        className="yc-avatar"
        aria-hidden="true"
        style={{ "--yc-avatar": `url("${YUME_AVATAR_SRC}")` } as React.CSSProperties}
      >
        <span className="yc-avatar-fallback">Ю</span>
      </div>
      <div>
        <p className="yc-name">ЮҮМЭ</p>
        <div className="yc-bubble">
          <p className="yc-text">{text}</p>
        </div>
      </div>
    </section>
  );
}
