"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  downloadGoogleDriveFile,
  extractGoogleDriveFolderId,
  inspectGoogleDriveFolder,
  listGoogleDriveFolders,
  listGoogleDriveImages,
} from "@/lib/google-drive";
import { deleteFromR2, getR2KeyFromUrl, uploadToR2 } from "@/lib/r2";
import { readUploadedUrl, readUploadedUrls } from "@/lib/uploads";
import {
  MAX_PAYWALLED_LATEST_CHAPTERS,
  PLANS,
  extendExpiry,
  formatTugrug,
  isValidPlan,
  resolvePlanPrice,
} from "@/lib/plans";

export type AdminActionState = {
  ok: boolean;
  message: string;
  createdMangaId?: string;
};

/**
 * Deletes genres that no longer have a single manga attached.
 *
 * Retagging a manga leaves its old genre rows behind, and because genre names
 * are matched exactly, a casing slip creates a second tag ("өөр ертөнц" beside
 * "Өөр ертөнц") that keeps showing in the filter rail with nothing behind it.
 * Run after any write that can detach a genre; the reader-facing queries also
 * filter on a non-empty count, so a stale row can never surface even between
 * a write and this cleanup.
 */
/** Longest "Юүмэгийн сэтгэгдэл" accepted; it is a speech bubble, not a post. */
const MAX_YUME_COMMENT_LENGTH = 600;

/**
 * Yume's end-of-chapter note from a form. Blank means "no note" (null), so an
 * emptied textarea removes the bubble. Line breaks are kept: the reader shows
 * them as written.
 */
function parseYumeComment(formData: FormData): string | null {
  const value = String(formData.get("yumeComment") ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();

  return value ? value.slice(0, MAX_YUME_COMMENT_LENGTH) : null;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

async function pruneOrphanGenres() {
  await prisma.genre.deleteMany({ where: { mangas: { none: {} } } });
}

/**
 * Every reader-facing page that shows a series' artwork, chapters or banner.
 * Revalidating all of them after a change is what keeps an old poster from
 * lingering in the router cache — `/manga` (the library) and `/updates` were
 * previously left out, so a replaced poster could still show there. /updates
 * and its older pages are cached for everyone (revalidate = 300), so this is
 * also what makes a new chapter appear there at once.
 */
function revalidateSeriesSurfaces(mangaId?: string | null) {
  revalidatePath("/");
  revalidatePath("/manga");
  revalidatePath("/updates");
  revalidatePath("/updates/page/[page]", "page");
  revalidatePath("/admin");

  if (mangaId) {
    revalidatePath(`/manga/${mangaId}`);
  }
}

export type AdminUsersOverview = {
  totalUsers: number;
  /** Users whose premium window has not expired. */
  entitledUsers: number;
  users: Array<{
    id: string;
    email: string;
    username: string | null;
    role: "READER" | "ADMIN";
    createdAt: string;
    premiumUntil: string | null;
  }>;
};

/** Newest-first page size for the users table. */
const USERS_TABLE_LIMIT = 200;

/**
 * Registered readers plus the two headline totals, for the admin users table.
 *
 * Fetched through a server action rather than shipped in the page payload:
 * /admin already sends a very large one, and this keeps the roster off the wire
 * for anyone who never opens the tab. Returns empty for non-admins, so there is
 * no public route exposing the roster.
 */
export async function getUsersOverviewAction(): Promise<AdminUsersOverview> {
  const adminUser = await requireAdminUser();

  if (!adminUser) {
    return { totalUsers: 0, entitledUsers: 0, users: [] };
  }

  const now = new Date();

  const [totalUsers, entitledUsers, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { premiumUntil: { gt: now } } }),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        premiumUntil: true,
      },
      orderBy: { createdAt: "desc" },
      take: USERS_TABLE_LIMIT,
    }),
  ]);

  return {
    totalUsers,
    entitledUsers,
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      premiumUntil: user.premiumUntil?.toISOString() ?? null,
    })),
  };
}

export type AdminChapterViews = {
  id: string;
  chapterNumber: number;
  title: string | null;
  viewCount: number;
};

/**
 * Per-chapter opens for one series, for the "Үзэлт шалгах" drill-down.
 *
 * Loaded on expand rather than with the page, so opening the panel does not
 * pull every chapter of every series. Admin-gated; returns nothing otherwise.
 */
export async function getChapterViewsAction(
  mangaId: string,
): Promise<AdminChapterViews[]> {
  const adminUser = await requireAdminUser();

  if (!adminUser || !mangaId) {
    return [];
  }

  const chapters = await prisma.chapter.findMany({
    where: { mangaId },
    select: { id: true, chapterNumber: true, title: true, viewCount: true },
    orderBy: { chapterNumber: "asc" },
  });

  return chapters;
}

export type AdminUserRow = {
  id: string;
  email: string;
  username: string | null;
  /** ISO string, or null when the reader has no active pass. */
  premiumUntil: string | null;
};

/** Most-recent readers shown before the admin types anything. */
const USER_SEARCH_LIMIT = 20;

/**
 * Readers matching a free-text query, for the admin's grant panel.
 *
 * Searched on demand rather than shipped with the page: /admin already sends a
 * very large payload, and this keeps working as the reader count grows. Matches
 * email or username so an admin who only knows a display name can still find
 * someone — which is the whole point when the reader signed up through an OAuth
 * provider and does not know which address it used.
 */
export async function searchUsersAction(
  query: string,
): Promise<AdminUserRow[]> {
  const adminUser = await requireAdminUser();

  if (!adminUser) {
    return [];
  }

  const term = query.trim();

  const users = await prisma.user.findMany({
    where: term
      ? {
          OR: [
            { email: { contains: term, mode: "insensitive" } },
            { username: { contains: term, mode: "insensitive" } },
          ],
        }
      : {},
    select: { id: true, email: true, username: true, premiumUntil: true },
    orderBy: { createdAt: "desc" },
    take: USER_SEARCH_LIMIT,
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    premiumUntil: user.premiumUntil?.toISOString() ?? null,
  }));
}

/**
 * Manually grant a subscription period to a user. Used to test the premium gate
 * end-to-end before QPay is wired, and to comp users. Records a PAID Payment
 * (manual) + a Subscription and extends the user's premiumUntil.
 */
