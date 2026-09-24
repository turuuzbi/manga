/**
 * Page styles for МЭДЭЭ (/news and /news/[id]). Tokens come from
 * `.yume-surface`, so every theme applies without extra rules here.
 */
export const NEWS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap');

.yume-news { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-news * { box-sizing: border-box; }

.yume-news .yn-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--home-plum-soft); text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}
.yume-news .yn-back:hover { color: var(--home-rose-deep); transform: translateX(-2px); }

.yume-news .yn-list { display: grid; gap: 14px; }

.yume-news .yn-item {
  position: relative;
  display: flex; gap: 14px; align-items: flex-start;
  padding: 16px;
  border-radius: 22px;
  text-decoration: none; color: inherit;
  background: color-mix(in srgb, var(--home-paper) 92%, transparent);
  border: 1px solid var(--home-line);
  box-shadow: 0 16px 36px -26px var(--home-shadow-strong);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s, box-shadow 0.3s;
}
.yume-news .yn-item:hover {
  transform: translateY(-3px);
  border-color: var(--home-line-strong);
  box-shadow: 0 22px 44px -26px var(--home-shadow-strong);
}
.yume-news .yn-item.is-unread {
  border-color: color-mix(in srgb, var(--home-rose) 55%, var(--home-line));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--home-blush) 70%, transparent), transparent 60%),
    color-mix(in srgb, var(--home-paper) 94%, transparent);
}
.yume-news .yn-thumb {
  flex-shrink: 0; width: 76px; aspect-ratio: 3 / 4;
  overflow: hidden; border-radius: 14px;
  border: 1px solid var(--home-line); background: var(--home-paper-2);
}
.yume-news .yn-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.yume-news .yn-thumb-icon {
  display: flex; align-items: center; justify-content: center;
  color: var(--home-gold);
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--home-rose) 22%, transparent), transparent 62%),
    var(--home-paper-2);
}
.yume-news .yn-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px;
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--home-gold);
}
.yume-news .yn-meta time { color: var(--home-plum-soft); letter-spacing: 0.12em; }
.yume-news .yn-new {
  display: inline-flex; align-items: center; gap: 5px;
  color: var(--home-rose-deep);
}
.yume-news .yn-new::before {
  content: ''; width: 7px; height: 7px; border-radius: 999px;
  background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
}
.yume-news .yn-title {
  margin-top: 6px;
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: 21px; line-height: 1.15; color: var(--home-plum);
}
.yume-news .yn-item.is-notice .yn-title { font-style: normal; font-weight: 600; font-size: 19px; }
.yume-news .yn-excerpt {
  margin-top: 6px;
  font-size: 13.5px; line-height: 1.6; color: var(--home-plum-soft);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}

.yume-news .yn-empty {
  border-radius: 24px;
  border: 1px dashed var(--home-line-strong);
  background: color-mix(in srgb, var(--home-paper) 90%, transparent);
  padding: 56px 24px; text-align: center;
  color: var(--home-plum-soft);
}

.yume-news .yn-pager { display: flex; justify-content: center; gap: 10px; margin-top: 28px; }

/* Article page */
.yume-news .yn-article {
  border-radius: 28px;
  padding: clamp(20px, 5vw, 44px);
  background: color-mix(in srgb, var(--home-paper) 94%, transparent);
  border: 1px solid var(--home-line-strong);
  box-shadow: 0 30px 60px -34px var(--home-shadow-strong), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
.yume-news .yn-article-title {
  margin-top: 12px;
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: clamp(2rem, 7vw, 3.2rem); line-height: 1.04; color: var(--home-plum);
  overflow-wrap: anywhere;
}
.yume-news .yn-byline {
  margin-top: 12px;
  font-size: 13px; color: var(--home-plum-soft);
}
.yume-news .yn-byline strong { color: var(--home-plum); font-weight: 600; }
.yume-news .yn-hero {
  margin-top: 22px; overflow: hidden; border-radius: 20px;
  border: 1px solid var(--home-line); background: var(--home-paper-2);
}
.yume-news .yn-hero img { display: block; width: 100%; height: auto; }
.yume-news .yn-body {
  margin-top: 24px;
  font-size: 16px; line-height: 1.8; color: var(--home-plum);
  overflow-wrap: anywhere;
}
`;
