import { Fragment, type ReactNode } from "react";

/**
 * The small markdown subset МЭДЭЭ articles are written in:
 *
 *   - a blank line starts a new paragraph; a single line break is kept
 *   - **bold**
 *   - [link text](https://…) — or a path on this site, like [энд](/manga/…)
 *   - bare https:// links become clickable
 *
 * Deliberately tiny and built from React elements, never from an HTML string:
 * there is no way for article text to inject markup or a `javascript:` link,
 * and no parser dependency to ship. The article's image is a separate field.
 */

const INLINE_PATTERN =
  /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"])/g;

function safeHref(raw: string): string | null {
  const href = raw.trim();

  if (href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function renderLink(href: string, children: ReactNode, key: string) {
  const internal = href.startsWith("/");

  return (
    <a
      key={key}
      href={href}
      className="yume-md-link"
      {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const key = `${keyPrefix}-${index++}`;
    const [whole, bold, linkText, linkHref, bareUrl] = match;

    if (bold !== undefined) {
      nodes.push(<strong key={key}>{renderInline(bold, key)}</strong>);
    } else if (linkText !== undefined && linkHref !== undefined) {
      const href = safeHref(linkHref);
      nodes.push(
        href ? renderLink(href, renderInline(linkText, key), key) : whole,
      );
    } else if (bareUrl !== undefined) {
      const href = safeHref(bareUrl);
      nodes.push(href ? renderLink(href, bareUrl, key) : whole);
    }

    lastIndex = start + whole.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function splitParagraphs(body: string) {
  return body
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function renderMarkdown(body: string): ReactNode {
  return splitParagraphs(body).map((paragraph, paragraphIndex) => {
    const lines = paragraph.split("\n");

    return (
      <p key={paragraphIndex}>
        {lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {renderInline(line, `${paragraphIndex}-${lineIndex}`)}
          </Fragment>
        ))}
      </p>
    );
  });
}

/** The article as plain text — for excerpts in the feed and the popup. */
export function markdownToPlainText(body: string): string {
  return splitParagraphs(body)
    .join(" ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptOf(body: string, maxLength = 140): string {
  const text = markdownToPlainText(body);

  if (text.length <= maxLength) {
    return text;
  }

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Styles for rendered articles; the tokens come from `.yume-surface`. */
export const MARKDOWN_STYLES = `
.yume-md p { margin: 0 0 1.05em; }
.yume-md p:last-child { margin-bottom: 0; }
.yume-md strong { font-weight: 700; color: var(--home-plum); }
.yume-md-link {
  color: var(--home-rose-deep);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--home-rose) 45%, transparent);
  text-underline-offset: 3px;
  word-break: break-word;
}
.yume-md-link:hover { color: var(--home-gold); }
`;