export async function grantSubscriptionAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return { ok: false, message: "Admin access is required." };
    }

    // The search panel posts a userId; the typed form still posts an email.
    // Accepting either means a reader whose address the admin does not know —
    // an OAuth sign-up, say — can still be found and granted.
    const userId = String(formData.get("userId") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const planValue = String(formData.get("plan") ?? "").trim();

    if (!userId && !email) {
      return { ok: false, message: "Хэрэглэгчийн и-мэйл оруулна уу." };
    }

    if (!isValidPlan(planValue)) {
      return { ok: false, message: "Багц буруй байна." };
    }

    const target = await prisma.user.findUnique({
      where: userId ? { id: userId } : { email },
      select: { id: true, email: true, premiumUntil: true },
    });

    if (!target) {
      return { ok: false, message: `"${email || userId}" хэрэглэгч олдсонгүй.` };
    }

    const plan = PLANS[planValue];
    const now = new Date();
    const expiresAt = extendExpiry(target.premiumUntil, planValue, now);
    // Priced off the *target reader's* standing, not the admin's, and off the
    // same `now` as the expiry above so the two cannot disagree. A reader
    // renewing early transferred the discounted amount shown on /subscribe, so
    // that is what the Payment row must record.
    const { price, discounted } = resolvePlanPrice(planValue, target, now);

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: target.id,
          plan: planValue,
          amount: price,
          status: "PAID",
          paidAt: now,
        },
        select: { id: true },
      });

      await tx.subscription.create({
        data: {
          userId: target.id,
          plan: planValue,
          startedAt: now,
          expiresAt,
          paymentId: payment.id,
        },
      });

      await tx.user.update({
        where: { id: target.id },
        data: { premiumUntil: expiresAt },
      });
    });

    return {
      ok: true,
      message: `${target.email} — ${plan.label} (${formatTugrug(price)}${
        discounted ? ", эрт сунгасан 10% хөнгөлөлттэй" : ""
      }) багц ${expiresAt.toLocaleDateString()} хүртэл идэвхжлээ.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Багц олгоход алдаа гарлаа.",
    };
  }
}

const allowedStatuses = new Set([
  "ONGOING",
  "COMPLETED",
  "CATCHING_UP",
  "STOPPED",
]);

type MangaStatusValue =
  | "ONGOING"
  | "COMPLETED"
  | "CATCHING_UP"
  | "STOPPED";

type IngestionInput = {
  mangaName: string;
  description: string;
  author: string;
  artist: string;
  genreInput: string;
  chapterTitle: string;
  chapterNumberValue: number;
  rawStatus: string;
};

type UploadAsset = {
  name: string;
  contentType: string;
  buffer: Buffer;
  width?: number | null;
  height?: number | null;
};

type DriveImportMode =
  | "new_manga_from_chapter"
  | "existing_manga_chapter"
  | "bulk_parent_folder";

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseGenres(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function parseIngestionInput(formData: FormData): IngestionInput {
  return {
    mangaName: String(formData.get("mangaName") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim(),
    artist: String(formData.get("artist") ?? "").trim(),
    genreInput: String(formData.get("genres") ?? ""),
    chapterTitle: String(formData.get("chapterTitle") ?? "").trim(),
    chapterNumberValue: Number(formData.get("chapterNumber")),
    rawStatus: String(formData.get("status") ?? "ONGOING").toUpperCase(),
  };
}

function parseMangaMetadataInput(formData: FormData) {
  return {
    mangaId: String(formData.get("mangaId") ?? "").trim(),
    mangaName: String(formData.get("mangaName") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim(),
    artist: String(formData.get("artist") ?? "").trim(),
    genreInput: String(formData.get("genres") ?? ""),
    rawStatus: String(formData.get("status") ?? "ONGOING").toUpperCase(),
    titleFont: String(formData.get("titleFont") ?? "").trim(),
    isFeatured: formData.get("isFeatured") === "on",
    featuredOrder: parseFeaturedOrder(formData.get("featuredOrder")),
    promoSlot: parsePromoSlot(formData.get("promoSlot")),
    swapPromoSlot: formData.get("swapPromoSlot") === "on",
    removePromoImage: formData.get("removePromoImage") === "on",
    removeRewardBackground: formData.get("removeRewardBackground") === "on",
    removeFeaturedDesktop: formData.get("removeFeaturedDesktop") === "on",
    removeFeaturedMobile: formData.get("removeFeaturedMobile") === "on",
    paywalledChapters: parsePaywalledChapters(
      formData.get("paywalledChapters"),
    ),
  };
}

/** Homepage ad slots, top to bottom. See HomeLanding for where each sits. */
const PROMO_SLOTS = [1, 2, 3, 4] as const;

/** A homepage ad slot 1–4, or null for "keep the banner but don't show it". */
function parsePromoSlot(value: FormDataEntryValue | null): number | null {
  const parsed = Number(String(value ?? "").trim());

  return (PROMO_SLOTS as readonly number[]).includes(parsed) ? parsed : null;
}

/**
 * How many newest chapters this manga locks. Blank means "use the site
 * default"; 0 is a real value meaning nothing is locked.
 */
function parsePaywalledChapters(
  value: FormDataEntryValue | null,
): number | null {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return Math.min(parsed, MAX_PAYWALLED_LATEST_CHAPTERS);
}

/** Hero position: a positive integer, or null for "unordered / end of list". */
function parseFeaturedOrder(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseDriveImportMode(formData: FormData): DriveImportMode {
  const mode = String(formData.get("driveImportMode") ?? "new_manga_from_chapter");

  if (
    mode === "existing_manga_chapter" ||
    mode === "bulk_parent_folder" ||
    mode === "new_manga_from_chapter"
  ) {
    return mode;
  }

  return "new_manga_from_chapter";
}

function parseChapterNumberFromFolderName(name: string) {
  const match = name.trim().match(/(\d+(\.\d+)?)/);

  return match ? Number(match[1]) : NaN;
}

function deriveChapterTitleFromFolderName(name: string) {
  const trimmed = name.trim();
  const withoutLeadingNumber = trimmed.replace(/^\d+(\.\d+)?[\s._-]*/, "").trim();

  return withoutLeadingNumber.length > 0 ? withoutLeadingNumber : null;
}

function validateIngestionInput(
  input: IngestionInput,
  pageCount: number,
): AdminActionState | null {
  if (!input.mangaName) {
    return { ok: false, message: "Series title is required." };
  }

  if (!Number.isFinite(input.chapterNumberValue) || input.chapterNumberValue <= 0) {
    return { ok: false, message: "Chapter number must be greater than 0." };
  }

  if (!allowedStatuses.has(input.rawStatus)) {
    return { ok: false, message: "Choose a valid manga status." };
  }

  if (pageCount === 0) {
    return {
      ok: false,
      message: "Add at least one manga page so the chapter can be created.",
    };
  }

  return null;
}

function validateChapterAppendInput(
  chapterNumber: number,
  pageCount: number,
): AdminActionState | null {
  if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) {
    return { ok: false, message: "Chapter number must be greater than 0." };
  }

  if (pageCount === 0) {
    return {
      ok: false,
      message: "Add at least one manga page so the chapter can be created.",
    };
  }

  return null;
}

async function createMangaRecord(input: IngestionInput, id?: string | null) {
  const genres = parseGenres(input.genreInput);

  return prisma.manga.create({
    data: {
      // Reserved when the browser uploaded this series' files first, so the
      // row matches the `manga/<id>/` folder they already sit in.
      ...(id ? { id } : {}),
      mangaName: input.mangaName,
      description: input.description || null,
      author: input.author || null,
      artist: input.artist || null,
      status: input.rawStatus as MangaStatusValue,
      genres:
        genres.length > 0
          ? {
              create: genres.map((name) => ({
                genre: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
            }
          : undefined,
    },
  });
}

async function attachCoverToManga({
  mangaId,
  mangaName,
  coverAsset,
  target = "all",
}: {
  mangaId: string;
  mangaName: string;
  coverAsset?: UploadAsset | null;
  target?: "all" | "home" | "detail" | "promo";
}) {
  if (!coverAsset) {
    return null;
  }

  const url = await uploadMangaCoverAsset({
    mangaId,
    mangaName,
    coverAsset,
    target,
  });

  const data =
    target === "home"
      ? { coverImage: url, homeCoverImage: url }
      : target === "detail"
        ? { detailCoverImage: url }
        : { coverImage: url, homeCoverImage: url, detailCoverImage: url };

  await prisma.manga.update({
    where: { id: mangaId },
    data,
  });

  return url;
}

async function uploadMangaCoverAsset({
  mangaId,
  mangaName,
  coverAsset,
  target,
}: {
  mangaId: string;
  mangaName: string;
  coverAsset: UploadAsset;
  target: "all" | "home" | "detail" | "promo";
}) {
  const coverKey = `manga/${mangaId}/cover/${target}-${Date.now()}-${slugifySegment(coverAsset.name || mangaName) || "cover"}`;
  const { url } = await uploadToR2(
    coverAsset.buffer,
    coverKey,
    coverAsset.contentType || "application/octet-stream",
  );

  return url;
}

async function createChapterWithPages({
  mangaId,
  mangaName,
  chapterNumber,
  chapterTitle,
  pageAssets = [],
  pageUrls,
  chapterId,
  coverImage,
  yumeComment,
}: {
  mangaId: string;
  mangaName: string;
  chapterNumber: number;
  chapterTitle?: string | null;
  /** Page bytes to upload from here (the Google Drive import). */
  pageAssets?: UploadAsset[];
  /** Pages the browser already uploaded to R2, in reading order. */
  pageUrls?: string[];
  /** Reserved id matching the folder the browser uploaded into. */
  chapterId?: string | null;
  /** Chapter cover ("Бүлгийн thumbnail"), already uploaded. */
  coverImage?: string | null;
  /** Yume's end-of-chapter note, or null for none. */
  yumeComment?: string | null;
}) {
  const chapter = await prisma.chapter.create({
    data: {
      ...(chapterId ? { id: chapterId } : {}),
      mangaId,
      chapterNumber,
      title: chapterTitle || null,
      coverImage: coverImage || null,
      yumeComment: yumeComment || null,
    },
  });

  if (pageUrls) {
    await prisma.page.createMany({
      data: pageUrls.map((imageUrl, index) => ({
        chapterId: chapter.id,
        pageNumber: index + 1,
        imageUrl,
      })),
    });

    return {
      mangaId,
      mangaName,
      chapterId: chapter.id,
      pageCount: pageUrls.length,
    };
  }

  const pagesToCreate = [];

  for (const [index, pageAsset] of pageAssets.entries()) {
    const pageNumber = index + 1;
    const pageKey = `manga/${mangaId}/chapters/${chapter.id}/${String(pageNumber).padStart(3, "0")}-${slugifySegment(pageAsset.name) || `page-${pageNumber}`}`;
    const { url } = await uploadToR2(
      pageAsset.buffer,
      pageKey,
      pageAsset.contentType || "application/octet-stream",
    );

    pagesToCreate.push({
      chapterId: chapter.id,
      pageNumber,
      imageUrl: url,
      width: pageAsset.width ?? null,
      height: pageAsset.height ?? null,
    });
  }

  await prisma.page.createMany({
    data: pagesToCreate,
  });

  revalidatePath("/admin");

  return {
    mangaId,
    mangaName,
    chapterId: chapter.id,
    pageCount: pagesToCreate.length,
  };
}

async function createMangaIngestion({
  input,
  coverAsset,
  pageAssets,
  mangaId,
  chapterId,
  chapterCoverImage,
  yumeComment,
}: {
  input: IngestionInput;
  coverAsset?: UploadAsset | null;
  pageAssets: UploadAsset[];
  mangaId?: string | null;
  chapterId?: string | null;
  chapterCoverImage?: string | null;
  yumeComment?: string | null;
}) {
  const manga = await createMangaRecord(input, mangaId);

  await attachCoverToManga({
    mangaId: manga.id,
    mangaName: input.mangaName,
    coverAsset,
  });

  return createChapterWithPages({
    mangaId: manga.id,
    mangaName: input.mangaName,
    chapterNumber: input.chapterNumberValue,
    chapterTitle: input.chapterTitle || null,
    pageAssets,
    chapterId,
    coverImage: chapterCoverImage,
    yumeComment,
  });
}

async function appendChapterToManga({
  mangaId,
  chapterNumber,
  chapterTitle,
  pageAssets,
  setCoverFromFirstPage,
  chapterId,
  chapterCoverImage,
  yumeComment,
}: {
  mangaId: string;
  chapterNumber: number;
  chapterTitle?: string | null;
  pageAssets: UploadAsset[];
  setCoverFromFirstPage?: boolean;
  chapterId?: string | null;
  chapterCoverImage?: string | null;
  yumeComment?: string | null;
}) {
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    select: {
      id: true,
      mangaName: true,
      coverImage: true,
    },
  });

  if (!manga) {
    throw new Error("Selected manga could not be found.");
  }

  const existingChapter = await prisma.chapter.findUnique({
    where: {
      mangaId_chapterNumber: {
        mangaId,
        chapterNumber,
      },
    },
    select: { id: true },
  });

  if (existingChapter) {
    throw new Error(`Chapter ${chapterNumber} already exists for this manga.`);
  }

  if (setCoverFromFirstPage && !manga.coverImage && pageAssets[0]) {
    await attachCoverToManga({
      mangaId: manga.id,
      mangaName: manga.mangaName,
      coverAsset: pageAssets[0],
    });
  }

  return createChapterWithPages({
    mangaId: manga.id,
    mangaName: manga.mangaName,
    chapterNumber,
    chapterTitle,
    pageAssets,
    chapterId,
    coverImage: chapterCoverImage,
    yumeComment,
  });
}

/**
 * The ids the browser reserved when it uploaded a new chapter's files, plus
 * those files' URLs — each checked to sit under the reserved folders.
 */
function readIngestUploads(
  formData: FormData,
  { existingMangaId }: { existingMangaId?: string | null } = {},
) {
  const reservedMangaId = String(formData.get("reservedMangaId") ?? "").trim();
  const reservedChapterId = String(formData.get("reservedChapterId") ?? "").trim();
  const mangaId = existingMangaId || reservedMangaId || null;
  const chapterId = reservedChapterId || null;

  if (!mangaId || !chapterId) {
    return {
      mangaId: existingMangaId ? null : reservedMangaId || null,
      chapterId: null,
      mangaCoverUrl: null,
      chapterCoverUrl: null,
      pageUrls: [] as string[],
    };
  }

  const mangaRoot = `manga/${mangaId}/`;
  const chapterRoot = `${mangaRoot}chapters/${chapterId}/`;

  return {
    mangaId: existingMangaId ? null : reservedMangaId || null,
    chapterId,
    mangaCoverUrl: readUploadedUrl(formData, "coverImageUrl", `${mangaRoot}cover/`),
    chapterCoverUrl: readUploadedUrl(formData, "chapterCoverUrl", `${chapterRoot}cover/`),
    pageUrls: readUploadedUrls(formData, "pageUrls", chapterRoot),
  };
}

async function buildDrivePageAssets(folderId: string) {
  const driveImages = await listGoogleDriveImages(folderId);

  const pageAssets: UploadAsset[] = [];

  for (const image of driveImages) {
    const buffer = await downloadGoogleDriveFile(image.id);

    pageAssets.push({
      name: image.name,
      contentType: image.mimeType,
      buffer,
      width: image.width,
      height: image.height,
    });
  }

  return { driveImages, pageAssets };
}

function formatDriveFolderDebugMessage(summary: {
  folderName: string;
  childCount: number;
  folderCount: number;
  imageCount: number;
  sampleItems: Array<{
    name: string;
    mimeType: string;
  }>;
}) {
  const sampleItems =
    summary.sampleItems.length > 0
      ? summary.sampleItems
          .map((item) => `${item.name} (${item.mimeType})`)
          .join(", ")
      : "none";

  if (summary.folderCount === 0 && summary.imageCount > 0) {
    return `Google Drive can read "${summary.folderName}", but it contains direct image files instead of chapter folders. Use the single-chapter import mode for this folder. Visible items: ${sampleItems}.`;
  }

  if (summary.childCount === 0) {
    return `Google Drive can open "${summary.folderName}", but the service account cannot see any child items inside it. Re-share the copied parent folder with the service account email and make sure the chapter folders are not private-only shortcuts.`;
  }

  return `Google Drive can read "${summary.folderName}", but none of the visible child items resolved to chapter folders. Visible items: ${sampleItems}.`;
}

/**
 * The subset of `urls` that nothing else in the series still points at. A
 * chapter's pages and thumbnail can also sit in the poster library (the
 * "Постер нэмэх" picker adds them), be the default poster, or be a series
 * cover; deleting those files along with the chapter or page left a broken
 * poster for every reader who had picked it. Earned reward images are kept
 * for the same reason.
 */
async function urlsSafeToDelete(mangaId: string, urls: string[]) {
  const candidates = [...new Set(urls.filter(Boolean))];

  if (candidates.length === 0) {
    return [];
  }

  const [manga, heldRewards] = await Promise.all([
    prisma.manga.findUnique({
      where: { id: mangaId },
      select: {
        posterOptions: true,
        defaultPoster: true,
        coverImage: true,
        homeCoverImage: true,
        detailCoverImage: true,
        promoImageUrl: true,
        featuredImageDesktop: true,
        featuredImageMobile: true,
        rewardBackgroundUrl: true,
        rewardBackgroundOriginalUrl: true,
      },
    }),
    prisma.userReward.findMany({
      where: {
        OR: [{ imageUrl: { in: candidates } }, { originalUrl: { in: candidates } }],
      },
      select: { imageUrl: true, originalUrl: true },
    }),
  ]);

  const stillUsed = new Set<string>([
    ...(manga?.posterOptions ?? []),
    ...[
      manga?.defaultPoster,
      manga?.coverImage,
      manga?.homeCoverImage,
      manga?.detailCoverImage,
      manga?.promoImageUrl,
      manga?.featuredImageDesktop,
      manga?.featuredImageMobile,
      manga?.rewardBackgroundUrl,
      manga?.rewardBackgroundOriginalUrl,
    ].filter((url): url is string => Boolean(url)),
    ...heldRewards.flatMap((reward) => [reward.imageUrl, reward.originalUrl]),
  ]);

  return candidates.filter((url) => !stillUsed.has(url));
}

async function deleteR2AssetsFromUrls(urls: string[]) {
  const keys = urls
    .map((url) => getR2KeyFromUrl(url))
    .filter((key): key is string => Boolean(key));

  for (const key of keys) {
    await deleteFromR2(key);
  }
}

export async function ingestMangaAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for manual uploads.",
      };
    }

    const input = parseIngestionInput(formData);
    // The browser uploaded the pages straight to R2 (already in reading
    // order) under ids it reserved; only their URLs arrive here.
    const uploads = readIngestUploads(formData);
    const validationError = validateIngestionInput(
      input,
      uploads.pageUrls.length,
    );

    if (validationError) {
      return validationError;
    }

    if (!uploads.mangaId || !uploads.chapterId) {
      return {
        ok: false,
        message: "Хуудсууд хадгалагдаагүй байна. Дахин оролдоно уу.",
      };
    }

    const manga = await createMangaRecord(input, uploads.mangaId);

    if (uploads.mangaCoverUrl) {
      await prisma.manga.update({
        where: { id: manga.id },
        data: {
          coverImage: uploads.mangaCoverUrl,
          homeCoverImage: uploads.mangaCoverUrl,
          detailCoverImage: uploads.mangaCoverUrl,
        },
      });
    }

    const result = await createChapterWithPages({
      mangaId: manga.id,
      mangaName: manga.mangaName,
      chapterNumber: input.chapterNumberValue,
      chapterTitle: input.chapterTitle || null,
      pageUrls: uploads.pageUrls,
      chapterId: uploads.chapterId,
      coverImage: uploads.chapterCoverUrl,
      yumeComment: parseYumeComment(formData),
    });

    revalidateSeriesSurfaces(manga.id);

    return {
      ok: true,
      message: `${result.pageCount} хуудастай "${input.mangaName}" манга үүсгэлээ.`,
      createdMangaId: result.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Upload failed before the manga could be fully ingested.",
    };
  }
}

export async function importGoogleDriveFolderAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for Google Drive imports.",
      };
    }

    const input = parseIngestionInput(formData);
    const driveImportMode = parseDriveImportMode(formData);
    const folderValue = String(formData.get("driveFolder") ?? "");
    const folderId = extractGoogleDriveFolderId(folderValue);
    const existingMangaId = String(formData.get("existingMangaId") ?? "").trim();
    const useFirstPageAsCover =
      String(formData.get("useFirstPageAsCover") ?? "") === "on";

    if (!folderId) {
      return {
        ok: false,
        message: "Paste a Google Drive folder URL or folder ID.",
      };
    }

    if (driveImportMode === "bulk_parent_folder") {
      if (!input.mangaName) {
        return { ok: false, message: "Series title is required." };
      }

      if (!allowedStatuses.has(input.rawStatus)) {
        return { ok: false, message: "Choose a valid manga status." };
      }

      const chapterFolders = await listGoogleDriveFolders(folderId);

      if (chapterFolders.length === 0) {
        const summary = await inspectGoogleDriveFolder(folderId);

        return {
          ok: false,
          message: formatDriveFolderDebugMessage(summary),
        };
      }

      const manga = await createMangaRecord(input);
      let importedChapters = 0;
      let importedPages = 0;

      for (const [folderIndex, chapterFolder] of chapterFolders.entries()) {
        const chapterNumber = parseChapterNumberFromFolderName(chapterFolder.name);

        if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) {
          throw new Error(
            `Could not read a chapter number from folder "${chapterFolder.name}".`,
          );
        }

        const { driveImages, pageAssets } = await buildDrivePageAssets(
          chapterFolder.id,
        );

        if (driveImages.length === 0) {
          continue;
        }

        if (folderIndex === 0 && useFirstPageAsCover && pageAssets[0]) {
          await attachCoverToManga({
            mangaId: manga.id,
            mangaName: manga.mangaName,
            coverAsset: pageAssets[0],
          });
        }

        await createChapterWithPages({
          mangaId: manga.id,
          mangaName: manga.mangaName,
          chapterNumber,
          chapterTitle: deriveChapterTitleFromFolderName(chapterFolder.name),
          pageAssets,
        });

        importedChapters += 1;
        importedPages += pageAssets.length;
      }

      if (importedChapters === 0) {
        await prisma.manga.delete({
          where: {
            id: manga.id,
          },
        });

        return {
          ok: false,
          message:
            "Google Drive found chapter folders, but none of them contained readable images for import.",
        };
      }

      revalidateSeriesSurfaces(manga.id);

      return {
        ok: true,
        message: `Imported ${importedChapters} chapters and ${importedPages} pages into "${manga.mangaName}".`,
        createdMangaId: manga.id,
      };
    }

    // Single-chapter modes can carry a chapter cover the browser uploaded
    // under reserved ids. The pages themselves still come from Drive here.
    const uploads = readIngestUploads(formData, {
      existingMangaId:
        driveImportMode === "existing_manga_chapter" ? existingMangaId : null,
    });

    const { driveImages, pageAssets } = await buildDrivePageAssets(folderId);

    if (driveImportMode === "existing_manga_chapter") {
      const appendValidationError = validateChapterAppendInput(
        input.chapterNumberValue,
        driveImages.length,
      );

      if (appendValidationError) {
        return appendValidationError;
      }

      if (!existingMangaId) {
        return {
          ok: false,
          message: "Choose an existing manga before importing a new chapter.",
        };
      }

      const result = await appendChapterToManga({
        mangaId: existingMangaId,
        chapterNumber: input.chapterNumberValue,
        chapterTitle: input.chapterTitle || null,
        pageAssets,
        setCoverFromFirstPage: useFirstPageAsCover,
        chapterId: uploads.chapterId,
        chapterCoverImage: uploads.chapterCoverUrl,
        yumeComment: parseYumeComment(formData),
      });

      revalidateSeriesSurfaces(existingMangaId);

      return {
        ok: true,
        message: `Imported chapter ${input.chapterNumberValue} with ${result.pageCount} pages into the existing manga.`,
        createdMangaId: existingMangaId,
      };
    }

    const validationError = validateIngestionInput(input, driveImages.length);

    if (validationError) {
      return validationError;
    }

    const coverAsset = useFirstPageAsCover ? pageAssets[0] : null;
    const result = await createMangaIngestion({
      input,
      coverAsset,
      pageAssets,
      mangaId: uploads.mangaId,
      chapterId: uploads.chapterId,
      chapterCoverImage: uploads.chapterCoverUrl,
        yumeComment: parseYumeComment(formData),
    });

    revalidateSeriesSurfaces(result.mangaId);

    return {
      ok: true,
      message: `Imported ${result.pageCount} Google Drive images into R2 and created "${input.mangaName}" in Neon.`,
      createdMangaId: result.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Google Drive import failed.",
    };
  }
}

export async function updateMangaMetadataAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for manga updates.",
      };
    }

    const input = parseMangaMetadataInput(formData);

    if (!input.mangaId) {
      return {
        ok: false,
        message: "Choose a manga to update.",
      };
    }

    if (!input.mangaName) {
      return {
        ok: false,
        message: "Series title is required.",
      };
    }

    if (!allowedStatuses.has(input.rawStatus)) {
      return {
        ok: false,
        message: "Choose a valid manga status.",
      };
    }

    const manga = await prisma.manga.findUnique({
      where: {
        id: input.mangaId,
      },
      select: {
        id: true,
        mangaName: true,
        coverImage: true,
        homeCoverImage: true,
        detailCoverImage: true,
        posterOptions: true,
        promoImageUrl: true,
        promoSlot: true,
        rewardBackgroundUrl: true,
        rewardBackgroundOriginalUrl: true,
        featuredImageDesktop: true,
        featuredImageMobile: true,
      },
    });

    if (!manga) {
      return {
        ok: false,
        message: "That manga could not be found.",
      };
    }

    const genres = parseGenres(input.genreInput);
    // Images arrive as URLs: the browser compressed and uploaded them straight
    // to R2 (see app/admin/direct-upload). Each must sit in this series' folder.
    const coverRoot = `manga/${manga.id}/cover/`;
    const homeCoverUrl = readUploadedUrl(formData, "homeCoverUrl", coverRoot);
    const detailCoverUrl = readUploadedUrl(formData, "detailCoverUrl", coverRoot);
    const uploadedPromoUrl = readUploadedUrl(formData, "promoImageUrl", coverRoot);
    const rewardRoot = `manga/${manga.id}/reward/`;
    const uploadedRewardUrl = readUploadedUrl(
      formData,
      "rewardBackgroundUrl",
      rewardRoot,
    );
    const uploadedRewardOriginalUrl = readUploadedUrl(
      formData,
      "rewardBackgroundOriginalUrl",
      rewardRoot,
    );
    const posterData: {
      coverImage?: string;
      homeCoverImage?: string;
      detailCoverImage?: string;
      defaultPoster?: null;
    } = {};

    if (homeCoverUrl) {
      posterData.coverImage = homeCoverUrl;
      posterData.homeCoverImage = homeCoverUrl;
    }

    if (detailCoverUrl) {
      posterData.detailCoverImage = detailCoverUrl;
    }

    // Uploading a poster here clears the poster-library default.
    //
    // `defaultPoster` is checked before homeCoverImage/detailCoverImage on every
    // surface that renders a cover, so while it is set these two upload fields
    // save correctly but change nothing the reader sees. That precedence exists
    // so an owner's deliberate pick beats a cover auto-guessed at import — but a
    // poster uploaded through this form is just as deliberate and more recent,
    // so it wins. Ingestion (attachCoverToManga) still defers to the pick.
    if (posterData.homeCoverImage || posterData.detailCoverImage) {
      posterData.defaultPoster = null;
    }

    // Promo banner. Uploading replaces, ticking the box clears; leaving both
    // alone keeps whatever is stored, so an unrelated metadata edit cannot drop
    // the banner by omission.
    let promoImageUrl: string | null | undefined;

    if (uploadedPromoUrl) {
      promoImageUrl = uploadedPromoUrl;
    } else if (input.removePromoImage) {
      promoImageUrl = null;
    }

    // Homepage slot. A banner without an image has nothing to show, so it
    // gives up its slot. A slot held by another series is only taken when the
    // admin ticked "swap" — then that series moves to this one's old slot.
    const nextPromoImage =
      promoImageUrl !== undefined ? promoImageUrl : manga.promoImageUrl;
    const nextPromoSlot = nextPromoImage ? input.promoSlot : null;
    const slotHolder =
      nextPromoSlot !== null && nextPromoSlot !== manga.promoSlot
        ? await prisma.manga.findFirst({
            where: { promoSlot: nextPromoSlot, NOT: { id: manga.id } },
            select: { id: true, mangaName: true },
          })
        : null;

    if (slotHolder && !input.swapPromoSlot) {
      return {
        ok: false,
        message: `${nextPromoSlot}-р байрлалд "${slotHolder.mangaName}" баннер байна. Сольж тавих бол «Байрлалыг солих»-ыг чагтлаад дахин хадгална уу.`,
      };
    }

    // Completion reward. A new upload replaces it (the original is kept for
    // readers' "download original"); the box clears it. Readers who already
    // earned the old image keep it — their copy lives on UserReward.
    let rewardData: {
      rewardBackgroundUrl?: string | null;
      rewardBackgroundOriginalUrl?: string | null;
    } = {};

    if (uploadedRewardUrl) {
      rewardData = {
        rewardBackgroundUrl: uploadedRewardUrl,
        rewardBackgroundOriginalUrl: uploadedRewardOriginalUrl ?? uploadedRewardUrl,
      };
    } else if (input.removeRewardBackground) {
      rewardData = { rewardBackgroundUrl: null, rewardBackgroundOriginalUrl: null };
    }

    // Hero slide art, one image per device. Its own fields and its own
    // folder: nothing here reads or writes a poster field, so the detail
    // page's poster can never change because the slider's crop did.
    const featuredRoot = `manga/${manga.id}/featured/`;
    const uploadedFeaturedDesktop = readUploadedUrl(
      formData,
      "featuredImageDesktop",
      featuredRoot,
    );
    const uploadedFeaturedMobile = readUploadedUrl(
      formData,
      "featuredImageMobile",
      featuredRoot,
    );
    const featuredData: {
      featuredImageDesktop?: string | null;
      featuredImageMobile?: string | null;
    } = {};

    if (uploadedFeaturedDesktop) {
      featuredData.featuredImageDesktop = uploadedFeaturedDesktop;
    } else if (input.removeFeaturedDesktop) {
      featuredData.featuredImageDesktop = null;
    }

    if (uploadedFeaturedMobile) {
      featuredData.featuredImageMobile = uploadedFeaturedMobile;
    } else if (input.removeFeaturedMobile) {
      featuredData.featuredImageMobile = null;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Free the slot first: the unique index would reject two holders even
        // for the instant between the two updates.
        if (slotHolder) {
          await tx.manga.update({
            where: { id: slotHolder.id },
            data: { promoSlot: null },
          });
        }

        await tx.manga.update({
          where: {
            id: input.mangaId,
          },
          data: {
            mangaName: input.mangaName,
            description: input.description || null,
            author: input.author || null,
            artist: input.artist || null,
            status: input.rawStatus as MangaStatusValue,
            titleFont: input.titleFont || null,
            isFeatured: input.isFeatured,
            featuredOrder: input.isFeatured ? input.featuredOrder : null,
            paywalledChapters: input.paywalledChapters,
            promoSlot: nextPromoSlot,
            ...(promoImageUrl !== undefined ? { promoImageUrl } : {}),
            ...rewardData,
            ...featuredData,
            ...posterData,
            genres: {
              deleteMany: {},
              create:
                genres.length > 0
                  ? genres.map((name) => ({
                      genre: {
                        connectOrCreate: {
                          where: { name },
                          create: { name },
                        },
                      },
                    }))
                  : undefined,
            },
          },
        });

        if (slotHolder) {
          await tx.manga.update({
            where: { id: slotHolder.id },
            data: { promoSlot: manga.promoSlot },
          });
        }
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return {
          ok: false,
          message:
            "Энэ байрлалыг өөр хүн яг одоо эзэлчихлээ. Хуудсаа сэргээгээд дахин оролдоно уу.",
        };
      }

      throw error;
    }

    // Retagging just detached this manga's old genres; drop any left empty.
    await pruneOrphanGenres();

    const currentPosterUrls = new Set([
      posterData.coverImage ?? manga.coverImage,
      posterData.homeCoverImage ?? manga.homeCoverImage,
      posterData.detailCoverImage ?? manga.detailCoverImage,
    ]);
    // A replaced cover can still be listed in the poster library — options are
    // sometimes added straight from the cover fields — and deleting the file
    // out from under the library would leave a broken tile in the reader's
    // poster chooser. Keep anything posterOptions still points at.
    const stillReferenced = new Set(manga.posterOptions);
    const replacedPosterUrls = [
      manga.coverImage,
      manga.homeCoverImage,
      manga.detailCoverImage,
      // A replaced or removed banner is referenced by nothing else.
      ...(promoImageUrl !== undefined ? [manga.promoImageUrl] : []),
    ]
      .filter((url): url is string => Boolean(url))
      .filter(
        (url) =>
          !currentPosterUrls.has(url) &&
          !stillReferenced.has(url) &&
          url !== nextPromoImage,
      );

    // Replaced or removed hero art: only these two fields ever point into
    // the featured/ folder, so the old file is safe to delete.
    for (const [field, oldUrl] of [
      ["featuredImageDesktop", manga.featuredImageDesktop],
      ["featuredImageMobile", manga.featuredImageMobile],
    ] as const) {
      if (
        oldUrl &&
        featuredData[field] !== undefined &&
        featuredData[field] !== oldUrl &&
        getR2KeyFromUrl(oldUrl)?.startsWith(featuredRoot)
      ) {
        replacedPosterUrls.push(oldUrl);
      }
    }

    // Reward images stay while any reader holds a copy of them.
    if (rewardData.rewardBackgroundUrl !== undefined) {
      const oldRewardUrls = [
        manga.rewardBackgroundUrl,
        manga.rewardBackgroundOriginalUrl,
      ].filter(
        (url): url is string =>
          Boolean(url) &&
          url !== rewardData.rewardBackgroundUrl &&
          url !== rewardData.rewardBackgroundOriginalUrl,
      );

      if (oldRewardUrls.length > 0) {
        const heldCopies = await prisma.userReward.count({
          where: {
            OR: [
              { imageUrl: { in: oldRewardUrls } },
              { originalUrl: { in: oldRewardUrls } },
            ],
          },
        });

        if (heldCopies === 0) {
          replacedPosterUrls.push(...oldRewardUrls);
        }
      }
    }

    if (replacedPosterUrls.length > 0) {
      try {
        await deleteR2AssetsFromUrls([...new Set(replacedPosterUrls)]);
      } catch {
        // The DB update is already complete; stale poster files can be cleaned up later.
      }
    }

    revalidateSeriesSurfaces(input.mangaId);
    if (slotHolder) {
      revalidatePath(`/manga/${slotHolder.id}`);
    }

    return {
      ok: true,
      message: `Updated "${input.mangaName}" in Neon.`,
      createdMangaId: input.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Manga update failed.",
    };
  }
}

export async function reorderChapterPagesAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for chapter page edits.",
      };
    }

    const chapterId = String(formData.get("chapterId") ?? "").trim();
    const pageOrderRaw = String(formData.get("pageOrder") ?? "").trim();

    if (!chapterId || !pageOrderRaw) {
      return {
        ok: false,
        message: "Choose a chapter and keep at least one page in the order list.",
      };
    }

    const pageOrder = JSON.parse(pageOrderRaw);

    if (
      !Array.isArray(pageOrder) ||
      pageOrder.length === 0 ||
      !pageOrder.every((entry) => typeof entry === "string")
    ) {
      return {
        ok: false,
        message: "The page order payload is invalid.",
      };
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        mangaId: true,
        chapterNumber: true,
        pages: {
          orderBy: {
            pageNumber: "asc",
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!chapter) {
      return {
        ok: false,
        message: "That chapter could not be found.",
      };
    }

    const existingPageIds = chapter.pages.map((page) => page.id).sort();
    const requestedPageIds = [...pageOrder].sort();

    if (
      existingPageIds.length !== requestedPageIds.length ||
      existingPageIds.some((pageId, index) => pageId !== requestedPageIds[index])
    ) {
      return {
        ok: false,
        message: "The page list no longer matches the latest DB state. Refresh and try again.",
      };
    }

    // Set-based renumber (two statements) rather than a per-page update loop,
    // which previously issued 2×N sequential round-trips and exceeded Prisma's
    // 5s interactive-transaction timeout on long chapters. Shift every page far
    // out of range, then assign the requested order via unnest WITH ORDINALITY.
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`
          UPDATE "public"."Page"
          SET "pageNumber" = "pageNumber" + 100000
          WHERE "chapterId" = ${chapterId}
        `;
        await tx.$executeRaw`
          UPDATE "public"."Page" p
          SET "pageNumber" = data.rn
          FROM (
            SELECT id, ordinality AS rn
            FROM unnest(${pageOrder}::text[]) WITH ORDINALITY AS t(id, ordinality)
          ) data
          WHERE p.id = data.id AND p."chapterId" = ${chapterId}
        `;
      },
      { timeout: 15_000 },
    );

    revalidateSeriesSurfaces(chapter.mangaId);
    revalidatePath(`/reader/${chapter.id}`);

    return {
      ok: true,
      message: `Updated the page order for chapter ${chapter.chapterNumber}. Reader mode will now follow the new order.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Page order update failed.",
    };
  }
}

