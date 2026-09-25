"use client";

import Link from "next/link";
import {
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  CloudUpload,
  Database,
  Gift,
  GripVertical,
  FileImage,
  FolderSync,
  Layers3,
  Lock,
  Megaphone,
  MoveDown,
  MoveUp,
  PencilLine,
  PenLine,
  Trash2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import {
  addPosterOptionAction,
  deleteChapterAction,
  deleteChapterPageAction,
  getChapterPagesAction,
  removePosterOptionAction,
  importGoogleDriveFolderAction,
  ingestMangaAction,
  reorderChapterPagesAction,
  replaceChapterPageImageAction,
  setDefaultPosterAction,
  updateChapterMetadataAction,
  updateMangaMetadataAction,
  type AdminActionState,
} from "@/app/admin/actions";
import {
  DIRECT_UPLOAD_STYLES,
  DirectImageField,
  DirectPagesField,
  UploadProgressNote,
  UploadRegistryContext,
  useNewUploadRegistry,
  useSafeActionState,
  useUploadRegistryState,
  type UploadRegistry,
} from "@/app/admin/direct-upload";
import { NewsPanel } from "@/app/admin/NewsPanel";
import { UserSearchPanel } from "@/app/admin/UserSearchPanel";
import { UsersTablePanel } from "@/app/admin/UsersTablePanel";
import { ViewAnalyticsPanel } from "@/app/admin/ViewAnalyticsPanel";
import {
  MAX_PAYWALLED_LATEST_CHAPTERS,
  PAYWALLED_LATEST_CHAPTERS,
} from "@/lib/plans";
import { ImageEditorField, type AspectPreset } from "@/app/admin/ImageEditor";

const initialAdminActionState: AdminActionState = {
  ok: false,
  message: "",
};

const ADMIN_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap');

.yume-admin { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-admin * { box-sizing: border-box; }

.yume-admin .ad-eyebrow {
  font-family: 'Marcellus', serif;
  font-size: 10.5px; letter-spacing: 0.32em; text-transform: uppercase;
  color: var(--home-gold); display: inline-flex; align-items: center; gap: 8px;
}
.yume-admin .ad-h1 {
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.02; color: var(--home-plum);
}
.yume-admin .ad-h2 {
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: clamp(1.5rem, 2.6vw, 2rem); line-height: 1.05; color: var(--home-plum);
}
.yume-admin .ad-h3 {
  font-family: 'Cormorant Garamond', serif; font-weight: 600;
  font-size: 20px; color: var(--home-plum);
}
.yume-admin .ad-sub { font-size: 13.5px; line-height: 1.7; color: var(--home-plum-soft); }

.yume-admin .ad-card {
  border-radius: 24px; background: var(--home-paper);
  border: 1px solid var(--home-line);
  box-shadow: 0 22px 48px -30px var(--home-shadow-strong), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
.yume-admin .ad-card-glass {
  border-radius: 26px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-blush) 65%, transparent), transparent 58%),
    color-mix(in srgb, var(--home-paper) 82%, transparent);
  border: 1px solid var(--home-line-strong);
  box-shadow: 0 30px 60px -30px var(--home-shadow-strong), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}
.yume-admin .ad-soft { border-radius: 16px; background: var(--home-paper-2); border: 1px solid var(--home-line); }
.yume-admin .ad-dashed { border-radius: 16px; background: var(--home-paper-2); border: 1px dashed var(--home-line-strong); }

.yume-admin .ad-back {
  display: inline-flex; align-items: center; gap: 8px;
  border-radius: 999px; border: 1px solid var(--home-line); background: var(--home-paper);
  padding: 9px 16px; font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--home-plum-soft); text-decoration: none; transition: all 0.2s;
}
.yume-admin .ad-back:hover { border-color: var(--home-rose); color: var(--home-rose-deep); transform: translateX(-2px); }

.yume-admin .ad-label {
  display: block; font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--home-gold); margin-bottom: 8px;
}

.yume-admin .ad-input, .yume-admin .ad-select, .yume-admin .ad-textarea {
  width: 100%; border-radius: 14px; border: 1px solid var(--home-line);
  background: var(--home-paper-2); padding: 12px 15px; font-size: 14px;
  color: var(--home-plum); outline: none; font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.yume-admin .ad-input::placeholder, .yume-admin .ad-textarea::placeholder { color: var(--home-plum-soft); }
.yume-admin .ad-input:focus, .yume-admin .ad-select:focus, .yume-admin .ad-textarea:focus {
  border-color: var(--home-rose); background: var(--home-paper);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-rose) 16%, transparent);
}
.yume-admin .ad-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23c8a24c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px;
}

.yume-admin .ad-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 14px; padding: 13px 22px;
  font-family: 'Marcellus', serif; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
  cursor: pointer; border: 1px solid transparent; text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s, border-color 0.2s, color 0.2s;
}
.yume-admin .ad-btn:hover { transform: translateY(-2px); }
.yume-admin .ad-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.yume-admin .ad-btn-primary {
  background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep)); color: #fff;
  box-shadow: 0 14px 30px -12px var(--home-rose-deep); border-color: rgba(255, 255, 255, 0.25);
}
.yume-admin .ad-btn-gold {
  background: linear-gradient(135deg, var(--home-gold-soft), var(--home-gold)); color: #4a3614;
  box-shadow: 0 14px 30px -14px var(--home-gold); border-color: rgba(255, 255, 255, 0.35);
}
.yume-admin .ad-btn-line {
  background: var(--home-paper); color: var(--home-rose-deep); border-color: var(--home-line);
}
.yume-admin .ad-btn-line:hover { border-color: var(--home-rose); }
.yume-admin .ad-btn-danger {
  background: linear-gradient(135deg, #d98f9f, #c15f73); color: #fff;
  box-shadow: 0 14px 30px -14px #b9577b; border-color: rgba(255, 255, 255, 0.25);
}

.yume-admin .ad-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 12px; padding: 12px; border: 1px solid var(--home-line);
  background: var(--home-paper); color: var(--home-plum); cursor: pointer; transition: all 0.2s;
}
.yume-admin .ad-icon-btn:hover:not(:disabled) { border-color: var(--home-rose); color: var(--home-rose-deep); }
.yume-admin .ad-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.yume-admin .ad-tab {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 14px; padding: 13px 16px;
  font-family: 'Marcellus', serif; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
  border: 1px solid var(--home-line); background: var(--home-paper-2); color: var(--home-plum);
  cursor: pointer; transition: all 0.2s;
}
.yume-admin .ad-tab:hover { border-color: var(--home-rose); color: var(--home-rose-deep); }
.yume-admin .ad-tab-active {
  background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
  border-color: transparent; color: #fff;
  box-shadow: 0 12px 24px -12px var(--home-rose-deep);
}
.yume-admin .ad-tab-active:hover { color: #fff; }

.yume-admin .ad-tile { border-radius: 18px; background: var(--home-paper-2); border: 1px solid var(--home-line); padding: 16px; }
.yume-admin .ad-tile-ico {
  display: inline-flex; border-radius: 12px; padding: 8px;
  background: linear-gradient(135deg, var(--home-gold-soft), var(--home-rose)); color: #fff;
}
.yume-admin .ad-tile-val { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 20px; color: var(--home-plum); word-break: break-word; }

.yume-admin .ad-chip {
  border-radius: 999px; border: 1px solid var(--home-line); background: var(--home-paper);
  padding: 5px 12px; font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--home-plum-soft);
}

.yume-admin .ad-upload {
  position: relative; border-radius: 20px; border: 1px dashed var(--home-line-strong);
  background: var(--home-paper-2); padding: 20px; transition: border-color 0.2s, background 0.2s; cursor: pointer;
}
.yume-admin .ad-upload:hover { border-color: var(--home-rose); background: var(--home-paper); }
.yume-admin .ad-upload-ico {
  border-radius: 999px; padding: 12px;
  background: linear-gradient(135deg, var(--home-gold-soft), var(--home-rose)); color: #fff;
}

