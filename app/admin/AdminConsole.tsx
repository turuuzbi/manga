"use client";

import Link from "next/link";
import {
  useActionState,
  useMemo,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CloudUpload,
  Crown,
  Database,
  GripVertical,
  FileImage,
  FolderSync,
  Layers3,
  MoveDown,
  MoveUp,
  PencilLine,
  Trash2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  deleteChapterAction,
  deleteChapterPageAction,
  grantSubscriptionAction,
  importGoogleDriveFolderAction,
  ingestMangaAction,
  reorderChapterPagesAction,
  replaceChapterPageImageAction,
  setDefaultPosterAction,
  updateChapterMetadataAction,
  updateMangaMetadataAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { PLANS, PLAN_ORDER, formatTugrug } from "@/lib/plans";

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
  | "FINISHED_RELEASING"
  | "HIATUS";

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
    posterOptions: string[];
    defaultPoster: string;
    genres: string[];
    chapterCount: number;
    chapters: Array<{
      id: string;
      chapterNumber: number;
      title: string;
      coverImage: string;
      badgeImage: string;
      badgeScale: number | null;
      publishedAt: string;
      pageCount: number;
      pages: Array<{
        id: string;
        pageNumber: number;
        imageUrl: string;
      }>;
    }>;
  }>;
};

type AdminView = "manage" | "chapters" | "upload" | "drive";
type DriveImportMode =
  | "new_manga_from_chapter"
  | "existing_manga_chapter"
  | "bulk_parent_folder";
