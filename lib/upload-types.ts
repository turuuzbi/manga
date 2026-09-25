/**
 * Shared between the admin browser code and the upload server action. Types
 * and constants only — no server imports — so client components can use it.
 *
 * Every admin image goes browser → R2 directly (see lib/uploads.ts). The
 * browser says *what* it is uploading (a scope plus a slot per file); the
 * server alone decides *where* it goes, so a client can never write outside
 * the folder that belongs to the row it is editing.
 */

export type UploadScope =
  /** Series artwork: posters, poster library, reward, hero slide images. */
  | { kind: "manga"; mangaId: string }
  /** An existing chapter's thumbnail, badge or a replacement page. */
  | { kind: "chapter"; chapterId: string }
  /**
   * A new chapter being created (ГАРААР ОРУУЛАХ / DRIVE ИМПОРТ). The server
   * reserves the chapter id — and the manga id too when the series is new —
   * so the files land in the same folders as every other chapter's.
   */
  | { kind: "ingest"; mangaId?: string | null }
  /** An МЭДЭЭ article image. */
  | { kind: "news" };

export const UPLOAD_SLOTS = {
  manga: [
    "home",
    "detail",
    "promo",
    "poster",
    "reward",
    "reward-original",
    "featured-desktop",
    "featured-mobile",
  ],
  chapter: ["cover", "badge", "page"],
  ingest: ["manga-cover", "chapter-cover", "page"],
  news: ["image"],
} as const satisfies Record<UploadScope["kind"], readonly string[]>;

export type UploadFileRequest = {
  slot: string;
  contentType: string;
  size: number;
  name: string;
};

export type UploadTarget = {
  slot: string;
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
};

export type UploadTargetsResult =
  | {
      ok: true;
      targets: UploadTarget[];
      /** Reserved ids for an ingest scope, echoed back into the form. */
      mangaId?: string;
      chapterId?: string;
    }
  | { ok: false; message: string };

/** Image types we store, mapped to the extension used in the object key. */
export const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Per-file ceiling. Nothing here passes through Vercel any more, so this is a
 * sanity cap rather than a platform limit: artwork is compressed to ~1600px
 * before upload, but chapter pages and reward originals go up untouched.
 */
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

/** Pages per ingest request; a long webtoon chapter can run past 150. */
export const MAX_UPLOAD_FILES = 400;