export async function updateChapterMetadataAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Бүлэг засахад админ эрх шаардлагатай.",
      };
    }

    const chapterId = String(formData.get("chapterId") ?? "").trim();
    const chapterTitle = String(formData.get("chapterTitle") ?? "").trim();
    const chapterNumber = Number(formData.get("chapterNumber"));
    const removeBadge = String(formData.get("removeBadge") ?? "") === "on";
    const parsedBadgeScale = Number(formData.get("badgeScale"));
    const badgeScale = Number.isFinite(parsedBadgeScale)
      ? Math.min(100, Math.max(20, Math.round(parsedBadgeScale)))
      : 85;

    if (!chapterId) {
      return {
        ok: false,
        message: "Засах бүлгээ сонгоно уу.",
      };
    }

    if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) {
      return {
        ok: false,
        message: "Бүлгийн дугаар 0-ээс их байх ёстой.",
      };
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        mangaId: true,
        chapterNumber: true,
        title: true,
        coverImage: true,
        badgeImage: true,
        manga: {
          select: {
            mangaName: true,
            posterOptions: true,
          },
        },
      },
    });

    if (!chapter) {
      return {
        ok: false,
        message: "Тэр бүлэг олдсонгүй.",
      };
    }

    const duplicateChapter = await prisma.chapter.findFirst({
      where: {
        mangaId: chapter.mangaId,
        chapterNumber,
        NOT: {
          id: chapter.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateChapter) {
      return {
        ok: false,
        message: `Энэ мангад ${chapterNumber} дугаартай бүлэг аль хэдийн байна.`,
      };
    }

    // Uploaded by the browser straight to this chapter's folder in R2.
    const chapterRoot = `manga/${chapter.mangaId}/chapters/${chapter.id}/`;
    const chapterCoverImage =
      readUploadedUrl(formData, "chapterCoverUrl", `${chapterRoot}cover/`) ??
      undefined;
    const uploadedBadgeUrl = readUploadedUrl(
      formData,
      "chapterBadgeUrl",
      `${chapterRoot}badge/`,
    );

    const badgeData: { badgeImage?: string | null; badgeScale?: number | null } =
      {};
    let staleBadgeUrl: string | null = null;

    if (uploadedBadgeUrl) {
      badgeData.badgeImage = uploadedBadgeUrl;
      badgeData.badgeScale = badgeScale;

      if (chapter.badgeImage) {
        staleBadgeUrl = chapter.badgeImage;
      }
    } else if (removeBadge) {
      badgeData.badgeImage = null;
      badgeData.badgeScale = null;

      if (chapter.badgeImage) {
        staleBadgeUrl = chapter.badgeImage;
      }
    } else if (chapter.badgeImage) {
      // Keep the existing badge, but allow resizing it without re-uploading.
      badgeData.badgeScale = badgeScale;
    }

    await prisma.chapter.update({
      where: {
        id: chapter.id,
      },
      data: {
        chapterNumber,
        title: chapterTitle || null,
        yumeComment: parseYumeComment(formData),
        ...(chapterCoverImage ? { coverImage: chapterCoverImage } : {}),
        ...badgeData,
      },
    });

    // Only a dedicated thumbnail upload is safe to delete. A cover can also be
    // one of the chapter's own pages (the Drive import picks one) or sit in the
    // series' poster library, and deleting those files would break the reader
    // or the poster chooser.
    const oldCoverIsDedicated =
      chapter.coverImage &&
      getR2KeyFromUrl(chapter.coverImage)?.startsWith(`${chapterRoot}cover/`) &&
      !chapter.manga.posterOptions.includes(chapter.coverImage);
    const urlsToCleanUp = [
      ...(chapterCoverImage && oldCoverIsDedicated && chapter.coverImage
        ? [chapter.coverImage]
        : []),
      ...(staleBadgeUrl ? [staleBadgeUrl] : []),
    ];

    if (urlsToCleanUp.length > 0) {
      try {
        await deleteR2AssetsFromUrls(urlsToCleanUp);
      } catch {
        // The chapter update succeeded; stale files can be cleaned up later.
      }
    }

    revalidateSeriesSurfaces(chapter.mangaId);
    revalidatePath(`/reader/${chapter.id}`);

    return {
      ok: true,
      message: `Бүлэг ${chapterNumber} шинэчлэгдлээ.`,
      createdMangaId: chapter.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Бүлэг шинэчлэхэд алдаа гарлаа.",
    };
  }
}

export async function replaceChapterPageImageAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for page image replacement.",
      };
    }

    const pageId = String(formData.get("pageId") ?? "").trim();

    if (!pageId) {
      return {
        ok: false,
        message: "Choose a page before replacing its image.",
      };
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        chapterId: true,
        pageNumber: true,
        imageUrl: true,
        chapter: {
          select: {
            id: true,
            mangaId: true,
            chapterNumber: true,
            coverImage: true,
          },
        },
      },
    });

    if (!page) {
      return {
        ok: false,
        message: "That page could not be found.",
      };
    }

    // Uploaded by the browser straight into this chapter's folder.
    const url = readUploadedUrl(
      formData,
      "pageImageUrl",
      `manga/${page.chapter.mangaId}/chapters/${page.chapterId}/`,
    );

    if (!url) {
      return {
        ok: false,
        message: "Солих зургаа сонгоод дахин оролдоно уу.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.page.update({
        where: { id: page.id },
        data: {
          imageUrl: url,
          width: null,
          height: null,
        },
      });

      if (page.chapter.coverImage === page.imageUrl) {
        await tx.chapter.update({
          where: { id: page.chapter.id },
          data: {
            coverImage: url,
          },
        });
      }
    });

    let removedOldFile = true;

    try {
      await deleteR2AssetsFromUrls(
        await urlsSafeToDelete(page.chapter.mangaId, [page.imageUrl]),
      );
    } catch {
      removedOldFile = false;
    }

    // The first page doubles as the feed card fallback image.
    revalidateSeriesSurfaces(page.chapter.mangaId);
    revalidatePath(`/reader/${page.chapter.id}`);

    return {
      ok: true,
      message: removedOldFile
        ? `Replaced page ${page.pageNumber} in chapter ${page.chapter.chapterNumber}.`
        : `Replaced page ${page.pageNumber} in chapter ${page.chapter.chapterNumber}, but the old R2 file could not be deleted automatically.`,
      createdMangaId: page.chapter.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Page image replacement failed.",
    };
  }
}

