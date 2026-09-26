/**
 * The note shown after a chapter's last page, as a speech bubble from the
 * account that wrote it (Chapter.yumeCommentAuthor — the site's own account in
 * practice): its avatar and name from the user record. The initial-letter
 * circle only shows when that account has no avatar, or the note predates
 * author tracking and has no author at all.
 */

const AVATAR = 64;
const AVATAR_SM = 76;

const STYLES = `
.yc {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    ".      name"
    "avatar bubble";
  column-gap: 14px;
  row-gap: 6px;
  max-width: 640px;
  margin: 0 auto 36px;
  text-align: left;
  /* The site's normal body font; the emoji fonts are named so an emoji in a
     note always renders in colour. */
  font-family: var(--font-sans), "Apple Color Emoji", "Segoe UI Emoji",
    "Noto Color Emoji", sans-serif;
  --yc-avatar-size: ${AVATAR}px;
}
@media (min-width: 640px) { .yc { --yc-avatar-size: ${AVATAR_SM}px; } }
.yc-name {
  grid-area: name;
  margin: 0 0 0 4px;
  font-size: 15px; font-weight: 600; line-height: 1.3;
  color: #fff;
  overflow-wrap: anywhere;
}
.yc-avatar {
  grid-area: avatar;
  align-self: start;
  position: relative;
  width: var(--yc-avatar-size); height: var(--yc-avatar-size);
  border-radius: 999px;
  overflow: hidden;
  background: radial-gradient(circle at 35% 30%, #e4cd93, #b69a64 70%);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.12), 0 6px 18px rgba(0, 0, 0, 0.35);
}
.yc-avatar-fallback {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: calc(var(--yc-avatar-size) * 0.4); font-weight: 600;
  color: #2a2118;
}
/* The photo sits over the initial as a background layer: a missing or broken
   image draws nothing, so the initial shows through without a broken icon. */
.yc-avatar-photo {
  position: absolute; inset: 0;
  background-position: center; background-size: cover; background-repeat: no-repeat;
}
.yc-bubble {
  grid-area: bubble;
  position: relative;
  /* At least as tall as the avatar, so the tail — centred on the avatar —
     always lands on the bubble's straight edge, never on a rounded corner. */
  min-height: var(--yc-avatar-size);
  display: flex; align-items: center; justify-content: center;
  padding: 12px 18px;
  background: #fff;
  color: #1b1a1f;
  border-radius: 18px;
  /* One shadow for bubble and tail together (a box-shadow would outline the
     bubble alone and leave a seam where the tail joins). */
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.32));
}
/* The tail: a small square turned 45°, half of it inside the bubble in the
   same fill, so it joins with no gap or seam; the rounded corner softens its
   tip. Its centre is the avatar's centre. */
.yc-bubble::before {
  content: "";
  position: absolute;
  left: -6px;
  top: calc(var(--yc-avatar-size) / 2 - 6px);
  width: 12px; height: 12px;
  background: #fff;
  border-radius: 0 0 0 3px;
  transform: rotate(45deg);
}
.yc-text {
  margin: 0;
  width: 100%;
  text-align: center;
  font-size: 15px; font-weight: 500; line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
@media (min-width: 640px) { .yc-text { font-size: 16px; } }
`;

export type YumeCommentAuthor = { name: string; avatarUrl: string | null };

function cssUrl(url: string) {
  return `url("${url.replace(/["\\\n\r]/g, "")}")`;
}

/**
 * Renders nothing when the chapter has no note — no empty bubble.
 */
export function YumeComment({
  comment,
  author,
}: {
  comment: string | null | undefined;
  author: YumeCommentAuthor | null;
}) {
  const text = comment?.trim();

  if (!text) {
    return null;
  }

  const name = author?.name ?? "ЮҮМЭ";
  const initial = name.trim().charAt(0).toUpperCase() || "Ю";

  return (
    <section className="yc" aria-label={`${name}-ийн сэтгэгдэл`}>
      <style>{STYLES}</style>
      <p className="yc-name">{name}</p>
      <div className="yc-avatar" aria-hidden="true">
        <span className="yc-avatar-fallback">{initial}</span>
        {author?.avatarUrl ? (
          <span
            className="yc-avatar-photo"
            style={{ backgroundImage: cssUrl(author.avatarUrl) }}
          />
        ) : null}
      </div>
      <div className="yc-bubble">
        <p className="yc-text">{text}</p>
      </div>
    </section>
  );
}