.yume-admin .ad-danger-box {
  border-radius: 18px; padding: 18px;
  border: 1px solid color-mix(in srgb, #c15f73 42%, var(--home-line));
  background: color-mix(in srgb, #e7a3b0 16%, var(--home-paper));
}
.yume-admin .ad-danger-eyebrow {
  font-family: 'Marcellus', serif; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #a8506a;
}

.yume-admin .ad-banner {
  display: flex; align-items: flex-start; gap: 12px;
  border-radius: 16px; padding: 14px 18px; font-size: 14px; border: 1px solid;
}
.yume-admin .ad-banner-ok {
  background: color-mix(in srgb, #5fa97f 15%, var(--home-paper));
  border-color: color-mix(in srgb, #5fa97f 42%, transparent); color: #356b4d;
}
.yume-admin .ad-banner-err {
  background: color-mix(in srgb, #c15f73 13%, var(--home-paper));
  border-color: color-mix(in srgb, #c15f73 42%, transparent); color: #9c4a59;
}

.yume-admin .ad-inforow {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  padding-bottom: 12px; border-bottom: 1px solid var(--home-line);
}
.yume-admin .ad-inforow:last-child { border-bottom: none; padding-bottom: 0; }
.yume-admin .ad-inforow-label { font-family: 'Marcellus', serif; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--home-gold); }
.yume-admin .ad-inforow-value { max-width: 62%; text-align: right; font-size: 13.5px; color: var(--home-plum); word-break: break-word; }

.yume-admin .ad-page { border-radius: 18px; background: var(--home-paper-2); border: 1px solid var(--home-line); padding: 14px; }
.yume-admin .ad-thumb { border-radius: 12px; overflow: hidden; border: 1px solid var(--home-line); background: var(--home-paper); }

.yume-admin .ad-recent { border-radius: 16px; background: var(--home-paper-2); border: 1px solid var(--home-line); padding: 14px 16px; transition: border-color 0.2s; }
.yume-admin .ad-recent:hover { border-color: var(--home-line-strong); }

.yume-admin .ad-check {
  display: flex; align-items: flex-start; gap: 10px;
  border-radius: 14px; border: 1px solid var(--home-line); background: var(--home-paper-2);
  padding: 14px; font-size: 13.5px; color: var(--home-plum); cursor: pointer; transition: all 0.2s;
}
.yume-admin .ad-check:hover { border-color: var(--home-rose); }
.yume-admin .ad-check input { accent-color: var(--home-rose-deep); }
`;

type MangaStatusValue =
  | "ONGOING"
  | "COMPLETED"
  | "CATCHING_UP"
  | "STOPPED";

type AdminConsoleProps = {
  dbUser: {
    email: string;
    username: string | null;
    role: "READER" | "ADMIN";
    createdAt: string;
  };
  stats: {
    mangaCount: number;
    chapterCount: number;
    pageCount: number;
  };
  recentManga: Array<{
    id: string;
    mangaName: string;
    status: MangaStatusValue;
    chapterCount: number;
    /** Total chapter opens. Admin-only — never sent to readers. */
    viewCount: number;
  }>;
  mangaLibrary: Array<{
    id: string;
    mangaName: string;
    description: string;
    coverImage: string;
    homeCoverImage: string;
    detailCoverImage: string;
    titleFont: string;
    author: string;
    artist: string;
    status: MangaStatusValue;
    isFeatured: boolean;
    featuredOrder: number | null;
    paywalledChapters: number | null;
    promoImageUrl: string;
    /** Homepage ad slot 1–4, or null when the banner is not shown. */
    promoSlot: number | null;
    /** Hero slide art (16:9 / 1:1); empty falls back to the other, then the poster. */
    featuredImageDesktop: string;
    featuredImageMobile: string;
    /** Completion reward image; empty when this series gives no reward. */
    rewardBackgroundUrl: string;
    /** Readers who have earned this series' reward. */
    rewardCount: number;
    posterOptions: string[];
    defaultPoster: string;
    genres: string[];
    chapterCount: number;
    /** Total chapter opens. Admin-only — never sent to readers. */
    viewCount: number;
    chapters: Array<{
      id: string;
      chapterNumber: number;
      title: string;
      coverImage: string;
      badgeImage: string;
      badgeScale: number | null;
      /** Yume's end-of-chapter note; empty = none. */
      yumeComment: string;
      publishedAt: string;
      pageCount: number;
    }>;
  }>;
};

type AdminView =
  | "manage"
  | "chapters"
  | "upload"
  | "drive"
  | "analytics"
  | "users"
  | "news";

/**
 * Hero slide crops. One fixed ratio each, so the cropper cannot produce an
 * image the slider would then crop again.
 */
const FEATURED_MOBILE_PRESETS: AspectPreset[] = [
  { id: "square", label: "1:1", ratio: 1 },
];
const FEATURED_DESKTOP_PRESETS: AspectPreset[] = [
  { id: "wide", label: "16:9", ratio: 16 / 9 },
];

/** Where each homepage ad slot sits, for the slot picker. */
const PROMO_SLOT_LABELS: Record<number, string> = {
  1: "Үргэлжлүүлэн унших ба Сүүлийн шинэчлэлийн хооронд",
  2: "Сүүлийн шинэчлэл ба Топ 10 үзэлттэй мангын хооронд",
  3: "Топ 10 үзэлттэй манга ба Дууссаны хооронд",
  4: "Дууссан ба Бүх мангын хооронд",
};
type DriveImportMode =
  | "new_manga_from_chapter"
  | "existing_manga_chapter"
  | "bulk_parent_folder";
type PageDraftItem = {
  id: string;
  pageNumber: number;
  imageUrl: string;
};

export function AdminConsole({
  dbUser,
  stats,
  recentManga,
  mangaLibrary,
}: AdminConsoleProps) {
  const initialChapter = mangaLibrary[0]?.chapters[0] ?? null;
  const [activeView, setActiveView] = useState<AdminView>("manage");
  const [selectedMangaId, setSelectedMangaId] = useState(
    mangaLibrary[0]?.id ?? "",
  );
  const [selectedChapterId, setSelectedChapterId] = useState(
    initialChapter?.id ?? "",
  );

  // Chapter pages, fetched one chapter at a time when it is opened. The admin
  // page no longer ships every page of every chapter up front.
  const [pagesByChapter, setPagesByChapter] = useState<
    Record<string, PageDraftItem[] | "error">
  >({});
  const pagesInFlight = useRef(new Set<string>());

  async function loadChapterPages(chapterId: string, force = false) {
    if (!chapterId || pagesInFlight.current.has(chapterId)) return;
    if (!force && Array.isArray(pagesByChapter[chapterId])) return;

    pagesInFlight.current.add(chapterId);
    try {
      const pages = await getChapterPagesAction(chapterId);
      setPagesByChapter((current) => ({
        ...current,
        [chapterId]: pages ?? "error",
      }));
    } catch {
      setPagesByChapter((current) => ({ ...current, [chapterId]: "error" }));
    } finally {
      pagesInFlight.current.delete(chapterId);
    }
  }

  // One registry per form that parks images until it is saved.
  const manageRegistry = useNewUploadRegistry();
  const posterUploadRegistry = useNewUploadRegistry();
  const chapterMetaRegistry = useNewUploadRegistry();
  const pageImageRegistry = useNewUploadRegistry();
  const manualRegistry = useNewUploadRegistry();
  const driveRegistry = useNewUploadRegistry();

  const [manualState, manualFormAction, manualPending] = useSafeActionState(
    ingestMangaAction,
    initialAdminActionState,
    {
      registry: manualRegistry,
      scope: () => ({ kind: "ingest" }),
      validate: (_formData, pending) =>
        pending.some((upload) => upload.slot === "page")
          ? null
          : "Бүлгийн хуудсуудаа сонгоно уу.",
    },
  );
  const [driveState, driveFormAction, drivePending] = useSafeActionState(
    importGoogleDriveFolderAction,
    initialAdminActionState,
    {
      registry: driveRegistry,
      scope: (formData) => ({
        kind: "ingest",
        mangaId:
          formData.get("driveImportMode") === "existing_manga_chapter"
            ? String(formData.get("existingMangaId") ?? "") || null
            : null,
      }),
    },
  );
  const [manageState, manageFormAction, managePending] = useSafeActionState(
    updateMangaMetadataAction,
    initialAdminActionState,
    {
      registry: manageRegistry,
      scope: (formData) => ({
        kind: "manga",
        mangaId: String(formData.get("mangaId") ?? ""),
      }),
      // Checked here too so slot problems surface before any image uploads.
      validate: (formData, pending) => {
        const slot = Number(formData.get("promoSlot"));
        const mangaId = String(formData.get("mangaId") ?? "");

        if (!slot) {
          return null;
        }

        const current = mangaLibrary.find((entry) => entry.id === mangaId);
        const willHaveBanner =
          pending.some((upload) => upload.slot === "promo") ||
          (Boolean(current?.promoImageUrl) &&
            formData.get("removePromoImage") !== "on");

        if (!willHaveBanner) {
          return "Байрлал сонгохын өмнө баннер зураг оруулна уу.";
        }

        const holder = mangaLibrary.find(
          (entry) =>
            entry.promoSlot === slot &&
            entry.id !== mangaId &&
            Boolean(entry.promoImageUrl),
        );

        return holder && formData.get("swapPromoSlot") !== "on"
          ? `${slot}-р байрлалд "${holder.mangaName}" баннер байна. Сольж тавих бол «Байрлалыг солих»-ыг чагтлаад дахин хадгална уу.`
          : null;
      },
    },
  );
  const [chapterOrderState, chapterOrderFormAction, chapterOrderPending] =
    useSafeActionState(reorderChapterPagesAction, initialAdminActionState, {
      onSuccess: (_result, formData) =>
        loadChapterPages(String(formData.get("chapterId") ?? ""), true),
    });
  const [chapterDeleteState, chapterDeleteFormAction, chapterDeletePending] =
    useSafeActionState(deleteChapterAction, initialAdminActionState);
  const [chapterMetaState, chapterMetaFormAction, chapterMetaPending] =
    useSafeActionState(updateChapterMetadataAction, initialAdminActionState, {
      registry: chapterMetaRegistry,
      scope: (formData) => ({
        kind: "chapter",
        chapterId: String(formData.get("chapterId") ?? ""),
      }),
    });
  const [pageImageState, pageImageFormAction, pageImagePending] =
    useSafeActionState(replaceChapterPageImageAction, initialAdminActionState, {
      registry: pageImageRegistry,
      // Each page row parks its own file; a row's save uploads only its own.
      groups: (formData) => [`page:${String(formData.get("pageId") ?? "")}`],
      scope: (formData) => ({
        kind: "chapter",
        chapterId: String(formData.get("chapterId") ?? ""),
      }),
      validate: (formData, pending) =>
        pending.length > 0 || formData.get("pageImageUrl")
          ? null
          : "Солих зургаа эхлээд сонгоно уу.",
      onSuccess: (_result, formData) =>
        loadChapterPages(String(formData.get("chapterId") ?? ""), true),
    });
  const [pageDeleteState, pageDeleteFormAction, pageDeletePending] =
    useSafeActionState(deleteChapterPageAction, initialAdminActionState, {
      onSuccess: (_result, formData) =>
        loadChapterPages(String(formData.get("chapterId") ?? ""), true),
    });
  const [defaultPosterState, defaultPosterFormAction, defaultPosterPending] =
    useSafeActionState(setDefaultPosterAction, initialAdminActionState);
  const [addPosterState, addPosterFormAction, addPosterPending] =
    useSafeActionState(addPosterOptionAction, initialAdminActionState);
  // The dedicated-poster upload shares the server action but has its own
  // state, so a parked file can never ride along with the "from chapter art"
  // form above it.
  const [
    uploadPosterState,
    uploadPosterFormAction,
    uploadPosterPending,
  ] = useSafeActionState(addPosterOptionAction, initialAdminActionState, {
    registry: posterUploadRegistry,
    scope: (formData) => ({
      kind: "manga",
      mangaId: String(formData.get("mangaId") ?? ""),
    }),
    validate: (_formData, pending) =>
      pending.length > 0 ? null : "Постер болгох зургаа сонгоно уу.",
  });
  const [removePosterState, removePosterFormAction, removePosterPending] =
    useSafeActionState(removePosterOptionAction, initialAdminActionState);
  const manageUploads = useUploadRegistryState(manageRegistry);
  const posterUploads = useUploadRegistryState(posterUploadRegistry);
  const chapterMetaUploads = useUploadRegistryState(chapterMetaRegistry);
  const manualUploads = useUploadRegistryState(manualRegistry);
  const driveUploads = useUploadRegistryState(driveRegistry);
  // "Add poster from existing artwork" picker: a chapter, then one of its
  // images (its thumbnail or any page).
  const [posterSourceChapterId, setPosterSourceChapterId] = useState("");
  const [posterSourceUrl, setPosterSourceUrl] = useState("");
  const [promoSlotChoice, setPromoSlotChoice] = useState<{
    mangaId: string;
    slot: number | null;
  } | null>(null);
  const [driveImportMode, setDriveImportMode] = useState<DriveImportMode>(
    "new_manga_from_chapter",
  );
  const [replacementFileState, setReplacementFileState] = useState<{
    signature: string;
    names: Record<string, string>;
  }>({
    signature: "",
    names: {},
  });
  const [pageDraftState, setPageDraftState] = useState<{
    signature: string;
    pages: PageDraftItem[];
  }>({
    signature: "",
    pages: [],
  });

  const selectedManga =
    mangaLibrary.find((entry) => entry.id === selectedMangaId) ??
    mangaLibrary[0] ??
    null;
  const selectedChapter =
    selectedManga?.chapters.find((entry) => entry.id === selectedChapterId) ??
    selectedManga?.chapters[0] ??
    null;
  // Current hero line-up, so the owner can see the running order while editing
  // one series at a time.
  const featuredSummary = useMemo(
    () =>
      mangaLibrary
        .filter((entry) => entry.isFeatured)
        .sort(
          (left, right) =>
            (left.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
              (right.featuredOrder ?? Number.MAX_SAFE_INTEGER) ||
            left.mangaName.localeCompare(right.mangaName),
        ),
    [mangaLibrary],
  );
  // Which series holds each homepage ad slot, for the slot picker.
  const promoSlotHolders = useMemo(() => {
    const holders = new Map<number, { id: string; mangaName: string }>();
    for (const entry of mangaLibrary) {
      if (entry.promoSlot && entry.promoImageUrl) {
        holders.set(entry.promoSlot, { id: entry.id, mangaName: entry.mangaName });
      }
    }
    return holders;
  }, [mangaLibrary]);
  // The slot picked in the form but not saved yet (drives the swap warning).
  const pickedPromoSlot =
    selectedManga && promoSlotChoice?.mangaId === selectedManga.id
      ? promoSlotChoice.slot
      : (selectedManga?.promoSlot ?? null);
  const pickedSlotHolder =
    pickedPromoSlot !== null && selectedManga
      ? promoSlotHolders.get(pickedPromoSlot)
      : undefined;
  const promoSlotTaken =
    Boolean(pickedSlotHolder) && pickedSlotHolder?.id !== selectedManga?.id;

  // Images the selected source chapter can contribute to the poster library.
  const posterSourceChapter =
    selectedManga?.chapters.find(
      (entry) => entry.id === posterSourceChapterId,
    ) ?? null;
  const posterSourcePages = posterSourceChapter
    ? pagesByChapter[posterSourceChapter.id]
    : undefined;
  const posterSourceImages: Array<{ url: string; label: string }> =
    posterSourceChapter
      ? [
          ...(posterSourceChapter.coverImage
            ? [
                {
                  url: posterSourceChapter.coverImage,
                  label: "Бүлгийн зураг",
                },
              ]
            : []),
          ...(Array.isArray(posterSourcePages) ? posterSourcePages : [])
            .filter((page) => page.imageUrl !== posterSourceChapter.coverImage)
            .map((page) => ({
              url: page.imageUrl,
              label: `${page.pageNumber}-р хуудас`,
            })),
        ]
      : [];

  const selectedChapterPagesEntry = selectedChapter
    ? pagesByChapter[selectedChapter.id]
    : undefined;
  const selectedChapterPages = Array.isArray(selectedChapterPagesEntry)
    ? selectedChapterPagesEntry
    : null;
  const selectedChapterPageSignature = getChapterPageSignature(
    selectedChapter?.id,
    selectedChapterPages,
  );
  const pageDraft =
    pageDraftState.signature === selectedChapterPageSignature
      ? pageDraftState.pages
      : getSortedPages(selectedChapterPages ?? []);

  const resetPageEditDraft = () => {
    // An empty signature never matches, so the draft falls back to the
    // freshly loaded pages.
    setPageDraftState({ signature: "", pages: [] });
    setReplacementFileState({ signature: "", names: {} });
  };

  const updatePageDraft = (
    updater: (current: PageDraftItem[]) => PageDraftItem[],
  ) => {
    setPageDraftState({
      signature: selectedChapterPageSignature,
      pages: updater(pageDraft),
    });
  };

  const handleMangaSelectionChange = (mangaId: string) => {
    const nextManga =
      mangaLibrary.find((entry) => entry.id === mangaId) ??
      mangaLibrary[0] ??
      null;
    const nextChapter = nextManga?.chapters[0] ?? null;

    setSelectedMangaId(mangaId);
    setSelectedChapterId(nextChapter?.id ?? "");
    setPosterSourceChapterId("");
    setPosterSourceUrl("");
    setPromoSlotChoice(null);
    // Images parked for the previous series must not be saved onto this one.
    manageRegistry.reset();
    posterUploadRegistry.reset();
    chapterMetaRegistry.reset();
    pageImageRegistry.reset();
    resetPageEditDraft();

    if (activeView === "chapters" && nextChapter) {
      void loadChapterPages(nextChapter.id);
    }
  };

  const handleChapterSelectionChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    chapterMetaRegistry.reset();
    pageImageRegistry.reset();
    resetPageEditDraft();
    void loadChapterPages(chapterId);
  };

  const openView = (view: AdminView) => {
    setActiveView(view);

    if (view === "chapters" && selectedChapter) {
      void loadChapterPages(selectedChapter.id);
    }
  };

  const replacementFileNames =
    replacementFileState.signature === selectedChapterPageSignature
      ? replacementFileState.names
      : {};

  const handleReplacementPicked = (pageId: string, fileName: string | null) => {
    setReplacementFileState((current) => {
      const nextNames =
        current.signature === selectedChapterPageSignature
          ? { ...current.names }
          : {};

      if (fileName) {
        nextNames[pageId] = fileName;
      } else {
        delete nextNames[pageId];
      }

      return { signature: selectedChapterPageSignature, names: nextNames };
    });
  };

  // Page-top banner for the page-row actions. The main forms (manage, chapter,
  // manual upload, Drive) show their result inline next to their own button,
  // which on a phone is where the admin is looking.
  const activeState = pageDeleteState.message
    ? pageDeleteState
    : pageImageState.message
      ? pageImageState
      : chapterDeleteState.message
        ? chapterDeleteState
        : chapterOrderState;

  const statusTone = useMemo(() => {
    if (!activeState.message) {
      return null;
    }

    return activeState.ok
      ? { icon: CheckCircle2, className: "ad-banner-ok" }
      : { icon: AlertCircle, className: "ad-banner-err" };
  }, [activeState]);

  return (
    <div className="yume-surface yume-admin min-h-screen">
      <style>{ADMIN_STYLES + DIRECT_UPLOAD_STYLES}</style>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <header className="ad-card-glass motion-ink-up p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <Link href="/" className="ad-back">
                <ArrowLeft size={14} />
                Нүүр рүү буцах
              </Link>
              <div className="space-y-3">
                <span className="ad-eyebrow">
                  <Sparkles size={13} />
                  Удирдлагын самбар
                </span>
                <h1 className="ad-h1 max-w-3xl">
                  Манга, бүлэг, зураг, постерыг нэг дороос.
                </h1>
                <p className="ad-sub max-w-2xl">
                  Эндээс мэдээлэл засах, зураг солих, бүлэг шинэчлэх, Drive-аас
                  импортлох үйлдлүүдийг хийнэ.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1">
              <StatusTile
                icon={UserRound}
                label="Админ хэрэглэгч"
                value={dbUser.email}
                detail={dbUser.username ?? "Clerk дээр нэр тохируулаагүй"}
              />
              <StatusTile
                icon={ShieldCheck}
                label="Эрхийн түвшин"
                value={dbUser.role}
                detail="Админ эрх баталгаажсан"
              />
              <StatusTile
                icon={Database}
                label="Дата мөрүүд"
                value={stats.pageCount.toLocaleString()}
                detail={`${stats.mangaCount} манга • ${stats.chapterCount} бүлэг`}
              />
            </div>
          </div>
        </header>

        {statusTone ? (
          <div className={`ad-banner ${statusTone.className}`}>
            <statusTone.icon size={18} className="mt-0.5 shrink-0" />
            <p>{activeState.message}</p>
          </div>
        ) : null}

        <UserSearchPanel />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="ad-card motion-ink-up motion-ink-up-delay-1 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ViewButton
                  active={activeView === "manage"}
                  icon={PencilLine}
                  label="Манга засах"
                  onClick={() => openView("manage")}
                />
                <ViewButton
                  active={activeView === "upload"}
                  icon={CloudUpload}
                  label="Гараар оруулах"
                  onClick={() => openView("upload")}
                />
                <ViewButton
                  active={activeView === "chapters"}
                  icon={GripVertical}
                  label="Бүлгүүд"
                  onClick={() => openView("chapters")}
                />
                <ViewButton
                  active={activeView === "drive"}
                  icon={FolderSync}
                  label="Drive импорт"
                  onClick={() => openView("drive")}
                />
                <ViewButton
                  active={activeView === "analytics"}
                  icon={BarChart3}
                  label="Үзэлт шалгах"
                  onClick={() => openView("analytics")}
                />
                <ViewButton
                  active={activeView === "users"}
                  icon={Users}
                  label="Хэрэглэгчдийн хүснэгт"
                  onClick={() => openView("users")}
                />
                <ViewButton
                  active={activeView === "news"}
                  icon={PenLine}
                  label="Нийтлэл бичих"
                  onClick={() => openView("news")}
                />
              </div>
            </section>

            {activeView === "manage" ? (
              <section className="ad-card motion-ink-up p-5 sm:p-7">
                <div className="mb-6 space-y-2">
                  <p className="ad-eyebrow">Одоо байгаа манга</p>
                  <h2 className="ad-h2">Гарчиг, тайлбар, төлөв, постер засах</h2>
                  <p className="ad-sub">
                    Нүүр хуудас болон дэлгэрэнгүй хуудасны постерыг тусад нь
                    сольж болно.
                  </p>
                </div>

                {selectedManga ? (
                  <UploadRegistryContext.Provider value={manageRegistry}>
                  <form
                    key={selectedManga.id}
                    action={manageFormAction}
                    className="space-y-6"
                  >
                    <input type="hidden" name="mangaId" value={selectedManga.id} />

                    <SelectField
                      label="Манга сонгох"
                      value={selectedManga.id}
                      onChange={(event) =>
                        handleMangaSelectionChange(event.target.value)
                      }
                    >
                      {mangaLibrary.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.mangaName}
                        </option>
                      ))}
                    </SelectField>

                    <MetadataFields
                      defaults={{
                        mangaName: selectedManga.mangaName,
                        description: selectedManga.description,
                        author: selectedManga.author,
                        artist: selectedManga.artist,
                        genres: selectedManga.genres.join(", "),
                        status: selectedManga.status,
                        titleFont: selectedManga.titleFont,
                      }}
                      includeChapterFields={false}
                    />

                    <div className="grid gap-4 lg:grid-cols-2">
                      <DirectImageField
                        name="homeCoverUrl"
                        slot="home"
                        label="Нүүр хуудасны постер"
                        existingImage={
                          selectedManga.homeCoverImage || selectedManga.coverImage || null
                        }
                        helper={
                          selectedManga.homeCoverImage || selectedManga.coverImage
                            ? "Одоогийн нүүр постер хадгалагдсан."
                            : "Нүүр хуудасны картанд харагдах босоо зураг."
                        }
                      />

                      <DirectImageField
                        name="detailCoverUrl"
                        slot="detail"
                        label="Дэлгэрэнгүй хуудасны постер"
                        existingImage={
                          selectedManga.detailCoverImage || selectedManga.coverImage || null
                        }
                        helper={
                          selectedManga.detailCoverImage || selectedManga.coverImage
                            ? "Одоогийн дэлгэрэнгүй постер хадгалагдсан."
                            : "Манганы дэлгэрэнгүй хуудсанд томоор харагдана."
                        }
                      />
                    </div>
                    {selectedManga.defaultPoster ? (
                      <p className="ad-sub -mt-3">
                        Одоо постерын сангаас сонгосон үндсэн постер харагдаж
                        байна. Энд шинэ постер оруулж хадгалвал тэр нь
                        солигдоно.
                      </p>
                    ) : null}

                    <div className="ad-soft p-4 sm:p-5">
                      <div className="mb-1 flex items-center gap-2">
                        <Sparkles size={17} style={{ color: "var(--home-gold)" }} />
                        <h3 className="ad-h3">Юмэгийн санал болгох</h3>
                      </div>
                      <p className="ad-sub">
                        Нүүр хуудасны онцлох слайдер. Зөвхөн энд сонгосон манга
                        харагдана.
                      </p>

                      <label className="ad-check mt-4">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          defaultChecked={selectedManga.isFeatured}
                          className="mt-0.5 h-4 w-4"
                        />
                        <span>Онцлох слайдерт харуулах</span>
                      </label>

                      <div className="mt-4 max-w-55">
                        <Field
                          label="Эрэмбэ (1 = эхний слайд)"
                          name="featuredOrder"
                          type="number"
                          min={1}
                          step={1}
                          placeholder="1"
                          defaultValue={selectedManga.featuredOrder ?? ""}
                        />
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div>
                          <ImageEditorField
                            name="featuredImageMobile"
                            slot="featured-mobile"
                            label="Гар утас (1:1)"
                            helper="Манганы доторх нэг хэсгийг 1:1-ээр тайрна. Утсан дээрх слайдерт харагдана."
                            existingImage={selectedManga.featuredImageMobile || null}
                            presets={FEATURED_MOBILE_PRESETS}
                            previewAspect="1 / 1"
                          />
                          {selectedManga.featuredImageMobile ? (
                            <label className="ad-check mt-3">
                              <input
                                type="checkbox"
                                name="removeFeaturedMobile"
                                className="mt-0.5 h-4 w-4"
                              />
                              <span>Гар утасны зургийг хасах</span>
                            </label>
                          ) : null}
                        </div>
                        <div>
                          <ImageEditorField
                            name="featuredImageDesktop"
                            slot="featured-desktop"
                            label="Компьютер (16:9)"
                            helper="Манганы доторх нэг хэсгийг 16:9-өөр тайрна. Компьютер дээрх слайдерт харагдана."
                            existingImage={selectedManga.featuredImageDesktop || null}
                            presets={FEATURED_DESKTOP_PRESETS}
                            previewAspect="16 / 9"
                            maxOutputDimension={1920}
                          />
                          {selectedManga.featuredImageDesktop ? (
                            <label className="ad-check mt-3">
                              <input
                                type="checkbox"
                                name="removeFeaturedDesktop"
                                className="mt-0.5 h-4 w-4"
                              />
                              <span>Компьютерын зургийг хасах</span>
                            </label>
                          ) : null}
                        </div>
                      </div>
                      <p className="ad-sub mt-3">
                        Нэг нь хоосон бол нөгөө зургийг, хоёулаа хоосон бол
                        постерыг ашиглана. Эдгээр зураг дэлгэрэнгүй хуудасны
                        постерт нөлөөлөхгүй.
                      </p>

                      {featuredSummary.length > 0 ? (
                        <p className="ad-sub mt-4">
                          Одоогийн дараалал:{" "}
                          <span style={{ color: "var(--home-plum)" }}>
                            {featuredSummary
                              .map(
                                (entry, index) =>
                                  `${entry.featuredOrder ?? index + 1}. ${entry.mangaName}`,
                              )
                              .join(" · ")}
                          </span>
                        </p>
                      ) : (
                        <p className="ad-sub mt-4">
                          Одоогоор нэг ч манга онцлогдоогүй байна — слайдер
                          харагдахгүй.
                        </p>
                      )}
                    </div>

                    <div className="ad-soft p-4 sm:p-5">
                      <div className="mb-1 flex items-center gap-2">
                        <Megaphone
                          size={17}
                          style={{ color: "var(--home-gold)" }}
                        />
                        <h3 className="ad-h3">Зар сурталчилгааны баннер</h3>
                      </div>
                      <p className="ad-sub">
                        Нүүр хуудасны 3:1 харьцаатай баннер. Нүүр хуудсанд
                        дөрвөн байрлал бий, байрлал бүрт нэг баннер. Байрлал
                        сонгоогүй баннер хадгалагдах боловч харагдахгүй.
                        Онцлох слайдераас тусдаа.
                      </p>

                      <div className="mt-4">
                        <DirectImageField
                          name="promoImageUrl"
                          slot="promo"
                          label="Баннер зураг (3:1)"
                          previewAspect="3 / 1"
                          helper={
                            selectedManga.promoImageUrl
                              ? "Одоогийн баннерыг солих бол шинэ зураг сонгоно уу."
                              : "Өргөн, 3:1 харьцаатай зураг сонгоно уу."
                          }
                        />
                      </div>

                      {selectedManga.promoImageUrl ? (
                        <>
                          <div
                            className="mt-4 overflow-hidden rounded-xl border"
                            style={{
                              borderColor: "var(--home-line)",
                              aspectRatio: "3 / 1",
                            }}
                          >
                            <img
                              src={selectedManga.promoImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <label className="ad-check mt-3">
                            <input
                              type="checkbox"
                              name="removePromoImage"
                              className="mt-0.5 h-4 w-4"
                            />
                            <span>Баннерыг хасах</span>
                          </label>
                        </>
                      ) : null}

                      <div className="mt-4">
                        <SelectField
                          label="Нүүр хуудасны байрлал"
                          name="promoSlot"
                          value={pickedPromoSlot ?? ""}
                          onChange={(event) =>
                            setPromoSlotChoice({
                              mangaId: selectedManga.id,
                              slot: event.target.value
                                ? Number(event.target.value)
                                : null,
                            })
                          }
                        >
                          <option value="">Харуулахгүй</option>
                          {[1, 2, 3, 4].map((slot) => {
                            const holder = promoSlotHolders.get(slot);
                            const occupant =
                              holder && holder.id !== selectedManga.id
                                ? ` (эзэлсэн: ${holder.mangaName})`
                                : "";

                            return (
                              <option key={slot} value={slot}>
                                {slot} — {PROMO_SLOT_LABELS[slot]}
                                {occupant}
                              </option>
                            );
                          })}
                        </SelectField>
                      </div>

                      {promoSlotTaken && pickedSlotHolder ? (
                        <div className="ad-banner ad-banner-err mt-3">
                          <AlertCircle size={17} className="mt-0.5 shrink-0" />
                          <div className="space-y-2">
                            <p>
                              {pickedPromoSlot}-р байрлалд &ldquo;
                              {pickedSlotHolder.mangaName}&rdquo; баннер байна.
                            </p>
                            <label className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                name="swapPromoSlot"
                                className="mt-1 h-4 w-4"
                              />
                              <span>
                                Байрлалыг солих —{" "}
                                {selectedManga.promoSlot
                                  ? `"${pickedSlotHolder.mangaName}" ${selectedManga.promoSlot}-р байрлал руу шилжинэ.`
                                  : `"${pickedSlotHolder.mangaName}" байрлалгүй болж, харагдахгүй болно.`}
                              </span>
                            </label>
                          </div>
                        </div>
                      ) : null}

                      <p className="ad-sub mt-4">
                        Одоогийн байрлал:{" "}
                        <span style={{ color: "var(--home-plum)" }}>
                          {[1, 2, 3, 4]
                            .map(
                              (slot) =>
                                `${slot}. ${promoSlotHolders.get(slot)?.mangaName ?? "—"}`,
                            )
                            .join(" · ")}
                        </span>
                      </p>
                    </div>

                    <div className="ad-soft p-4 sm:p-5">
                      <div className="mb-1 flex items-center gap-2">
                        <Gift size={17} style={{ color: "var(--home-gold)" }} />
                        <h3 className="ad-h3">Бэлэг background</h3>
                      </div>
                      <p className="ad-sub">
                        Зураг тохируулсан манга л бэлэг өгнө. Энэ манганы
                        нийтлэгдсэн бүх бүлгийг уншиж дуусгасан нэвтэрсэн
                        уншигч энэ background-ыг нэг удаа авч, МЭДЭЭ-нд мэдэгдэл
                        очно.
                      </p>

                      <div className="mt-4">
                        <DirectImageField
                          name="rewardBackgroundUrl"
                          slot="reward"
                          keepOriginal={{
                            name: "rewardBackgroundOriginalUrl",
                            slot: "reward-original",
                          }}
                          label="Бэлэг background"
                          previewAspect="9 / 16"
                          existingImage={selectedManga.rewardBackgroundUrl || null}
                          helper={
                            selectedManga.rewardBackgroundUrl
                              ? "Солих бол шинэ зураг сонгоно уу. Өмнө нь авсан уншигчдад хуучин зураг нь үлдэнэ."
                              : "Босоо зураг тохиромжтой. Эх файл нь татаж авахад зориулж хадгалагдана."
                          }
                        />
                      </div>

                      {selectedManga.rewardBackgroundUrl ? (
                        <>
                          <p className="ad-sub mt-3">
                            Одоогоор{" "}
                            <span style={{ color: "var(--home-plum)", fontWeight: 600 }}>
                              {selectedManga.rewardCount}
                            </span>{" "}
                            уншигч энэ бэлгийг авсан.
                          </p>
                          <label className="ad-check mt-3">
                            <input
                              type="checkbox"
                              name="removeRewardBackground"
                              className="mt-0.5 h-4 w-4"
                            />
                            <span>
                              Бэлэг background-ыг хасах (авсан уншигчдад үлдэнэ)
                            </span>
                          </label>
                        </>
                      ) : null}
                    </div>

                    <div className="ad-soft p-4 sm:p-5">
                      <div className="mb-1 flex items-center gap-2">
                        <Lock size={16} style={{ color: "var(--home-gold)" }} />
                        <h3 className="ad-h3">Түгжээтэй бүлгийн тоо</h3>
                      </div>
                      <p className="ad-sub">
                        Хамгийн сүүлийн хэдэн бүлгийг зөвхөн багцтай уншигчдад
                        нээх вэ. Хоосон орхивол сайтын үндсэн тохиргоо (
                        {PAYWALLED_LATEST_CHAPTERS}) хэрэглэнэ. 0 бол түгжээгүй.
                      </p>
                      <div className="mt-4 max-w-55">
                        <Field
                          label={`Сүүлийн бүлгүүд (0–${MAX_PAYWALLED_LATEST_CHAPTERS})`}
                          name="paywalledChapters"
                          type="number"
                          min={0}
                          max={MAX_PAYWALLED_LATEST_CHAPTERS}
                          step={1}
                          placeholder={String(PAYWALLED_LATEST_CHAPTERS)}
                          defaultValue={selectedManga.paywalledChapters ?? ""}
                        />
                      </div>
                    </div>

                    <div className="ad-soft flex flex-wrap gap-x-8 gap-y-2 p-4 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                      <span>
                        Одоогийн бүлгийн тоо:{" "}
                        <span style={{ color: "var(--home-plum)", fontWeight: 600 }}>
                          {selectedManga.chapterCount}
                        </span>
                      </span>
                      <span>
                        Нийт үзэлт:{" "}
                        <span style={{ color: "var(--home-plum)", fontWeight: 600 }}>
                          {selectedManga.viewCount.toLocaleString()}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="submit"
                        disabled={managePending || manageUploads.preparing > 0}
                        className="ad-btn ad-btn-primary w-full sm:w-auto"
                      >
                        <PencilLine size={17} />
                        Манга хадгалах
                      </button>
                      {manageUploads.progress !== null ||
                      manageUploads.preparing > 0 ? (
                        <UploadProgressNote registry={manageRegistry} />
                      ) : managePending ? (
                        <p className="ad-sub">Манганы мэдээллийг хадгалж байна...</p>
                      ) : null}
                    </div>
                    <FormStatus state={manageState} />
                  </form>
                  </UploadRegistryContext.Provider>
                ) : null}

                {selectedManga ? (
                  <div className="ad-soft mt-6 p-4 sm:p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <FileImage size={17} style={{ color: "var(--home-gold)" }} />
                      <h3 className="ad-h3">Постер сан</h3>
                    </div>
                    <p className="ad-sub">
                      Энэ манганы постерууд. Дарж үндсэн постерыг сонгоно —
                      үндсэн постер нүүр болон дэлгэрэнгүй хуудсанд харагдана.
                    </p>
                    {selectedManga.posterOptions.length === 0 ? (
                      <p className="ad-sub mt-3">
                        Одоогоор постер алга. Доороос бүлгийн зураг сонгох
                        эсвэл шинэ постер оруулна уу.
                      </p>
                    ) : null}
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                      <form action={defaultPosterFormAction}>
                        <input type="hidden" name="mangaId" value={selectedManga.id} />
                        <input type="hidden" name="posterUrl" value="" />
                        <button
                          type="submit"
                          disabled={defaultPosterPending}
                          aria-label="Автомат (анхны хавтас)"
                          style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: "3 / 4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 12,
                            cursor: "pointer",
                            padding: 0,
                            background: "var(--home-paper-2)",
                            border: !selectedManga.defaultPoster
                              ? "2px solid var(--home-rose-deep)"
                              : "1px solid var(--home-line)",
                            boxShadow: !selectedManga.defaultPoster
                              ? "0 0 0 3px color-mix(in srgb, var(--home-rose) 40%, transparent)"
                              : "none",
                            color: "var(--home-plum-soft)",
                            fontFamily: "'Marcellus', serif",
                            fontSize: 10,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                          }}
                        >
                          Авто
                        </button>
                      </form>

                      {selectedManga.posterOptions.map((url, index) => {
                        const active = selectedManga.defaultPoster === url;

                        return (
                          <div
                            key={`${url}-${index}`}
                            style={{ position: "relative" }}
                          >
                          <form action={defaultPosterFormAction}>
                            <input type="hidden" name="mangaId" value={selectedManga.id} />
                            <input type="hidden" name="posterUrl" value={url} />
                            <button
                              type="submit"
                              disabled={defaultPosterPending}
                              aria-label={`Постер ${index + 1}`}
                              style={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: "3 / 4",
                                overflow: "hidden",
                                borderRadius: 12,
                                cursor: "pointer",
                                padding: 0,
                                background: "var(--home-paper-2)",
                                border: active
                                  ? "2px solid var(--home-rose-deep)"
                                  : "1px solid var(--home-line)",
                                boxShadow: active
                                  ? "0 0 0 3px color-mix(in srgb, var(--home-rose) 40%, transparent)"
                                  : "none",
                              }}
                            >
                              <img
                                src={url}
                                alt={`Постер ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                              {active ? (
                                <span
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 22,
                                    height: 22,
                                    borderRadius: 999,
                                    color: "#fff",
                                    background: "var(--home-rose-deep)",
                                  }}
                                >
                                  <Check size={13} />
                                </span>
                              ) : null}
                            </button>
                          </form>

                          <form action={removePosterFormAction}>
                            <input type="hidden" name="mangaId" value={selectedManga.id} />
                            <input type="hidden" name="posterUrl" value={url} />
                            <button
                              type="submit"
                              disabled={removePosterPending}
                              aria-label={`Постер ${index + 1}-ийг хасах`}
                              title="Сангаас хасах"
                              style={{
                                position: "absolute",
                                bottom: 4,
                                right: 4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 22,
                                height: 22,
                                borderRadius: 999,
                                padding: 0,
                                cursor: "pointer",
                                color: "#fff",
                                background: "rgba(40, 24, 32, 0.72)",
                                border: "1px solid rgba(255, 255, 255, 0.35)",
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </form>
                          </div>
                        );
                      })}
                    </div>
                    {defaultPosterState.message ? (
                      <p
                        className="mt-3 text-sm font-medium"
                        style={{
                          color: defaultPosterState.ok ? "#3f7d57" : "#c44d66",
                        }}
                      >
                        {defaultPosterState.message}
                      </p>
                    ) : null}
                    {removePosterState.message ? (
                      <p
                        className="mt-2 text-sm font-medium"
                        style={{
                          color: removePosterState.ok ? "#3f7d57" : "#c44d66",
                        }}
                      >
                        {removePosterState.message}
                      </p>
                    ) : null}

                    <div
                      className="mt-6 pt-5"
                      style={{ borderTop: "1px solid var(--home-line)" }}
                    >
                      <h4 className="ad-h3">Постер нэмэх</h4>
                      <p className="ad-sub">
                        Байгаа бүлгийн зургаас сонгох, эсвэл зөвхөн постерт
                        зориулсан шинэ зураг оруулах.
                      </p>

                      <form
                        action={addPosterFormAction}
                        className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]"
                      >
                        <input
                          type="hidden"
                          name="mangaId"
                          value={selectedManga.id}
                        />
                        <input
                          type="hidden"
                          name="posterUrl"
                          value={posterSourceUrl}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <SelectField
                            label="Бүлэг"
                            value={posterSourceChapterId}
                            onChange={(event) => {
                              const chapter = selectedManga.chapters.find(
                                (entry) => entry.id === event.target.value,
                              );

                              setPosterSourceChapterId(event.target.value);
                              // Its pages load on demand; until then the
                              // thumbnail is the only choice.
                              setPosterSourceUrl(chapter?.coverImage || "");
                              if (chapter) {
                                void loadChapterPages(chapter.id);
                              }
                            }}
                          >
                            <option value="">— Бүлэг сонгох —</option>
                            {selectedManga.chapters.map((chapter) => (
                              <option key={chapter.id} value={chapter.id}>
                                Бүлэг {chapter.chapterNumber}
                                {chapter.title ? ` • ${chapter.title}` : ""}
                              </option>
                            ))}
                          </SelectField>

                          <SelectField
                            label="Зураг"
                            value={posterSourceUrl}
                            disabled={posterSourceImages.length === 0}
                            onChange={(event) =>
                              setPosterSourceUrl(event.target.value)
                            }
                          >
                            <option value="">
                              {posterSourceChapter && posterSourcePages === undefined
                                ? "Хуудсуудыг ачаалж байна..."
                                : "— Зураг сонгох —"}
                            </option>
                            {posterSourceImages.map((image) => (
                              <option key={image.url} value={image.url}>
                                {image.label}
                              </option>
                            ))}
                          </SelectField>
                        </div>

                        <div className="flex items-end gap-3">
                          {posterSourceUrl ? (
                            <img
                              src={posterSourceUrl}
                              alt="Сонгосон зураг"
                              style={{
                                width: 66,
                                aspectRatio: "3 / 4",
                                objectFit: "cover",
                                borderRadius: 10,
                                border: "1px solid var(--home-line)",
                              }}
                            />
                          ) : null}
                          <button
                            type="submit"
                            disabled={addPosterPending || !posterSourceUrl}
                            className="ad-btn ad-btn-primary"
                          >
                            <FileImage size={16} />
                            Санд нэмэх
                          </button>
                        </div>
                      </form>

                      {addPosterState.message ? (
                        <p
                          className="mt-3 text-sm font-medium"
                          style={{
                            color: addPosterState.ok ? "#3f7d57" : "#c44d66",
                          }}
                        >
                          {addPosterState.message}
                        </p>
                      ) : null}

                      <UploadRegistryContext.Provider value={posterUploadRegistry}>
                      <form
                        key={`poster-upload-${selectedManga.id}`}
                        action={uploadPosterFormAction}
                        className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"
                      >
                        <input
                          type="hidden"
                          name="mangaId"
                          value={selectedManga.id}
                        />
                        <DirectImageField
                          name="posterUrl"
                          slot="poster"
                          label="Тусгай постер оруулах"
                          helper="Бүлгийн зурагтай хамааралгүй, зөвхөн постерт зориулсан босоо зураг."
                        />
                        <div className="flex flex-col gap-3">
                          <label className="ad-check">
                            <input
                              type="checkbox"
                              name="makeDefault"
                              defaultChecked
                              className="mt-0.5 h-4 w-4"
                            />
                            <span>Үндсэн постер болгох</span>
                          </label>
                          <button
                            type="submit"
                            disabled={
                              uploadPosterPending ||
                              posterUploads.preparing > 0 ||
                              posterUploads.count === 0
                            }
                            className="ad-btn ad-btn-primary"
                          >
                            <CloudUpload size={16} />
                            Постер оруулах
                          </button>
                        </div>
                      </form>
                      <UploadProgressNote registry={posterUploadRegistry} />
                      </UploadRegistryContext.Provider>

                      {uploadPosterState.message ? (
                        <p
                          className="mt-3 text-sm font-medium"
                          style={{
                            color: uploadPosterState.ok ? "#3f7d57" : "#c44d66",
                          }}
                        >
                          {uploadPosterState.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="ad-dashed p-5 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                    Одоогоор манга алга. Эхлээд манга оруулаад дараа нь эндээс
                    засна.
                  </div>
                )}
              </section>
            ) : null}

            {activeView === "chapters" ? (
              <section className="ad-card motion-ink-up p-5 sm:p-7">
                <div className="mb-6 space-y-2">
                  <p className="ad-eyebrow">Бүлгийн удирдлага</p>
                  <h2 className="ad-h2">Бүлэг, зураг, дараалал засах</h2>
                  <p className="ad-sub">
                    Уншигч хуудасны дарааллыг өсөх{" "}
                    <span style={{ color: "var(--home-plum)", fontWeight: 600 }}>
                      pageNumber
                    </span>
                    -оор харуулна. Эндээс бүлгийн нэр, дугаар, thumbnail болон
                    хуудсуудыг засна.
                  </p>
                </div>

                {selectedManga ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        label="Манга сонгох"
                        value={selectedManga.id}
                        onChange={(event) =>
                          handleMangaSelectionChange(event.target.value)
                        }
                      >
                        {mangaLibrary.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.mangaName}
                          </option>
                        ))}
                      </SelectField>

                      <SelectField
                        label="Бүлэг сонгох"
                        value={selectedChapter?.id ?? ""}
                        onChange={(event) =>
                          handleChapterSelectionChange(event.target.value)
                        }
                        disabled={!selectedManga.chapters.length}
                      >
                        {selectedManga.chapters.length === 0 ? (
                          <option value="">Бүлэг алга</option>
                        ) : null}
                        {selectedManga.chapters.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            Бүлэг {entry.chapterNumber}
                            {entry.title ? ` • ${entry.title}` : ""}
                          </option>
                        ))}
                      </SelectField>
                    </div>

                    {selectedChapter ? (
                      <>
                        <div className="ad-soft p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="ad-eyebrow">Одоогийн бүлэг</p>
                              <h3 className="ad-h3 mt-2">
                                Бүлэг {selectedChapter.chapterNumber}
                                {selectedChapter.title
                                  ? ` • ${selectedChapter.title}`
                                  : ""}
                              </h3>
                            </div>
                            <div className="ad-chip">
                              {selectedChapter.pageCount} хуудас •{" "}
                              {new Date(
                                selectedChapter.publishedAt,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <UploadRegistryContext.Provider value={chapterMetaRegistry}>
                        <form
                          key={selectedChapter.id}
                          action={chapterMetaFormAction}
                          className="ad-soft p-4 sm:p-5"
                        >
                          <input
                            type="hidden"
                            name="chapterId"
                            value={selectedChapter.id}
                          />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label="Бүлгийн дугаар"
                              name="chapterNumber"
                              type="number"
                              step="0.1"
                              min="0.1"
                              required
                              defaultValue={selectedChapter.chapterNumber}
                            />
                            <Field
                              label="Бүлгийн нэр"
                              name="chapterTitle"
                              placeholder="Бүлгийн нэр"
                              defaultValue={selectedChapter.title}
                            />
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <ImageEditorField
                              name="chapterCoverUrl"
                              slot="cover"
                              label="Бүлгийн thumbnail"
                              helper="Зургаа тайрч, эргүүлж, өнгө тохируулаад хадгална. Сүүлийн шинэчлэлийн картанд 3:4-өөр харагдана."
                              existingImage={selectedChapter.coverImage || null}
                            />

                            <DirectImageField
                              name="chapterBadgeUrl"
                              slot="badge"
                              label="Тусгай тэмдэг (PNG)"
                              accept="image/png,image/webp,image/*"
                              previewAspect="1 / 1"
                              existingImage={selectedChapter.badgeImage || null}
                              helper={
                                selectedChapter.badgeImage
                                  ? "Дугаарын оронд харагдах тэмдэг хадгалагдсан."
                                  : "Дугаарын оронд харагдах PNG зураг. Тунгалаг дэвсгэр дэмжинэ."
                              }
                            />
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label>
                              <span className="ad-label">Тэмдгийн хэмжээ (%)</span>
                              <input
                                type="number"
                                name="badgeScale"
                                min={20}
                                max={100}
                                step={5}
                                defaultValue={selectedChapter.badgeScale ?? 85}
                                className="ad-input"
                              />
                            </label>
                            {selectedChapter.badgeImage ? (
                              <label className="ad-check self-end">
                                <input
                                  type="checkbox"
                                  name="removeBadge"
                                  className="mt-0.5 h-4 w-4"
                                />
                                Тэмдгийг устгаж, дугаар руу буцаах
                              </label>
                            ) : null}
                          </div>

                          <div className="mt-4">
                            <YumeCommentField
                              defaultValue={selectedChapter.yumeComment}
                            />
                          </div>

                          <div className="mt-4 flex justify-end">
                            <button
                              type="submit"
                              disabled={
                                chapterMetaPending || chapterMetaUploads.preparing > 0
                              }
                              className="ad-btn ad-btn-primary"
                            >
                              <PencilLine size={17} />
                              Бүлэг хадгалах
                            </button>
                          </div>
                          <div className="mt-3">
                            {chapterMetaUploads.progress !== null ||
                            chapterMetaUploads.preparing > 0 ? (
                              <UploadProgressNote registry={chapterMetaRegistry} />
                            ) : chapterMetaPending ? (
                              <p className="ad-sub">
                                Бүлгийн мэдээллийг хадгалж байна...
                              </p>
                            ) : null}
                          </div>
                          <FormStatus state={chapterMetaState} />
                        </form>
                        </UploadRegistryContext.Provider>

                        <div className="space-y-3">
                          {selectedChapterPagesEntry === "error" ? (
                            <div className="ad-banner ad-banner-err">
                              <AlertCircle size={17} className="mt-0.5 shrink-0" />
                              <div>
                                <p>Хуудсуудыг ачаалж чадсангүй.</p>
                                <button
                                  type="button"
                                  className="ad-btn ad-btn-line mt-3"
                                  onClick={() =>
                                    loadChapterPages(selectedChapter.id, true)
                                  }
                                >
                                  Дахин ачаалах
                                </button>
                              </div>
                            </div>
                          ) : !selectedChapterPages ? (
                            <p className="ad-sub">
                              {selectedChapter.pageCount} хуудсыг ачаалж байна...
                            </p>
                          ) : null}
                          {pageDraft.map((page, index) => (
                            <div key={page.id} className="ad-page">
                              <div className="flex items-center gap-3">
                                <div className="ad-thumb flex h-16 w-12 shrink-0">
                                  <img
                                    src={page.imageUrl}
                                    alt={`Page ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="ad-inforow-label">
                                    Хуудасны байрлал
                                  </p>
                                  <p
                                    className="mt-1 text-base font-semibold"
                                    style={{ color: "var(--home-plum)" }}
                                  >
                                    #{index + 1}
                                  </p>
                                  <p
                                    className="mt-1 truncate text-xs"
                                    style={{ color: "var(--home-plum-soft)" }}
                                  >
                                    Хадгалсан дугаар: {page.pageNumber}
                                  </p>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                  <button
                                    type="button"
                                    aria-label={`${index + 1}-р хуудсыг дээш зөөх`}
                                    title="Дээш"
                                    onClick={() =>
                                      updatePageDraft((current) =>
                                        moveDraftItem(current, index, index - 1),
                                      )
                                    }
                                    disabled={index === 0}
                                    className="ad-icon-btn"
                                  >
                                    <MoveUp size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`${index + 1}-р хуудсыг доош зөөх`}
                                    title="Доош"
                                    onClick={() =>
                                      updatePageDraft((current) =>
                                        moveDraftItem(current, index, index + 1),
                                      )
                                    }
                                    disabled={index === pageDraft.length - 1}
                                    className="ad-icon-btn"
                                  >
                                    <MoveDown size={16} />
                                  </button>
                                </div>
                              </div>

                              <div
                                className="mt-4 grid gap-2 pt-3 lg:grid-cols-[minmax(0,1fr)_auto]"
                                style={{ borderTop: "1px solid var(--home-line)" }}
                              >
                                <form
                                  action={pageImageFormAction}
                                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                                >
                                  <input
                                    type="hidden"
                                    name="pageId"
                                    value={page.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="chapterId"
                                    value={selectedChapter.id}
                                  />
                                  <PageReplacementPicker
                                    registry={pageImageRegistry}
                                    pageId={page.id}
                                    fileName={replacementFileNames[page.id]}
                                    onPicked={(fileName) =>
                                      handleReplacementPicked(page.id, fileName)
                                    }
                                  />
                                  <button
                                    type="submit"
                                    disabled={pageImagePending}
                                    className="ad-btn ad-btn-line"
                                  >
                                    <CloudUpload size={16} />
                                    Солих
                                  </button>
                                </form>

                                <form action={pageDeleteFormAction}>
                                  <input
                                    type="hidden"
                                    name="pageId"
                                    value={page.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="chapterId"
                                    value={selectedChapter.id}
                                  />
                                  <button
                                    type="submit"
                                    disabled={pageDeletePending}
                                    className="ad-btn ad-btn-danger w-full"
                                  >
                                    <Trash2 size={16} />
                                    Устгах
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>

                        <form action={chapterOrderFormAction} className="space-y-4">
                          <input
                            type="hidden"
                            name="chapterId"
                            value={selectedChapter.id}
                          />
                          <input
                            type="hidden"
                            name="pageOrder"
                            value={JSON.stringify(
                              pageDraft.map((page) => page.id),
                            )}
                          />

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                              type="submit"
                              disabled={chapterOrderPending || !selectedChapterPages}
                              className="ad-btn ad-btn-primary w-full sm:w-auto"
                            >
                              <GripVertical size={17} />
                              Дараалал хадгалах
                            </button>
                            {chapterOrderPending ? (
                              <p className="ad-sub">
                                Хуудасны дарааллыг шинэчилж байна...
                              </p>
                            ) : null}
                            {pageImagePending ? (
                              <p className="ad-sub">Сонгосон хуудсыг сольж байна...</p>
                            ) : null}
                            {pageDeletePending ? (
                              <p className="ad-sub">
                                Хуудсыг устгаж, дугаарлаж байна...
                              </p>
                            ) : null}
                          </div>
                        </form>

                        <form action={chapterDeleteFormAction} className="space-y-4">
                          <input
                            type="hidden"
                            name="chapterId"
                            value={selectedChapter.id}
                          />
                          <div className="ad-danger-box">
                            <p className="ad-danger-eyebrow">Устгах үйлдэл</p>
                            <p
                              className="mt-2 text-sm leading-6"
                              style={{ color: "var(--home-plum)" }}
                            >
                              Энэ бүлгийг устгавал Neon дахь мөр болон R2 дахь
                              хуудасны файлууд устна. Манга өөрөө үлдэнэ.
                            </p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                              <button
                                type="submit"
                                disabled={chapterDeletePending}
                                className="ad-btn ad-btn-danger w-full sm:w-auto"
                              >
                                <Trash2 size={17} />
                                Энэ бүлгийг устгах
                              </button>
                              {chapterDeletePending ? (
                                <p className="ad-sub">
                                  Бүлэг болон R2 файлуудыг устгаж байна...
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="ad-dashed p-5 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                        Энэ мангад одоогоор бүлэг алга.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ad-dashed p-5 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                    Одоогоор манга алга. Эхлээд манга оруулаад бүлгүүдийг нь
                    эндээс засна.
                  </div>
                )}
              </section>
            ) : null}

            {activeView === "upload" ? (
              <section className="ad-card motion-ink-up p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-2">
                  <p className="ad-eyebrow">Гараар оруулах</p>
                  <h2 className="ad-h2">
                    Local файлаас манга, бүлэг, хуудсууд үүсгэх
                  </h2>
                </div>

                <UploadRegistryContext.Provider value={manualRegistry}>
                <form action={manualFormAction} className="space-y-6">
                  <MetadataFields />

                  <div className="grid gap-4 lg:grid-cols-2">
                    <DirectImageField
                      name="coverImageUrl"
                      slot="manga-cover"
                      label="Постер зураг"
                      helper="Сонголттой. JPG, PNG, WEBP."
                    />

                    <DirectPagesField
                      name="pageUrls"
                      label="Бүлгийн хуудсууд"
                      helper="Заавал. Унших дарааллаар бүх хуудсаа сонгоно."
                    />

                    <ImageEditorField
                      name="chapterCoverUrl"
                      slot="chapter-cover"
                      label="Бүлгийн thumbnail"
                      helper="Сонголттой. Сүүлийн шинэчлэлийн картанд харагдана — оруулахгүй бол эхний хуудас харагдана."
                    />
                  </div>

                  <YumeCommentField />

                  <div className="ad-soft p-4 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                    Зургууд таны төхөөрөмжөөс шууд Cloudflare R2 руу орж, зөвхөн
                    холбоос нь Neon-д хадгалагдана.
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SubmitButton
                      pending={manualPending || manualUploads.preparing > 0}
                    />
                    {manualUploads.progress !== null ? (
                      <UploadProgressNote registry={manualRegistry} />
                    ) : manualPending ? (
                      <p className="ad-sub">
                        Хуудсуудыг upload хийж, DB-д бичиж байна...
                      </p>
                    ) : null}
                  </div>
                  <FormStatus state={manualState} />
                </form>
                </UploadRegistryContext.Provider>
              </section>
            ) : null}

            {activeView === "drive" ? (
              <section className="ad-card motion-ink-up p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-2">
                  <p className="ad-eyebrow">Google Drive импорт</p>
                  <h2 className="ad-h2">Google Drive хавтсаас шууд татах</h2>
                  <p className="ad-sub">
                    Хавтсаа Google service account имэйлтэй share хийгээд URL эсвэл
                    ID-г энд оруулна.
                  </p>
                </div>

                <UploadRegistryContext.Provider value={driveRegistry}>
                <form action={driveFormAction} className="space-y-6">
                  <input
                    type="hidden"
                    name="driveImportMode"
                    value={driveImportMode}
                  />

                  <SelectField
                    label="Импортын горим"
                    value={driveImportMode}
                    onChange={(event) => {
                      setDriveImportMode(event.target.value as DriveImportMode);
                      // Bulk mode has no chapter cover field; drop any parked one.
                      driveRegistry.reset();
                    }}
                  >
                    <option value="new_manga_from_chapter">
                      Нэг бүлгийн хавтсаас шинэ манга үүсгэх
                    </option>
                    <option value="existing_manga_chapter">
                      Одоо байгаа мангад бүлэг нэмэх
                    </option>
                    <option value="bulk_parent_folder">
                      Дотроо бүлгийн хавтастай parent folder импортлох
                    </option>
                  </SelectField>

                  {driveImportMode === "existing_manga_chapter" ? (
                    <>
                      <SelectField
                        label="Одоо байгаа манга"
                        name="existingMangaId"
                        defaultValue={selectedManga?.id ?? ""}
                      >
                        <option value="" disabled>
                          Манга сонгох
                        </option>
                        {mangaLibrary.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.mangaName}
                          </option>
                        ))}
                      </SelectField>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Бүлгийн дугаар"
                          name="chapterNumber"
                          type="number"
                          placeholder="2"
                          step="0.1"
                          min="0.1"
                          required
                        />
                        <Field
                          label="Бүлгийн нэр"
                          name="chapterTitle"
                          placeholder="Шинэ бүлгийн нэр"
                        />
                      </div>
                    </>
                  ) : null}

                  {driveImportMode === "new_manga_from_chapter" ? (
                    <MetadataFields />
                  ) : null}

                  {driveImportMode === "bulk_parent_folder" ? (
                    <MetadataFields includeChapterFields={false} />
                  ) : null}

                  <Field
                    label="Drive хавтасны URL эсвэл ID"
                    name="driveFolder"
                    placeholder="https://drive.google.com/drive/folders/..."
                    required
                  />

                  {driveImportMode !== "bulk_parent_folder" ? (
                    <>
                      <ImageEditorField
                        name="chapterCoverUrl"
                        slot="chapter-cover"
                        label="Бүлгийн thumbnail"
                        helper="Сонголттой. Сүүлийн шинэчлэлийн картанд харагдана — оруулахгүй бол эхний хуудас харагдана."
                      />
                      <YumeCommentField />
                    </>
                  ) : null}

                  <label className="ad-check">
                    <input
                      type="checkbox"
                      name="useFirstPageAsCover"
                      defaultChecked
                      className="mt-0.5 h-4 w-4"
                    />
                    <span>
                      Google Drive-ийн эхний зургийг манганы постер болгох.
                    </span>
                  </label>

                  <div className="ad-soft p-4 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                    {driveImportMode === "bulk_parent_folder"
                      ? "Энд parent manga хавтсаа ашиглана. Доторх subfolder бүр нэг бүлэг байна."
                      : driveImportMode === "existing_manga_chapter"
                        ? "Энд нэг бүлгийн хавтас ашиглана. Зургууд нь сонгосон мангад шинэ бүлэг болж нэмэгдэнэ."
                        : "Энд нэг бүлгийн хавтас ашиглаж шинэ манга болон эхний бүлгийг үүсгэнэ."}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <DriveSubmitButton
                      pending={drivePending || driveUploads.preparing > 0}
                    />
                    {driveUploads.progress !== null ? (
                      <UploadProgressNote registry={driveRegistry} />
                    ) : drivePending ? (
                      <p className="ad-sub">
                        Drive-аас зураг татаж R2-д хадгалж байна...
                      </p>
                    ) : null}
                  </div>
                  <FormStatus state={driveState} />
                </form>
                </UploadRegistryContext.Provider>
              </section>
            ) : null}

            {activeView === "analytics" ? (
              <ViewAnalyticsPanel
                series={mangaLibrary.map((entry) => ({
                  id: entry.id,
                  mangaName: entry.mangaName,
                  viewCount: entry.viewCount,
                  chapterCount: entry.chapterCount,
                }))}
              />
            ) : null}

            {activeView === "users" ? <UsersTablePanel /> : null}

            {activeView === "news" ? <NewsPanel /> : null}
          </div>

          <aside className="space-y-6">
            <section className="ad-card-glass motion-ink-up motion-ink-up-delay-2 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="ad-eyebrow">Хандалтын эрх</p>
                  <h3 className="ad-h3 mt-2">Админ баталгаажуулалт</h3>
                </div>
                <UserRound style={{ color: "var(--home-gold)" }} size={20} />
              </div>
              <div className="space-y-4">
                <InfoRow label="Имэйл" value={dbUser.email} />
                <InfoRow
                  label="Нэр"
                  value={dbUser.username ?? "Clerk дээр нэр тохируулаагүй"}
                />
                <InfoRow label="Эрх" value={dbUser.role} />
                <InfoRow
                  label="Үүссэн"
                  value={new Date(dbUser.createdAt).toLocaleDateString()}
                />
              </div>
            </section>

            <section className="ad-card-glass motion-ink-up motion-ink-up-delay-3 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="ad-eyebrow">Сүүлийн манга</p>
                  <h3 className="ad-h3 mt-2">Шинээр нэмэгдсэн мөрүүд</h3>
                </div>
                <Layers3 style={{ color: "var(--home-gold)" }} size={20} />
              </div>
              <div className="space-y-3">
                {recentManga.length > 0 ? (
                  recentManga.map((entry) => (
                    <div key={entry.id} className="ad-recent">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className="font-medium"
                            style={{
                              color: "var(--home-plum)",
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: 17,
                            }}
                          >
                            {entry.mangaName}
                          </p>
                          <p className="ad-inforow-label mt-1">
                            {getStatusLabel(entry.status)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <div className="ad-chip">
                            {entry.chapterCount} бүлэг
                          </div>
                          <div className="ad-chip">
                            {entry.viewCount.toLocaleString()} үзэлт
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ad-dashed p-4 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                    Одоогоор манга алга. Эхний upload хийсний дараа энд гарна.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Only fonts that actually contain the Mongolian alphabet (Ө Ү included; see
// FONT_FAMILY_FALLBACKS in MangaPosterCard). Each replaces an old option of a
// similar style that had no Cyrillic and so never showed on a title.
const TITLE_FONT_OPTIONS = [
  { value: "", label: "Үндсэн (Cormorant Garamond)" },
  { value: "Pangolin", label: "Pangolin (комик)" },
  { value: "Caveat", label: "Caveat (гар бичмэл)" },
  { value: "Oswald", label: "Oswald (нарийн тод)" },
  { value: "Rubik Mono One", label: "Rubik Mono One (өргөн)" },
  { value: "Oi", label: "Oi (маш тод)" },
  { value: "Rubik Wet Paint", label: "Rubik Wet Paint (аймшгийн)" },
  { value: "Rubik Glitch", label: "Rubik Glitch" },
  { value: "PT Mono", label: "PT Mono (бичгийн машин)" },
  { value: "Lobster", label: "Lobster" },
  { value: "Yeseva One", label: "Yeseva One" },
  { value: "Rubik", label: "Rubik" },
];

function MetadataFields({
  defaults,
  includeChapterFields = true,
}: {
  defaults?: {
    mangaName?: string;
    description?: string;
    author?: string;
    artist?: string;
    genres?: string;
    status?: string;
    titleFont?: string;
  };
  includeChapterFields?: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Манганы нэр"
          name="mangaName"
          placeholder="Omniscient Reader"
          required
          defaultValue={defaults?.mangaName}
        />
        <SelectField
          label="Төлөв"
          name="status"
          defaultValue={defaults?.status ?? "ONGOING"}
        >
          <option value="ONGOING">Гарч байгаа</option>
          <option value="COMPLETED">Дууссан</option>
          <option value="CATCHING_UP">Орчуулж гүйцэж байна</option>
          <option value="STOPPED">Зогссон</option>
        </SelectField>
        <Field
          label="Зохиолч"
          name="author"
          placeholder="Зохиолчийн нэр"
          defaultValue={defaults?.author}
        />
        <Field
          label="Зураач"
          name="artist"
          placeholder="Зураачийн нэр"
          defaultValue={defaults?.artist}
        />

        {includeChapterFields ? (
          <>
            <Field
              label="Бүлгийн дугаар"
              name="chapterNumber"
              type="number"
              placeholder="1"
              step="0.1"
              min="0.1"
              required
            />
            <Field label="Бүлгийн нэр" name="chapterTitle" placeholder="Эхлэл" />
          </>
        ) : null}
      </div>

      <TextAreaField
        label="Тайлбар"
        name="description"
        placeholder="Манганы товч тайлбар..."
        defaultValue={defaults?.description}
      />

      <TextAreaField
        label="Төрлүүд"
        name="genres"
        placeholder="Action, Fantasy, Romance"
        rows={3}
        defaultValue={defaults?.genres}
      />

      <SelectField
        label="Нүүр хуудасны нэрийн фонт"
        name="titleFont"
        defaultValue={defaults?.titleFont ?? ""}
      >
        {TITLE_FONT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
    </>
  );
}

function ViewButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof PencilLine;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ad-tab${active ? " ad-tab-active" : ""}`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function SubmitButton({ pending }: { pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="ad-btn ad-btn-gold w-full sm:w-auto"
    >
      <CloudUpload size={17} />
      R2 руу upload хийж Neon-д хадгалах
    </button>
  );
}

function DriveSubmitButton({ pending }: { pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="ad-btn ad-btn-primary w-full sm:w-auto"
    >
      <FolderSync size={17} />
      Drive хавтас импортлох
    </button>
  );
}

function Field(
  props: InputHTMLAttributes<HTMLInputElement> & {
    label: string;
  },
) {
  const { label, ...inputProps } = props;

  return (
    <label className="block">
      <span className="ad-label">{label}</span>
      <input {...inputProps} className="ad-input" />
    </label>
  );
}

function SelectField(
  props: SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    children: ReactNode;
  },
) {
  const { label, children, ...selectProps } = props;

  return (
    <label className="block">
      <span className="ad-label">{label}</span>
      <select {...selectProps} className="ad-select">
        {children}
      </select>
    </label>
  );
}

function TextAreaField(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
  },
) {
  const { label, rows = 4, ...textareaProps } = props;

  return (
    <label className="block">
      <span className="ad-label">{label}</span>
      <textarea {...textareaProps} rows={rows} className="ad-textarea" />
    </label>
  );
}

/**
 * "Юүмэгийн сэтгэгдэл": Yume's note in a speech bubble after the chapter's
 * last page. Empty = no bubble. Line breaks are kept as typed.
 */
function YumeCommentField({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <div>
      <TextAreaField
        label="Юүмэгийн сэтгэгдэл"
        name="yumeComment"
        rows={3}
        maxLength={600}
        defaultValue={defaultValue}
        placeholder="Жишээ: Виолаг хэзээ нэгэн цагт Сарчесыг тооно гэдэгт би итгэдэг."
      />
      <p className="ad-sub mt-2">
        Бүлгийн сүүлийн хуудасны дараа Юүмэгийн хөөсөнд харагдана. Хоосон
        орхивол харагдахгүй. Мөр шилжилт хадгалагдана.
      </p>
    </div>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="ad-tile">
      <div className="mb-3 flex items-center gap-3">
        <span className="ad-tile-ico">
          <Icon size={17} />
        </span>
        <p className="ad-inforow-label">{label}</p>
      </div>
      <p className="ad-tile-val">{value}</p>
      <p className="mt-1 text-sm" style={{ color: "var(--home-plum-soft)" }}>
        {detail}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ad-inforow">
      <span className="ad-inforow-label">{label}</span>
      <span className="ad-inforow-value">{value}</span>
    </div>
  );
}

function moveDraftItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function getChapterPageSignature(
  chapterId: string | undefined,
  pages: PageDraftItem[] | null,
) {
  if (!chapterId || !pages) {
    return `pending:${chapterId ?? "none"}`;
  }

  const pageSignature = pages
    .map((page) => `${page.id}:${page.pageNumber}:${page.imageUrl}`)
    .join("|");

  return `${chapterId}:${pageSignature}`;
}

function getSortedPages(pages: PageDraftItem[]) {
  return [...pages].sort((left, right) => left.pageNumber - right.pageNumber);
}

/**
 * The result of a form's last save, shown next to its button. On a phone the
 * page-top banner is far out of view by the time you reach "save".
 */
function FormStatus({ state }: { state: AdminActionState }) {
  if (!state.message) {
    return null;
  }

  const Icon = state.ok ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={`ad-banner mt-4 ${state.ok ? "ad-banner-ok" : "ad-banner-err"}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p>{state.message}</p>
    </div>
  );
}

/**
 * Picks a replacement for one page and parks it (untouched, full quality)
 * under that page's own registry group, so each row's "Солих" sends only its
 * own file.
 */
function PageReplacementPicker({
  registry,
  pageId,
  fileName,
  onPicked,
}: {
  registry: UploadRegistry;
  pageId: string;
  fileName: string | undefined;
  onPicked: (fileName: string | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-w-0">
      <label
        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-2xl px-3 py-3 text-sm transition"
        style={{
          border: "1px solid var(--home-line)",
          background: "var(--home-paper)",
          color: "var(--home-plum)",
        }}
      >
        <FileImage
          size={16}
          className="shrink-0"
          style={{ color: "var(--home-gold)" }}
        />
        <span className="truncate">{fileName ?? "Солих зураг сонгох"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (!file) {
              return;
            }

            const contentType =
              file.type ||
              (/\.png$/i.test(file.name)
                ? "image/png"
                : /\.webp$/i.test(file.name)
                  ? "image/webp"
                  : "image/jpeg");

            if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(contentType)) {
              setError("Зөвхөн JPG, PNG, WEBP, GIF, AVIF зураг оруулна.");
              return;
            }

            setError(null);
            registry.set(`page:${pageId}`, [
              {
                field: "pageImageUrl",
                slot: "page",
                blob: file,
                contentType,
                fileName: file.name,
              },
            ]);
            onPicked(file.name);
          }}
        />
      </label>
      {error ? (
        <p className="mt-1 text-xs" style={{ color: "#9c4a59" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function getStatusLabel(status: MangaStatusValue) {
  const labels: Record<MangaStatusValue, string> = {
    ONGOING: "Гарч байгаа",
    COMPLETED: "Дууссан",
    CATCHING_UP: "Орчуулж гүйцэж байна",
    STOPPED: "Зогссон",
  };

  return labels[status];
}