export async function deleteChapterPageAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for page deletion.",
      };
    }

    const pageId = String(formData.get("pageId") ?? "").trim();

    if (!pageId) {
      return {
        ok: false,
        message: "Choose a page before deleting it.",
      };
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        chapterId: true,
        pageNumber: true,
        imageUrl: true,
        chapter: {
          select: {
            id: true,
            mangaId: true,
            chapterNumber: true,
            coverImage: true,
            pages: {
              orderBy: {
                pageNumber: "asc",
              },
              select: {
                id: true,
                pageNumber: true,
              },
            },
          },
        },
      },
    });

    if (!page) {
      return {
        ok: false,
        message: "That page could not be found.",
      };
    }

    if (page.chapter.pages.length <= 1) {
      return {
        ok: false,
        message: "A chapter needs at least one page. Delete the whole chapter instead.",
      };
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.page.delete({
          where: { id: page.id },
        });

        if (page.chapter.coverImage === page.imageUrl) {
          await tx.chapter.update({
            where: { id: page.chapter.id },
            data: { coverImage: null },
          });
        }

        // Close the page-number gap with two set-based statements instead of a
        // per-page update loop. The old loop issued 2×N sequential round-trips
        // and blew Prisma's 5s interactive-transaction timeout on long chapters
        // (80+ pages), which made deletion fail intermittently. The first
        // statement shifts every remaining page far out of range so the second
        // can renumber to 1..n by order without unique-constraint clashes.
        await tx.$executeRaw`
          UPDATE "public"."Page"
          SET "pageNumber" = "pageNumber" + 100000
          WHERE "chapterId" = ${page.chapter.id}
        `;
        await tx.$executeRaw`
          WITH ordered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY "pageNumber") AS rn
            FROM "public"."Page"
            WHERE "chapterId" = ${page.chapter.id}
          )
          UPDATE "public"."Page" p
          SET "pageNumber" = o.rn
          FROM ordered o
          WHERE p.id = o.id
        `;
      },
      { timeout: 15_000 },
    );

    let removedFile = true;

    try {
      await deleteR2AssetsFromUrls(
        await urlsSafeToDelete(page.chapter.mangaId, [page.imageUrl]),
      );
    } catch {
      removedFile = false;
    }

    // The first page doubles as the feed card fallback image.
    revalidateSeriesSurfaces(page.chapter.mangaId);
    revalidatePath(`/reader/${page.chapter.id}`);

    return {
      ok: true,
      message: removedFile
        ? `Deleted page ${page.pageNumber} from chapter ${page.chapter.chapterNumber} and renumbered the remaining pages.`
        : `Deleted page ${page.pageNumber} from chapter ${page.chapter.chapterNumber}, but its R2 file could not be removed automatically.`,
      createdMangaId: page.chapter.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Page deletion failed.",
    };
  }
}