type ChapterOption =
  AdminConsoleProps["mangaLibrary"][number]["chapters"][number];
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
  const [manualState, manualFormAction, manualPending] = useActionState<
    AdminActionState,
    FormData
  >(ingestMangaAction, initialAdminActionState);
  const [driveState, driveFormAction, drivePending] = useActionState<
    AdminActionState,
    FormData
  >(importGoogleDriveFolderAction, initialAdminActionState);
  const [manageState, manageFormAction, managePending] = useActionState<
    AdminActionState,
    FormData
  >(updateMangaMetadataAction, initialAdminActionState);
  const [chapterOrderState, chapterOrderFormAction, chapterOrderPending] =
    useActionState<AdminActionState, FormData>(
      reorderChapterPagesAction,
      initialAdminActionState,
    );
  const [chapterDeleteState, chapterDeleteFormAction, chapterDeletePending] =
    useActionState<AdminActionState, FormData>(
      deleteChapterAction,
      initialAdminActionState,
    );
  const [chapterMetaState, chapterMetaFormAction, chapterMetaPending] =
    useActionState<AdminActionState, FormData>(
      updateChapterMetadataAction,
      initialAdminActionState,
    );
  const [pageImageState, pageImageFormAction, pageImagePending] =
    useActionState<AdminActionState, FormData>(
      replaceChapterPageImageAction,
      initialAdminActionState,
    );
  const [pageDeleteState, pageDeleteFormAction, pageDeletePending] =
    useActionState<AdminActionState, FormData>(
      deleteChapterPageAction,
      initialAdminActionState,
    );
  const [grantState, grantFormAction, grantPending] =
    useActionState<AdminActionState, FormData>(
      grantSubscriptionAction,
      initialAdminActionState,
    );
  const [defaultPosterState, defaultPosterFormAction, defaultPosterPending] =
    useActionState<AdminActionState, FormData>(
      setDefaultPosterAction,
      initialAdminActionState,
    );
  const [coverName, setCoverName] = useState("");
  const [homeCoverName, setHomeCoverName] = useState("");
  const [detailCoverName, setDetailCoverName] = useState("");
  const [chapterCoverName, setChapterCoverName] = useState("");
  const [chapterBadgeName, setChapterBadgeName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [driveImportMode, setDriveImportMode] = useState<DriveImportMode>(
    "new_manga_from_chapter",
  );
  const initialChapterSignature = getChapterPageSignature(initialChapter);
  const [replacementFileState, setReplacementFileState] = useState<{
    signature: string;
    names: Record<string, string>;
  }>({
    signature: initialChapterSignature,
    names: {},
  });
  const [pageDraftState, setPageDraftState] = useState<{
    signature: string;
    pages: PageDraftItem[];
  }>({
    signature: initialChapterSignature,
    pages: initialChapter ? getSortedPages(initialChapter) : [],
  });

  const selectedManga =
    mangaLibrary.find((entry) => entry.id === selectedMangaId) ??
    mangaLibrary[0] ??
    null;
  const selectedChapter =
    selectedManga?.chapters.find((entry) => entry.id === selectedChapterId) ??
    selectedManga?.chapters[0] ??
    null;
  const selectedChapterPageSignature = getChapterPageSignature(selectedChapter);
  const pageDraft =
    pageDraftState.signature === selectedChapterPageSignature
      ? pageDraftState.pages
      : selectedChapter
        ? getSortedPages(selectedChapter)
        : [];
  const replacementFileNames =
    replacementFileState.signature === selectedChapterPageSignature
      ? replacementFileState.names
      : {};

  const resetPageEditDraft = (chapter: ChapterOption | null) => {
    const signature = getChapterPageSignature(chapter);

    setPageDraftState({
      signature,
      pages: chapter ? getSortedPages(chapter) : [],
    });
    setReplacementFileState({
      signature,
      names: {},
    });
    setChapterCoverName("");
    setChapterBadgeName("");
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
    setHomeCoverName("");
    setDetailCoverName("");
    resetPageEditDraft(nextChapter);
  };

  const handleChapterSelectionChange = (chapterId: string) => {
    const nextChapter =
      selectedManga?.chapters.find((entry) => entry.id === chapterId) ?? null;

    setSelectedChapterId(chapterId);
    resetPageEditDraft(nextChapter);
  };

  const handleReplacementFileChange = (
    pageId: string,
    files: FileList | null,
  ) => {
    setReplacementFileState((current) => {
      const nextNames =
        current.signature === selectedChapterPageSignature
          ? { ...current.names }
          : {};
      const fileName = files?.[0]?.name;

      if (fileName) {
        nextNames[pageId] = fileName;
      } else {
        delete nextNames[pageId];
      }

      return {
        signature: selectedChapterPageSignature,
        names: nextNames,
      };
    });
  };

  const activeState = driveState.message
    ? driveState
    : manualState.message
      ? manualState
      : pageDeleteState.message
        ? pageDeleteState
        : pageImageState.message
          ? pageImageState
          : chapterMetaState.message
            ? chapterMetaState
            : chapterDeleteState.message
              ? chapterDeleteState
              : chapterOrderState.message
                ? chapterOrderState
                : manageState;

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
      <style>{ADMIN_STYLES}</style>

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

        <section className="ad-card motion-ink-up p-4 sm:p-5">
          <div className="mb-1 flex items-center gap-2">
            <Crown size={17} style={{ color: "var(--home-gold)" }} />
            <h2 className="ad-h3">Premium гараар олгох</h2>
          </div>
          <p className="ad-sub max-w-2xl">
            И-мэйлээр хэрэглэгчид багц идэвхжүүлнэ. Дахин олговол хугацаа сунадаг.
            (QPay холбогдох хүртэл туршилт болон бэлэглэлд.)
          </p>
          <form
            action={grantFormAction}
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="хэрэглэгчийн и-мэйл"
              className="ad-input"
            />
            <select name="plan" defaultValue="ONE_MONTH" className="ad-input">
              {PLAN_ORDER.map((key) => (
                <option key={key} value={key}>
                  {PLANS[key].label} — {formatTugrug(PLANS[key].price)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={grantPending}
              className="ad-btn ad-btn-primary"
            >
              <Crown size={16} />
              {grantPending ? "Олгож байна..." : "Олгох"}
            </button>
          </form>
          {grantState.message ? (
            <p
              className="mt-3 text-sm font-medium"
              style={{ color: grantState.ok ? "#3f7d57" : "#c44d66" }}
            >
              {grantState.message}
            </p>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="ad-card motion-ink-up motion-ink-up-delay-1 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ViewButton
                  active={activeView === "manage"}
                  icon={PencilLine}
                  label="Манга засах"
                  onClick={() => setActiveView("manage")}
                />
                <ViewButton
                  active={activeView === "upload"}
                  icon={CloudUpload}
                  label="Гараар оруулах"
                  onClick={() => setActiveView("upload")}
                />
                <ViewButton
                  active={activeView === "chapters"}
                  icon={GripVertical}
                  label="Бүлгүүд"
                  onClick={() => setActiveView("chapters")}
                />
                <ViewButton
                  active={activeView === "drive"}
                  icon={FolderSync}
                  label="Drive импорт"
                  onClick={() => setActiveView("drive")}
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
                  <form
                    key={selectedManga.id}
                    action={manageFormAction}
                    encType="multipart/form-data"
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
                      <UploadField
                        label="Нүүр хуудасны постер"
                        helper={
                          homeCoverName ||
                          (selectedManga.homeCoverImage ||
                          selectedManga.coverImage
                            ? "Одоогийн нүүр постер хадгалагдсан."
                            : "Нүүр хуудасны картанд харагдах босоо зураг.")
                        }
                      >
                        <input
                          type="file"
                          name="homeCoverImage"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            setHomeCoverName(event.target.files?.[0]?.name ?? "")
                          }
                        />
                      </UploadField>

                      <UploadField
                        label="Дэлгэрэнгүй хуудасны постер"
                        helper={
                          detailCoverName ||
                          (selectedManga.detailCoverImage ||
                          selectedManga.coverImage
                            ? "Одоогийн дэлгэрэнгүй постер хадгалагдсан."
                            : "Манганы дэлгэрэнгүй хуудсанд томоор харагдана.")
                        }
                      >
                        <input
                          type="file"
                          name="detailCoverImage"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            setDetailCoverName(
                              event.target.files?.[0]?.name ?? "",
                            )
                          }
                        />
                      </UploadField>
                    </div>

                    <div className="ad-soft p-4 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                      Одоогийн бүлгийн тоо:{" "}
                      <span style={{ color: "var(--home-plum)", fontWeight: 600 }}>
                        {selectedManga.chapterCount}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="submit"
                        disabled={managePending}
                        className="ad-btn ad-btn-primary w-full sm:w-auto"
                      >
                        <PencilLine size={17} />
                        Манга хадгалах
                      </button>
                      {managePending ? (
                        <p className="ad-sub">Манганы мэдээллийг хадгалж байна...</p>
                      ) : null}
                    </div>
                  </form>
                ) : null}

                {selectedManga && selectedManga.posterOptions.length > 0 ? (
                  <div className="ad-soft mt-6 p-4 sm:p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <FileImage size={17} style={{ color: "var(--home-gold)" }} />
                      <h3 className="ad-h3">Үндсэн постер</h3>
                    </div>
                    <p className="ad-sub">
                      Хэрэглэгч өөрөө сонгоогүй үед харагдах постер. Дарж сонгоно.
                    </p>
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
                          <form key={`${url}-${index}`} action={defaultPosterFormAction}>
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
                  </div>
                ) : selectedManga ? (
                  <div
                    className="ad-dashed mt-6 p-4 text-sm"
                    style={{ color: "var(--home-plum-soft)" }}
                  >
                    Энэ мангад постер сонголт алга.
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

                        <form
                          key={selectedChapter.id}
                          action={chapterMetaFormAction}
                          encType="multipart/form-data"
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
                            <UploadField
                              label="Бүлгийн thumbnail"
                              helper={
                                chapterCoverName ||
                                (selectedChapter.coverImage
                                  ? "Одоогийн thumbnail хадгалагдсан."
                                  : "Бүлгийн жагсаалтад харагдах зураг.")
                              }
                            >
                              <input
                                type="file"
                                name="chapterCoverImage"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  setChapterCoverName(
                                    event.target.files?.[0]?.name ?? "",
                                  )
                                }
                              />
                            </UploadField>

                            <UploadField
                              label="Тусгай тэмдэг (PNG)"
                              helper={
                                chapterBadgeName ||
                                (selectedChapter.badgeImage
                                  ? "Дугаарын оронд харагдах тэмдэг хадгалагдсан."
                                  : "Дугаарын оронд харагдах PNG зураг. Тунгалаг дэвсгэр дэмжинэ.")
                              }
                            >
                              <input
                                type="file"
                                name="chapterBadgeImage"
                                accept="image/png,image/webp,image/*"
                                className="hidden"
                                onChange={(event) =>
                                  setChapterBadgeName(
                                    event.target.files?.[0]?.name ?? "",
                                  )
                                }
                              />
                            </UploadField>
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

                          <div className="mt-4 flex justify-end">
                            <button
                              type="submit"
                              disabled={chapterMetaPending}
                              className="ad-btn ad-btn-primary"
                            >
                              <PencilLine size={17} />
                              Бүлэг хадгалах
                            </button>
                          </div>
                          {chapterMetaPending ? (
                            <p className="ad-sub mt-3">
                              Бүлгийн мэдээллийг хадгалж байна...
                            </p>
                          ) : null}
                        </form>

                        <div className="space-y-3">
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
                                  encType="multipart/form-data"
                                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                                >
                                  <input
                                    type="hidden"
                                    name="pageId"
                                    value={page.id}
                                  />
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
                                    <span className="truncate">
                                      {replacementFileNames[page.id] ??
                                        "Солих зураг сонгох"}
                                    </span>
                                    <input
                                      type="file"
                                      name="pageImage"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(event) =>
                                        handleReplacementFileChange(
                                          page.id,
                                          event.target.files,
                                        )
                                      }
                                    />
                                  </label>
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
                              disabled={chapterOrderPending}
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

                <form action={manualFormAction} className="space-y-6">
                  <MetadataFields />

                  <div className="grid gap-4 lg:grid-cols-2">
                    <UploadField
                      label="Постер зураг"
                      helper={coverName || "Сонголттой. JPG, PNG, WEBP."}
                    >
                      <input
                        type="file"
                        name="coverImage"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          setCoverName(event.target.files?.[0]?.name ?? "")
                        }
                      />
                    </UploadField>

                    <UploadField
                      label="Бүлгийн хуудсууд"
                      helper={
                        pageCount > 0
                          ? `${pageCount} файл upload-д бэлэн`
                          : "Заавал. Унших дарааллаар бүх хуудсаа сонгоно."
                      }
                    >
                      <input
                        type="file"
                        name="pages"
                        multiple
                        accept="image/*"
                        className="hidden"
                        required
                        onChange={(event) =>
                          setPageCount(event.target.files?.length ?? 0)
                        }
                      />
                    </UploadField>
                  </div>

                  <div className="ad-soft p-4 text-sm" style={{ color: "var(--home-plum-soft)" }}>
                    Файлууд эхлээд Cloudflare R2 руу орж, public URL нь Prisma-аар
                    Neon-д хадгалагдана.
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SubmitButton pending={manualPending} />
                    {manualPending ? (
                      <p className="ad-sub">
                        Хуудсуудыг upload хийж, DB-д бичиж байна...
                      </p>
                    ) : null}
                  </div>
                </form>
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

                <form action={driveFormAction} className="space-y-6">
                  <input
                    type="hidden"
                    name="driveImportMode"
                    value={driveImportMode}
                  />

                  <SelectField
                    label="Импортын горим"
                    value={driveImportMode}
                    onChange={(event) =>
                      setDriveImportMode(event.target.value as DriveImportMode)
                    }
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
                    <DriveSubmitButton pending={drivePending} />
                    {drivePending ? (
                      <p className="ad-sub">
                        Drive-аас зураг татаж R2-д хадгалж байна...
                      </p>
                    ) : null}
                  </div>
                </form>
              </section>
            ) : null}
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
                        <div className="ad-chip shrink-0">
                          {entry.chapterCount} бүлэг
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

