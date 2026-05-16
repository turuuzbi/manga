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
  CheckCircle2,
  CloudUpload,
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
  importGoogleDriveFolderAction,
  ingestMangaAction,
  reorderChapterPagesAction,
  replaceChapterPageImageAction,
  updateChapterMetadataAction,
  updateMangaMetadataAction,
  type AdminActionState,
} from "@/app/admin/actions";

const initialAdminActionState: AdminActionState = {
  ok: false,
  message: "",
};

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
    genres: string[];
    chapterCount: number;
    chapters: Array<{
      id: string;
      chapterNumber: number;
      title: string;
      coverImage: string;
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
  const [coverName, setCoverName] = useState("");
  const [homeCoverName, setHomeCoverName] = useState("");
  const [detailCoverName, setDetailCoverName] = useState("");
  const [chapterCoverName, setChapterCoverName] = useState("");
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
      ? {
          icon: CheckCircle2,
          className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        }
      : {
          icon: AlertCircle,
          className: "border-red-500/30 bg-red-500/10 text-red-200",
        };
  }, [activeState]);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_26%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-300 transition hover:border-orange-400/40 hover:text-white"
              >
                <ArrowLeft size={14} />
                Нүүр рүү буцах
              </Link>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-5xl">
                  Манга, бүлэг, зураг, постерыг нэг дор удирдана.
                </h1>
                <p className="max-w-2xl text-[12px] leading-6 text-zinc-400 sm:text-base">
                  Эндээс мэдээлэл засах, зураг солих, бүлэг шинэчлэх, Drive-аас
                  импортлох үйлдлүүдийг хийж болно.
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
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${statusTone.className}`}
          >
            <statusTone.icon size={18} className="mt-0.5 shrink-0" />
            <p>{activeState.message}</p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-[#111114]/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-5">
              <div className="grid gap-3 sm:grid-cols-3">
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
              <section className="rounded-[28px] border border-white/10 bg-[#111114]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-7">
                <div className="mb-6 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
                    Одоо байгаа манга
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Гарчиг, тайлбар, төлөв, постерыг засах
                  </h2>
                  <p className="text-sm leading-6 text-zinc-400">
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
                    <input
                      type="hidden"
                      name="mangaId"
                      value={selectedManga.id}
                    />

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
                            setHomeCoverName(
                              event.target.files?.[0]?.name ?? "",
                            )
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

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
                      Одоогийн бүлгийн тоо:{" "}
                      <span className="font-semibold text-zinc-200">
                        {selectedManga.chapterCount}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                      >
                        <PencilLine size={18} />
                        Манга хадгалах
                      </button>
                      {managePending ? (
                        <p className="text-sm text-zinc-400">
                          Манганы мэдээллийг хадгалж байна...
                        </p>
                      ) : null}
                    </div>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
                    Одоогоор манга алга. Эхлээд манга оруулаад дараа нь эндээс
                    засна.
                  </div>
                )}
              </section>
            ) : null}

            {activeView === "chapters" ? (
              <section className="rounded-[28px] border border-white/10 bg-[#111114]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-7">
                <div className="mb-6 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
                    Бүлгийн удирдлага
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Бүлэг, зураг, дарааллыг засах
                  </h2>
                  <p className="text-sm leading-6 text-zinc-400">
                    Уншигч хуудасны дарааллыг өсөх{" "}
                    <span className="font-semibold text-zinc-200">
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
                        <div className="rounded-3xl border border-white/10 bg-black/30 p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                Одоогийн бүлэг
                              </p>
                              <h3 className="mt-2 text-xl font-semibold text-white">
                                Бүлэг {selectedChapter.chapterNumber}
                                {selectedChapter.title
                                  ? ` • ${selectedChapter.title}`
                                  : ""}
                              </h3>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                              {selectedChapter.pageCount} хуудас •{" "}
                              {new Date(
                                selectedChapter.publishedAt,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <form
                          action={chapterMetaFormAction}
                          encType="multipart/form-data"
                          className="rounded-3xl border border-white/10 bg-black/25 p-4 sm:p-5"
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
                          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
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
                            <button
                              type="submit"
                              disabled={chapterMetaPending}
                              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 lg:self-end"
                            >
                              <PencilLine size={18} />
                              Бүлэг хадгалах
                            </button>
                          </div>
                          {chapterMetaPending ? (
                            <p className="mt-3 text-sm text-zinc-400">
                              Бүлгийн мэдээллийг хадгалж байна...
                            </p>
                          ) : null}
                        </form>

                        <div className="space-y-3">
                          {pageDraft.map((page, index) => (
                            <div
                              key={page.id}
                              className="rounded-3xl border border-white/10 bg-black/25 p-3 sm:p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-16 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                                  <img
                                    src={page.imageUrl}
                                    alt={`Page ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                    Хуудасны байрлал
                                  </p>
                                  <p className="mt-1 text-base font-semibold text-white">
                                    #{index + 1}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-zinc-500">
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
                                        moveDraftItem(
                                          current,
                                          index,
                                          index - 1,
                                        ),
                                      )
                                    }
                                    disabled={index === 0}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <MoveUp size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`${index + 1}-р хуудсыг доош зөөх`}
                                    title="Доош"
                                    onClick={() =>
                                      updatePageDraft((current) =>
                                        moveDraftItem(
                                          current,
                                          index,
                                          index + 1,
                                        ),
                                      )
                                    }
                                    disabled={index === pageDraft.length - 1}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <MoveDown size={16} />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-2 border-t border-white/5 pt-3 lg:grid-cols-[minmax(0,1fr)_auto]">
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
                                  <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-300 transition hover:bg-white/10">
                                    <FileImage
                                      size={16}
                                      className="shrink-0 text-zinc-400"
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
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/15 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/25 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Trash2 size={16} />
                                    Устгах
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>

                        <form
                          action={chapterOrderFormAction}
                          className="space-y-4"
                        >
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
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                            >
                              <GripVertical size={18} />
                              Дараалал хадгалах
                            </button>
                            {chapterOrderPending ? (
                              <p className="text-sm text-zinc-400">
                                Хуудасны дарааллыг шинэчилж байна...
                              </p>
                            ) : null}
                            {pageImagePending ? (
                              <p className="text-sm text-zinc-400">
                                Сонгосон хуудсыг сольж байна...
                              </p>
                            ) : null}
                            {pageDeletePending ? (
                              <p className="text-sm text-zinc-400">
                                Хуудсыг устгаж, дугаарлаж байна...
                              </p>
                            ) : null}
                          </div>
                        </form>

                        <form
                          action={chapterDeleteFormAction}
                          className="space-y-4"
                        >
                          <input
                            type="hidden"
                            name="chapterId"
                            value={selectedChapter.id}
                          />
                          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 sm:p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-200/80">
                              Устгах үйлдэл
                            </p>
                            <p className="mt-2 text-sm leading-6 text-red-100/85">
                              Энэ бүлгийг устгавал Neon дахь мөр болон R2 дахь
                              хуудасны файлууд устна. Манга өөрөө үлдэнэ.
                            </p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                              <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-red-300"
                              >
                                <Trash2 size={18} />
                                Энэ бүлгийг устгах
                              </button>
                              {chapterDeletePending ? (
                                <p className="text-sm text-red-100/80">
                                  Бүлэг болон R2 файлуудыг устгаж байна...
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
                        Энэ мангад одоогоор бүлэг алга.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
                    Одоогоор манга алга. Эхлээд манга оруулаад бүлгүүдийг нь
                    эндээс засна.
                  </div>
                )}
              </section>
            ) : null}

            {activeView === "upload" ? (
              <section className="rounded-[28px] border border-white/10 bg-[#111114]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-7">
                <div className="mb-6 flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
                    Гараар оруулах
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
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

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
                    Файлууд эхлээд Cloudflare R2 руу орж, public URL нь
                    Prisma-аар Neon-д хадгалагдана.
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SubmitButton />
                    {manualPending ? (
                      <p className="text-sm text-zinc-400">
                        Хуудсуудыг upload хийж, DB-д бичиж байна...
                      </p>
                    ) : null}
                  </div>
                </form>
              </section>
            ) : null}

            {activeView === "drive" ? (
              <section className="rounded-[28px] border border-white/10 bg-[#111114]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-7">
                <div className="mb-6 flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
                    Google Drive импорт
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Google Drive хавтсаас шууд татах
                  </h2>
                  <p className="text-sm leading-6 text-zinc-400">
                    Хавтсаа Google service account имэйлтэй share хийгээд URL
                    эсвэл ID-г энд оруулна.
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

                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      name="useFirstPageAsCover"
                      defaultChecked
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-orange-400"
                    />
                    <span>
                      Google Drive-ийн эхний зургийг манганы постер болгох.
                    </span>
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
                    {driveImportMode === "bulk_parent_folder"
                      ? "Энд parent manga хавтсаа ашиглана. Доторх subfolder бүр нэг бүлэг байна."
                      : driveImportMode === "existing_manga_chapter"
                        ? "Энд нэг бүлгийн хавтас ашиглана. Зургууд нь сонгосон мангад шинэ бүлэг болж нэмэгдэнэ."
                        : "Энд нэг бүлгийн хавтас ашиглаж шинэ манга болон эхний бүлгийг үүсгэнэ."}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <DriveSubmitButton />
                    {drivePending ? (
                      <p className="text-sm text-zinc-400">
                        Drive-аас зураг татаж R2-д хадгалж байна...
                      </p>
                    ) : null}
                  </div>
                </form>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    Хандалтын эрх
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Админ баталгаажуулалт
                  </h3>
                </div>
                <UserRound className="text-zinc-500" size={20} />
              </div>
              <div className="space-y-4 text-sm text-zinc-300">
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

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    Сүүлийн манга
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Шинээр нэмэгдсэн мөрүүд
                  </h3>
                </div>
                <Layers3 className="text-zinc-500" size={20} />
              </div>
              <div className="space-y-3">
                {recentManga.length > 0 ? (
                  recentManga.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">
                            {entry.mangaName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">
                            {getStatusLabel(entry.status)}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                          {entry.chapterCount} бүлэг
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-zinc-400">
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
            <Field
              label="Бүлгийн нэр"
              name="chapterTitle"
              placeholder="Эхлэл"
            />
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
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-orange-400/50 bg-orange-500/10 text-orange-200"
          : "border-white/10 bg-black/30 text-zinc-300 hover:bg-black/40"
      }`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function SubmitButton() {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f97316] px-5 py-4 text-sm font-semibold text-black transition hover:bg-[#fb923c]"
    >
      <CloudUpload size={18} />
      R2 руу upload хийж Neon-д хадгалах
    </button>
  );
}

function DriveSubmitButton() {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-sky-300"
    >
      <FolderSync size={18} />
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
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {label}
      </span>
      <input
        {...inputProps}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/50 focus:bg-black/60"
      />
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
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {label}
      </span>
      <select
        {...selectProps}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400/50 focus:bg-black/60"
      >
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
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {label}
      </span>
      <textarea
        {...textareaProps}
        rows={rows}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/50 focus:bg-black/60"
      />
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
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {label}
      </span>
      <div className="group relative rounded-[24px] border border-dashed border-white/15 bg-black/30 p-5 transition hover:border-orange-400/40 hover:bg-black/40">
        {children}
        <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 p-3 text-zinc-200">
            <FileImage size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Зураг сонгох</p>
            <p className="mt-1 text-xs text-zinc-500">{helper}</p>
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
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-zinc-200">
          <Icon size={18} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          {label}
        </p>
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-zinc-400">{detail}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
        {label}
      </span>
      <span className="max-w-[65%] text-right text-sm text-zinc-200">
        {value}
      </span>
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