export async function deleteChapterAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return {
        ok: false,
        message: "Admin access is required for chapter deletion.",
      };
    }

    const chapterId = String(formData.get("chapterId") ?? "").trim();

    if (!chapterId) {
      return {
        ok: false,
        message: "Choose a chapter before deleting it.",
      };
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        mangaId: true,
        chapterNumber: true,
        title: true,
        coverImage: true,
        badgeImage: true,
        manga: {
          select: {
            mangaName: true,
          },
        },
        pages: {
          select: {
            imageUrl: true,
          },
        },
      },
    });

    if (!chapter) {
      return {
        ok: false,
        message: "That chapter could not be found.",
      };
    }

    const chapterFiles = [
      ...chapter.pages.map((page) => page.imageUrl),
      ...(chapter.coverImage ? [chapter.coverImage] : []),
      ...(chapter.badgeImage ? [chapter.badgeImage] : []),
    ];
    const deletableFiles = await urlsSafeToDelete(chapter.mangaId, chapterFiles);

    // The row goes first. Deleting files first meant a failure partway left
    // a chapter whose pages pointed at images that no longer existed.
    await prisma.chapter.delete({
      where: {
        id: chapter.id,
      },
    });

    let removedFiles = true;

    try {
      await deleteR2AssetsFromUrls(deletableFiles);
    } catch {
      // The chapter is gone from the site; stray files can be swept later.
      removedFiles = false;
    }

    revalidateSeriesSurfaces(chapter.mangaId);

    const keptForPosters = new Set(chapterFiles).size - deletableFiles.length;

    return {
      ok: true,
      message: removedFiles
        ? `"${chapter.manga.mangaName}"-н ${chapter.chapterNumber}-р бүлгийг устгалаа.${
            keptForPosters > 0
              ? ` Постерын санд ашиглагдаж буй ${keptForPosters} зургийг хадгаллаа.`
              : ""
          }`
        : `"${chapter.manga.mangaName}"-н ${chapter.chapterNumber}-р бүлгийг устгалаа, гэхдээ зарим файлыг R2-аас устгаж чадсангүй.`,
      createdMangaId: chapter.mangaId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Chapter deletion failed.",
    };
  }
}