const TITLE_FONT_OPTIONS = [
  { value: "", label: "Үндсэн (Bangers)" },
  { value: "Bangers", label: "Bangers" },
  { value: "Permanent Marker", label: "Permanent Marker" },
  { value: "Anton", label: "Anton" },
  { value: "Bungee", label: "Bungee" },
  { value: "Bowlby One", label: "Bowlby One" },
  { value: "Creepster", label: "Creepster" },
  { value: "Black Ops One", label: "Black Ops One" },
  { value: "Special Elite", label: "Special Elite" },
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
          <option value="FINISHED_RELEASING">Эх хувилбар дууссан</option>
          <option value="HIATUS">Завсарласан</option>
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

function UploadField({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="ad-label">{label}</span>
      <div className="ad-upload group">
        {children}
        <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
          <div className="ad-upload-ico">
            <FileImage size={20} />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--home-plum)" }}
            >
              Зураг сонгох
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--home-plum-soft)" }}>
              {helper}
            </p>
          </div>
        </div>
      </div>
    </label>
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
  chapter: {
    id?: string;
    pages: PageDraftItem[];
  } | null,
) {
  if (!chapter) {
    return "no-chapter";
  }

  const pageSignature = chapter.pages
    .map((page) => `${page.id}:${page.pageNumber}:${page.imageUrl}`)
    .join("|");

  return `${chapter.id ?? "chapter"}:${pageSignature}`;
}

function getSortedPages(chapter: { pages: PageDraftItem[] }) {
  return [...chapter.pages].sort(
    (left, right) => left.pageNumber - right.pageNumber,
  );
}

function getStatusLabel(status: MangaStatusValue) {
  const labels: Record<MangaStatusValue, string> = {
    ONGOING: "Гарч байгаа",
    COMPLETED: "Дууссан",
    CATCHING_UP: "Орчуулж гүйцэж байна",
    FINISHED_RELEASING: "Эх хувилбар дууссан",
    HIATUS: "Завсарласан",
  };

  return labels[status];
}
