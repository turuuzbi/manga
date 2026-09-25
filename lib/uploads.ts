import { generateId } from "@/lib/ids";
import { getOwnR2Key } from "@/lib/r2";
import {
  UPLOAD_CONTENT_TYPES,
  type UploadScope,
} from "@/lib/upload-types";

/**
 * Where a direct upload is stored. Mirrors the layout the server-side uploads
 * always used — `manga/<mangaId>/cover|poster|chapters/<chapterId>/…` — because
 * cleanup (removePosterOptionAction only deletes `poster/` files) and the
 * poster library's "is this the series' own art" check both key off it.
 * Every key is unique, so a replaced image never lingers in a CDN cache.
 */
export function buildUploadKey({
  scope,
  slot,
  contentType,
  fileName,
  mangaId,
  chapterId,
  pageIndex,
}: {
  scope: UploadScope["kind"];
  slot: string;
  contentType: string;
  fileName: string;
  mangaId?: string;
  chapterId?: string;
  /** Zero-based position among this request's pages. */
  pageIndex?: number;
}): string {
  const ext = UPLOAD_CONTENT_TYPES[contentType] ?? "bin";
  const stamp = `${Date.now()}-${generateId(8)}`;

  if (scope === "news") {
    return `news/${stamp}.${ext}`;
  }

  if (!mangaId) {
    throw new Error("Upload key needs a manga id.");
  }

  const mangaRoot = `manga/${mangaId}`;

  if (scope === "manga") {
    switch (slot) {
      case "home":
      case "detail":
      case "promo":
        return `${mangaRoot}/cover/${slot}-${stamp}.${ext}`;
      case "poster":
        return `${mangaRoot}/poster/${stamp}.${ext}`;
      case "reward":
        return `${mangaRoot}/reward/${stamp}.${ext}`;
      case "reward-original":
        return `${mangaRoot}/reward/${stamp}-original.${ext}`;
      // Hero slide art lives in its own folder, never shared with a poster,
      // so replacing one can safely delete the old file.
      case "featured-desktop":
      case "featured-mobile":
        return `${mangaRoot}/featured/${slot.replace("featured-", "")}-${stamp}.${ext}`;
    }
  }

  if (!chapterId) {
    throw new Error("Upload key needs a chapter id.");
  }

  const chapterRoot = `${mangaRoot}/chapters/${chapterId}`;

  switch (slot) {
    case "manga-cover":
      return `${mangaRoot}/cover/all-${stamp}.${ext}`;
    case "cover":
    case "chapter-cover":
      return `${chapterRoot}/cover/${stamp}.${ext}`;
    case "badge":
      return `${chapterRoot}/badge/${stamp}.${ext}`;
    case "page": {
      // New chapters keep the old "001-name" page naming; replacements get a
      // unique stamp so the old file can be deleted without a collision.
      if (scope === "ingest" && typeof pageIndex === "number") {
        const number = String(pageIndex + 1).padStart(3, "0");
        return `${chapterRoot}/${number}-${slugifyFileName(fileName) || "page"}-${generateId(6)}.${ext}`;
      }

      return `${chapterRoot}/${stamp}.${ext}`;
    }
  }

  throw new Error(`Unknown upload slot "${slot}".`);
}

function slugifyFileName(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Reads a URL the browser put in the form after uploading straight to R2.
 * Empty means "no new image". Anything else must be a file on our own bucket
 * under `prefix` (the folder of the row being edited) — otherwise a crafted
 * request could point a poster at an arbitrary remote image, or at another
 * series' files.
 */
export function readUploadedUrl(
  formData: FormData,
  field: string,
  prefix: string,
): string | null {
  const value = String(formData.get(field) ?? "").trim();

  if (!value) {
    return null;
  }

  const key = getOwnR2Key(value);

  if (!key || !key.startsWith(prefix)) {
    throw new Error("Зургийн хаяг буруу байна. Зургаа дахин сонгоод оролдоно уу.");
  }

  return value;
}

/** Same check for a list field (the pages of a new chapter, in order). */
export function readUploadedUrls(
  formData: FormData,
  field: string,
  prefix: string,
): string[] {
  return formData.getAll(field).map((entry) => {
    const value = String(entry).trim();
    const key = getOwnR2Key(value);

    if (!key || !key.startsWith(prefix)) {
      throw new Error(
        "Хуудасны зургийн хаяг буруу байна. Хуудсуудаа дахин сонгоод оролдоно уу.",
      );
    }

    return value;
  });
}