/**
 * Sets (or clears, with an empty posterUrl) the manga's default poster — the
 * cover shown to everyone who hasn't picked their own. Must be one of the
 * manga's posterOptions.
 */
export async function setDefaultPosterAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return { ok: false, message: "Admin access is required." };
    }

    const mangaId = String(formData.get("mangaId") ?? "").trim();
    const posterUrl = String(formData.get("posterUrl") ?? "").trim();

    if (!mangaId) {
      return { ok: false, message: "Манга сонгоно уу." };
    }

    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { id: true, posterOptions: true },
    });

    if (!manga) {
      return { ok: false, message: "Манга олдсонгүй." };
    }

    if (posterUrl && !manga.posterOptions.includes(posterUrl)) {
      return { ok: false, message: "Тэр постер сонголтод алга." };
    }

    await prisma.manga.update({
      where: { id: mangaId },
      data: { defaultPoster: posterUrl || null },
    });

    revalidateSeriesSurfaces(mangaId);

    return {
      ok: true,
      message: posterUrl
        ? "Үндсэн постер шинэчлэгдлээ."
        : "Үндсэн постер цэвэрлэгдлээ.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Постер шинэчлэхэд алдаа гарлаа.",
    };
  }
}

/**
 * True when `url` points at an asset that belongs to this manga (its covers,
 * chapter thumbnails, badges or pages all live under `manga/<mangaId>/`).
 * Keeps the poster library from being pointed at arbitrary remote images.
 */
