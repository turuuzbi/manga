"use client";

import { useActionState, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Database,
  FileImage,
  Layers3,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  importGoogleDriveFolderAction,
  ingestMangaAction,
  type AdminActionState,
} from "@/app/admin/actions";

const initialAdminActionState: AdminActionState = {
  ok: false,
  message: "",
};

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
    status: "ONGOING" | "COMPLETED" | "HIATUS";
    chapterCount: number;
  }>;
};

function SubmitButton() {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f97316] px-5 py-4 text-sm font-semibold text-black transition hover:bg-[#fb923c]"
    >
      <CloudUpload size={18} />
      Upload To R2 And Save To Neon
    </button>
  );
}

function DriveSubmitButton() {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-sky-300"
    >
      <CloudUpload size={18} />
      Import Drive Folder
    </button>
  );
}

export function AdminConsole({
  dbUser,
  stats,
  recentManga,
}: AdminConsoleProps) {
  const [manualState, manualFormAction, manualPending] = useActionState<
    AdminActionState,
    FormData
  >(ingestMangaAction, initialAdminActionState);
  const [driveState, driveFormAction, drivePending] = useActionState<
    AdminActionState,
    FormData
  >(importGoogleDriveFolderAction, initialAdminActionState);
  const [coverName, setCoverName] = useState("");
  const [pageCount, setPageCount] = useState(0);

  const activeState = driveState.message ? driveState : manualState;

  const statusTone = useMemo(() => {
    if (!activeState.message) {
      return null;
    }

    return activeState.ok
      ? {
          icon: CheckCircle2,
          className:
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        }
      : {
          icon: AlertCircle,
          className: "border-red-500/30 bg-red-500/10 text-red-200",
        };
  }, [activeState]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.10),transparent_26%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <header className="grid gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur md:grid-cols-[1.4fr_0.9fr] md:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
              <Sparkles size={14} />
              Admin Upload Hub
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Import manga panels without the download-and-reupload grind.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Admin-only access is now enforced through your Prisma role, and
                you can ingest from local files or a Google Drive folder
                straight into R2 and Neon.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            <StatusTile
              icon={UserRound}
              label="Admin User"
              value={dbUser.email}
              detail={dbUser.username ?? "No username set in Clerk"}
            />
            <StatusTile
              icon={ShieldCheck}
              label="Current Role"
              value={dbUser.role}
              detail="Admin access confirmed"
            />
            <StatusTile
              icon={Database}
              label="Library Rows"
              value={stats.pageCount.toLocaleString()}
              detail={`${stats.mangaCount} series • ${stats.chapterCount} chapters`}
            />
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

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-[#111114]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-7">
              <div className="mb-6 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
                  Manual Upload
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  Create a manga, chapter, and page rows from local files
                </h2>
              </div>

              <form action={manualFormAction} className="space-y-6">
                <MetadataFields />

                <div className="grid gap-4 lg:grid-cols-2">
                  <UploadField
                    label="Cover Image"
                    helper={coverName || "Optional. JPG, PNG, or WEBP."}
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
                    label="Chapter Pages"
                    helper={
                      pageCount > 0
                        ? `${pageCount} files ready for upload`
                        : "Required. Select every page in reading order."
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
                  Files are uploaded to Cloudflare R2 first, then their public
                  URLs are stored in Neon through Prisma.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <SubmitButton />
                  {manualPending ? (
                    <p className="text-sm text-zinc-400">
                      Uploading pages and writing DB rows...
                    </p>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[#111114]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-7">
              <div className="mb-6 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
                  Google Drive Import
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  Pull an entire folder directly from Google Drive
                </h2>
                <p className="text-sm leading-6 text-zinc-400">
                  Share the folder with your Google service account email, then
                  paste the folder URL or ID here.
                </p>
              </div>

              <form action={driveFormAction} className="space-y-6">
                <MetadataFields />

                <Field
                  label="Drive Folder URL Or ID"
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
                  <span>Use the first Google Drive image as the manga cover.</span>
                </label>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
                  This uses the Google Drive API server-side. The folder must be
                  visible to your configured service account.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <DriveSubmitButton />
                  {drivePending ? (
                    <p className="text-sm text-zinc-400">
                      Pulling images from Drive and saving them to R2...
                    </p>
                  ) : null}
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    Access Control
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Admin verification
                  </h3>
                </div>
                <UserRound className="text-zinc-500" size={20} />
              </div>
              <div className="space-y-4 text-sm text-zinc-300">
                <InfoRow label="Email" value={dbUser.email} />
                <InfoRow
                  label="Username"
                  value={dbUser.username ?? "No username set in Clerk"}
                />
                <InfoRow label="Role" value={dbUser.role} />
                <InfoRow
                  label="Created"
                  value={new Date(dbUser.createdAt).toLocaleDateString()}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    Recent Series
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Latest ingested rows
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
                            {entry.status}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                          {entry.chapterCount} chapters
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-zinc-400">
                    No manga rows yet. Your first upload here will populate this
                    panel.
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

function MetadataFields() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Series Title"
          name="mangaName"
          placeholder="Omniscient Reader"
          required
        />
        <SelectField label="Status" name="status" defaultValue="ONGOING">
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="HIATUS">Hiatus</option>
        </SelectField>
        <Field label="Author" name="author" placeholder="Author name" />
        <Field label="Artist" name="artist" placeholder="Artist name" />
        <Field
          label="Chapter Number"
          name="chapterNumber"
          type="number"
          placeholder="1"
          step="0.1"
          min="0.1"
          required
        />
        <Field
          label="Chapter Title"
          name="chapterTitle"
          placeholder="The Beginning"
        />
      </div>

      <TextAreaField
        label="Description"
        name="description"
        placeholder="Short synopsis for the series page..."
      />

      <TextAreaField
        label="Genres"
        name="genres"
        placeholder="Action, Fantasy, Drama"
        rows={3}
      />
    </>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
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
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    children: React.ReactNode;
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
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
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
  children: React.ReactNode;
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
            <p className="text-sm font-medium text-white">
              Tap to choose images
            </p>
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