function isOwnMangaAsset(url: string, mangaId: string) {
  const key = getR2KeyFromUrl(url);

  return Boolean(key && key.startsWith(`manga/${mangaId}/`));
}

/**
 * Adds an image to the manga's poster library. The source is either an image
 * the manga already owns (a chapter cover or any chapter page) or a freshly
 * uploaded, dedicated poster file. Optionally makes it the default poster in
 * the same step.
 */
export async function addPosterOptionAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return { ok: false, message: "Admin access is required." };
    }

    const mangaId = String(formData.get("mangaId") ?? "").trim();
    // Either an image the series already owns, or a dedicated poster the
    // browser just uploaded to `manga/<id>/poster/` — both pass the same check.
    const posterUrl = String(formData.get("posterUrl") ?? "").trim();
    const makeDefault = formData.get("makeDefault") === "on";

    if (!mangaId) {
      return { ok: false, message: "Манга сонгоно уу." };
    }

    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { id: true, mangaName: true, posterOptions: true },
    });

    if (!manga) {
      return { ok: false, message: "Манга олдсонгүй." };
    }

    if (!posterUrl) {
      return {
        ok: false,
        message: "Зураг сонгох эсвэл файл оруулна уу.",
      };
    }

    if (!isOwnMangaAsset(posterUrl, mangaId)) {
      return {
        ok: false,
        message: "Зөвхөн энэ манганы өөрийн зургийг постер болгож болно.",
      };
    }

    if (manga.posterOptions.includes(posterUrl)) {
      if (!makeDefault) {
        return { ok: false, message: "Энэ зураг постерын санд аль хэдийн байна." };
      }
    } else {
      await prisma.manga.update({
        where: { id: mangaId },
        data: { posterOptions: { push: posterUrl } },
      });
    }

    if (makeDefault) {
      await prisma.manga.update({
        where: { id: mangaId },
        data: { defaultPoster: posterUrl },
      });
    }

    revalidateSeriesSurfaces(mangaId);

    return {
      ok: true,
      message: makeDefault
        ? "Постер нэмэгдэж, үндсэн постер болголоо."
        : "Постер санд нэмэгдлээ.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Постер нэмэхэд алдаа гарлаа.",
    };
  }
}

/**
 * Drops an image from the poster library. Readers who had picked it fall back
 * to the default cover. The stored file is only deleted when it was a
 * dedicated poster upload — chapter art stays untouched.
 */
export async function removePosterOptionAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return { ok: false, message: "Admin access is required." };
    }

    const mangaId = String(formData.get("mangaId") ?? "").trim();
    const posterUrl = String(formData.get("posterUrl") ?? "").trim();

    if (!mangaId || !posterUrl) {
      return { ok: false, message: "Постер сонгоно уу." };
    }

    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { id: true, posterOptions: true, defaultPoster: true },
    });

    if (!manga) {
      return { ok: false, message: "Манга олдсонгүй." };
    }

    if (!manga.posterOptions.includes(posterUrl)) {
      return { ok: false, message: "Тэр постер сонголтод алга." };
    }

    await prisma.$transaction([
      prisma.manga.update({
        where: { id: mangaId },
        data: {
          posterOptions: manga.posterOptions.filter((url) => url !== posterUrl),
          defaultPoster:
            manga.defaultPoster === posterUrl ? null : manga.defaultPoster,
        },
      }),
      prisma.userPosterChoice.deleteMany({ where: { mangaId, posterUrl } }),
    ]);

    // Only dedicated poster uploads live under `poster/`; chapter covers and
    // pages are still referenced by their own rows, so they must survive.
    const key = getR2KeyFromUrl(posterUrl);

    if (key?.startsWith(`manga/${mangaId}/poster/`)) {
      try {
        await deleteFromR2(key);
      } catch {
        // The DB no longer references it; a stale object can be swept later.
      }
    }

    revalidateSeriesSurfaces(mangaId);

    return { ok: true, message: "Постер сангаас хаслаа." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Постер хасахад алдаа гарлаа.",
    };
  }
}

export type AdminChapterPage = {
  id: string;
  pageNumber: number;
  imageUrl: string;
};

/**
 * One chapter's pages, loaded when the admin opens that chapter (the page
 * editor, or the poster library's "from chapter art" picker).
 *
 * The admin page used to embed every page of every chapter — ~68k URLs, about
 * 13 MB — in its initial props, and each save's revalidation sent it all
 * again. Nothing needs more than one chapter's pages at a time.
 */
export async function getChapterPagesAction(
  chapterId: string,
): Promise<AdminChapterPage[] | null> {
  const adminUser = await requireAdminUser();

  if (!adminUser || !chapterId) {
    return null;
  }

  return prisma.page.findMany({
    where: { chapterId },
    orderBy: { pageNumber: "asc" },
    select: { id: true, pageNumber: true, imageUrl: true },
  });
}
