"use client";

/**
 * Direct browser → R2 uploads for every admin form, plus the action wrapper
 * that keeps a failed save inside the form.
 *
 * How a save works now:
 *   1. Upload fields compress what the admin picked and park it in the form's
 *      UploadRegistry. Nothing is sent yet, so an abandoned pick leaves no file
 *      behind, and new chapters can use ids the server reserves at save time.
 *   2. On submit, `useSafeActionState` asks the server for one signed PUT URL
 *      per parked file, uploads them straight to R2 (with progress), and writes
 *      the resulting public URLs into the FormData.
 *   3. Only then is the Server Action called — with URLs, never file bytes.
 *
 * Any failure along the way — compression, upload, the action's own fetch —
 * comes back as `{ ok: false, message }` for the form to show inline. Before,
 * a failed action fetch was rethrown into app/admin/error.tsx and replaced the
 * whole dashboard.
 */

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AlertCircle, Check, FileImage, Images, Loader2, X } from "lucide-react";
import { requestUploadTargetsAction } from "@/app/admin/upload-actions";
import {
  ARTWORK_MAX_SIDE,
  ImagePrepareError,
  prepareImage,
} from "@/lib/client-image";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_CONTENT_TYPES,
  type UploadScope,
} from "@/lib/upload-types";

// ── Uploading ───────────────────────────────────────────────────────────────

export class UploadError extends Error {
  constructor(readonly status: number) {
    super(
      status === 0 || status === -1
        ? "Зургийг хадгалах сан (R2) руу илгээж чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу. Давтагдвал R2-ийн CORS тохиргоог шалгана уу."
        : status === 403
          ? "Зураг оруулах холбоосын хугацаа дууссан байна. Дахин оролдоно уу."
          : `Зураг илгээхэд алдаа гарлаа (${status}). Дахин оролдоно уу.`,
    );
  }
}

/** PUT one file to a signed URL. XHR rather than fetch for upload progress. */
function putFile(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  onProgress: (loaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    // Signed into the URL — must match exactly.
    request.setRequestHeader("Content-Type", contentType);
    request.timeout = 180_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded);
      }
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new UploadError(request.status));
    request.onerror = () => reject(new UploadError(0));
    request.ontimeout = () => reject(new UploadError(-1));
    request.send(blob);
  });
}

async function putWithRetry(
  job: UploadJob,
  onProgress: (loaded: number) => void,
) {
  try {
    await putFile(job.uploadUrl, job.blob, job.contentType, onProgress);
  } catch (error) {
    // One retry for flaky mobile connections; a 4xx will not fix itself.
    if (error instanceof UploadError && (error.status <= 0 || error.status >= 500)) {
      onProgress(0);
      await putFile(job.uploadUrl, job.blob, job.contentType, onProgress);
      return;
    }

    throw error;
  }
}

type UploadJob = { uploadUrl: string; blob: Blob; contentType: string };

async function uploadAll(
  jobs: UploadJob[],
  onProgress: (fraction: number) => void,
  concurrency = 4,
) {
  const total = jobs.reduce((sum, job) => sum + job.blob.size, 0) || 1;
  const loaded = new Array<number>(jobs.length).fill(0);
  let next = 0;

  const report = () =>
    onProgress(Math.min(1, loaded.reduce((sum, value) => sum + value, 0) / total));

  async function worker() {
    while (next < jobs.length) {
      const index = next++;
      await putWithRetry(jobs[index], (value) => {
        loaded[index] = value;
        report();
      });
      loaded[index] = jobs[index].blob.size;
      report();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, jobs.length) }, worker),
  );
}

// ── The per-form registry of parked files ───────────────────────────────────

export type PendingUpload = {
  /** Form field the resulting public URL is written to. */
  field: string;
  /** What the file is, for the server's key builder (see lib/upload-types). */
  slot: string;
  blob: Blob;
  contentType: string;
  fileName: string;
  /** Append instead of set — for ordered lists such as chapter pages. */
  append?: boolean;
};

type RegistrySnapshot = {
  /** Bumped by reset(); fields drop their previews when it changes. */
  resetVersion: number;
  /** Files still being compressed. The submit button waits for these. */
  preparing: number;
  /** Upload progress 0–1 while a save is uploading, else null. */
  progress: number | null;
  /** Parked files ready to upload. */
  count: number;
};

export class UploadRegistry {
  private groups = new Map<string, PendingUpload[]>();
  private preparingKeys = new Set<string>();
  private listeners = new Set<() => void>();
  private snapshot: RegistrySnapshot = {
    resetVersion: 0,
    preparing: 0,
    progress: null,
    count: 0,
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private emit(patch: Partial<RegistrySnapshot> = {}) {
    let count = 0;
    for (const uploads of this.groups.values()) {
      count += uploads.length;
    }

    this.snapshot = {
      ...this.snapshot,
      preparing: this.preparingKeys.size,
      count,
      ...patch,
    };
    this.listeners.forEach((listener) => listener());
  }

  /** Park (or with null, drop) the files for one field. */
  set(key: string, uploads: PendingUpload[] | null) {
    if (uploads && uploads.length > 0) {
      this.groups.set(key, uploads);
    } else {
      this.groups.delete(key);
    }
    this.emit();
  }

  setPreparing(key: string, preparing: boolean) {
    if (preparing) {
      this.preparingKeys.add(key);
    } else {
      this.preparingKeys.delete(key);
    }
    this.emit();
  }

  setProgress(progress: number | null) {
    this.emit({ progress });
  }

  /** Parked files, optionally only the given field groups. */
  entries(groups?: string[]): PendingUpload[] {
    const keys = groups ?? [...this.groups.keys()];
    return keys.flatMap((key) => this.groups.get(key) ?? []);
  }

  /** Forget the given groups (default: all), e.g. after a successful save. */
  reset(groups?: string[]) {
    for (const key of groups ?? [...this.groups.keys()]) {
      this.groups.delete(key);
    }
    this.emit({ resetVersion: this.snapshot.resetVersion + 1 });
  }
}

export const UploadRegistryContext = createContext<UploadRegistry | null>(null);

export function useNewUploadRegistry() {
  const [registry] = useState(() => new UploadRegistry());
  return registry;
}

export function useUploadRegistryState(registry: UploadRegistry | null) {
  return useSyncExternalStore(
    registry?.subscribe ?? noopSubscribe,
    registry?.getSnapshot ?? emptySnapshot,
    registry?.getSnapshot ?? emptySnapshot,
  );
}

const EMPTY_SNAPSHOT: RegistrySnapshot = {
  resetVersion: 0,
  preparing: 0,
  progress: null,
  count: 0,
};
const noopSubscribe = () => () => undefined;
const emptySnapshot = () => EMPTY_SNAPSHOT;

// ── The action wrapper ──────────────────────────────────────────────────────

export type ActionStateBase = { ok: boolean; message: string };

export function describeActionError(error: unknown): string {
  if (error instanceof UploadError || error instanceof ImagePrepareError) {
    return error.message;
  }

  // "An unexpected response was received from the server.", "Failed to
  // fetch", a 413/504 from the platform: none of these are the admin's fault
  // and none carry a useful message, so they get one plain explanation.
  return "Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу. Өөрчлөлт хадгалагдаагүй байж магадгүй.";
}

type SafeActionOptions<S> = {
  /** Where parked files live for this form. */
  registry?: UploadRegistry | null;
  /** Which registry groups this submit uploads (default: all). */
  groups?: (formData: FormData) => string[] | undefined;
  /** Upload scope for this submit; required when files are parked. */
  scope?: (formData: FormData) => UploadScope | null;
  /** Checks to run before anything is uploaded. Return a message to stop. */
  validate?: (formData: FormData, pending: PendingUpload[]) => string | null;
  onSuccess?: (result: S, formData: FormData) => void;
};

/**
 * `useActionState` for admin forms: uploads parked files first, strips any
 * stray File from the body, and turns every thrown error into an inline
 * `{ ok: false }` state instead of letting it reach the error boundary.
 */
export function useSafeActionState<S extends ActionStateBase>(
  action: (previous: S, formData: FormData) => Promise<S>,
  initialState: S,
  options: SafeActionOptions<S> = {},
) {
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  const run = useCallback(
    async (previous: S, formData: FormData): Promise<S> => {
      const { registry, groups, scope, validate, onSuccess } =
        optionsRef.current;
      const groupKeys = groups?.(formData);

      try {
        const pending = registry ? registry.entries(groupKeys) : [];
        const invalid = validate?.(formData, pending);

        if (invalid) {
          return { ...previous, ok: false, message: invalid };
        }

        if (pending.length > 0) {
          const uploadScope = scope?.(formData);

          if (!uploadScope) {
            return {
              ...previous,
              ok: false,
              message: "Зураг хаана хадгалахыг тодорхойлж чадсангүй.",
            };
          }

          const targets = await requestUploadTargetsAction(
            uploadScope,
            pending.map((upload) => ({
              slot: upload.slot,
              contentType: upload.contentType,
              size: upload.blob.size,
              name: upload.fileName,
            })),
          );

          if (!targets.ok) {
            return { ...previous, ok: false, message: targets.message };
          }

          if (targets.mangaId) formData.set("reservedMangaId", targets.mangaId);
          if (targets.chapterId) formData.set("reservedChapterId", targets.chapterId);

          registry?.setProgress(0);
          await uploadAll(
            targets.targets.map((target, index) => ({
              uploadUrl: target.uploadUrl,
              blob: pending[index].blob,
              contentType: target.contentType,
            })),
            (fraction) => registry?.setProgress(fraction),
          );

          pending.forEach((upload, index) => {
            const url = targets.targets[index].publicUrl;
            if (upload.append) {
              formData.append(upload.field, url);
            } else {
              formData.set(upload.field, url);
            }
          });
        }

        // Belt and braces: no file bytes ever ride in an action body again.
        const fileKeys = [...formData.entries()]
          .filter(([, value]) => typeof value !== "string")
          .map(([key]) => key);
        fileKeys.forEach((key) => formData.delete(key));

        const result = await action(previous, formData);

        if (result.ok) {
          registry?.reset(groupKeys);
          onSuccess?.(result, formData);
        }

        return result;
      } catch (error) {
        console.error("[admin] save failed", error);
        return { ...previous, ok: false, message: describeActionError(error) };
      } finally {
        registry?.setProgress(null);
      }
    },
    [action],
  );

  // S is a plain state object, so Awaited<S> is S; TypeScript just cannot see
  // that through the generic.
  return useActionState<S, FormData>(
    run as (state: Awaited<S>, payload: FormData) => Promise<S>,
    initialState as Awaited<S>,
  );
}

// ── Fields ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatType(contentType: string) {
  return (UPLOAD_CONTENT_TYPES[contentType] ?? "").toUpperCase();
}

/** Status line under a form's submit button while its files upload. */
export function UploadProgressNote({ registry }: { registry: UploadRegistry }) {
  const { progress, preparing } = useUploadRegistryState(registry);

  if (preparing > 0) {
    return <p className="ad-sub">Зургийг шахаж бэлдэж байна...</p>;
  }

  if (progress === null) {
    return null;
  }

  return (
    <p className="ad-sub">
      Зураг хадгалах сан руу илгээж байна... {Math.round(progress * 100)}%
    </p>
  );
}

type PreviewState = {
  url: string;
  fileName: string;
  size: number;
  contentType: string;
  resetVersion: number;
} | null;

/**
 * Pick → compress (≤1600px, WebP/JPEG) → park in the form's registry. The
 * upload itself happens when the form is saved.
 */
export function DirectImageField({
  name,
  slot,
  label,
  helper,
  existingImage,
  maxSide = ARTWORK_MAX_SIDE,
  keepOriginal,
  accept = "image/*",
  previewAspect = "3 / 4",
}: {
  /** Form field that receives the uploaded URL. */
  name: string;
  slot: string;
  label: string;
  helper: string;
  existingImage?: string | null;
  maxSide?: number;
  /** Also upload the untouched original, e.g. for a "download original" link. */
  keepOriginal?: { name: string; slot: string };
  accept?: string;
  previewAspect?: string;
}) {
  const registry = useContext(UploadRegistryContext);
  const { resetVersion } = useUploadRegistryState(registry);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A successful save resets the registry; a preview from before that reset
  // belongs to a file that is already uploaded, so stop showing it.
  const visiblePreview =
    preview && preview.resetVersion === resetVersion ? preview : null;

  useEffect(() => {
    const url = preview?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [preview?.url]);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !registry) {
      return;
    }

    setError(null);
    setBusy(true);
    registry.setPreparing(name, true);

    try {
      const prepared = await prepareImage(file, {
        fileName: file.name,
        maxSide,
      });
      const uploads: PendingUpload[] = [
        {
          field: name,
          slot,
          blob: prepared.blob,
          contentType: prepared.contentType,
          fileName: prepared.fileName,
        },
      ];

      if (keepOriginal) {
        const originalAllowed =
          Boolean(UPLOAD_CONTENT_TYPES[file.type]) && file.size <= MAX_UPLOAD_BYTES;
        uploads.push({
          field: keepOriginal.name,
          slot: keepOriginal.slot,
          blob: originalAllowed ? file : prepared.blob,
          contentType: originalAllowed ? file.type : prepared.contentType,
          fileName: originalAllowed ? file.name : prepared.fileName,
        });
      }

      registry.set(name, uploads);
      setPreview({
        url: URL.createObjectURL(prepared.blob),
        fileName: file.name,
        size: prepared.blob.size,
        contentType: prepared.contentType,
        resetVersion,
      });
    } catch (caught) {
      registry.set(name, null);
      setPreview(null);
      setError(
        caught instanceof ImagePrepareError
          ? caught.message
          : "Зургийг бэлдэж чадсангүй. Өөр зураг сонгоно уу.",
      );
    } finally {
      registry.setPreparing(name, false);
      setBusy(false);
    }
  }

  function clear() {
    registry?.set(name, null);
    setPreview(null);
    setError(null);
  }

  return (
    <div className="block">
      <span className="ad-label">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onPick}
      />

      {visiblePreview ? (
        <div className="du-result">
          <div className="du-thumb" style={{ aspectRatio: previewAspect }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={visiblePreview.url} alt="Шинэ зураг" />
            <span className="du-tag">
              <Check size={11} /> Шинэ
            </span>
          </div>
          <div className="du-meta">
            <p className="du-name">{visiblePreview.fileName}</p>
            <p className="du-size">
              {formatBytes(visiblePreview.size)} · {formatType(visiblePreview.contentType)} ·
              хадгалахад илгээгдэнэ
            </p>
            <div className="du-btns">
              <button
                type="button"
                className="ad-btn ad-btn-line du-mini"
                onClick={() => inputRef.current?.click()}
              >
                <FileImage size={14} /> Өөр зураг
              </button>
              <button
                type="button"
                className="ad-btn ad-btn-line du-mini du-danger"
                onClick={clear}
              >
                <X size={14} /> Болих
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="ad-upload du-drop"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {existingImage ? (
            <span className="du-existing">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={existingImage}
                alt="Одоогийн зураг"
                style={{ aspectRatio: previewAspect }}
              />
              <span className="du-existing-text">
                <span className="du-strong">
                  {busy ? "Бэлдэж байна..." : "Зураг солих"}
                </span>
                <span className="du-muted">{helper}</span>
              </span>
            </span>
          ) : (
            <span className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
              <span className="ad-upload-ico">
                {busy ? <Loader2 size={20} className="du-spin" /> : <FileImage size={20} />}
              </span>
              <span>
                <span className="du-strong block">
                  {busy ? "Бэлдэж байна..." : "Зураг сонгох"}
                </span>
                <span className="du-muted mt-1 block">{helper}</span>
              </span>
            </span>
          )}
        </button>
      )}

      {error ? (
        <p className="du-error">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </p>
      ) : null}
    </div>
  );
}

const PAGE_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

type PagesState = { count: number; bytes: number; resetVersion: number } | null;

/**
 * Chapter pages for ГАРААР ОРУУЛАХ. Sent untouched — translated pages keep
 * their full quality — and uploaded in reading order (numeric file names).
 */
export function DirectPagesField({
  name,
  label,
  helper,
}: {
  name: string;
  label: string;
  helper: string;
}) {
  const registry = useContext(UploadRegistryContext);
  const { resetVersion } = useUploadRegistryState(registry);
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PagesState>(null);
  const [error, setError] = useState<string | null>(null);
  const visible = picked && picked.resetVersion === resetVersion ? picked : null;

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].sort((left, right) =>
      left.name.localeCompare(right.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
    event.target.value = "";

    if (!registry || files.length === 0) {
      return;
    }

    const uploads: PendingUpload[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const contentType = UPLOAD_CONTENT_TYPES[file.type]
        ? file.type
        : PAGE_TYPE_BY_EXT[ext];

      if (!contentType) {
        setError(`"${file.name}" — зөвхөн JPG, PNG, WEBP, GIF, AVIF хуудас оруулна.`);
        return;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`"${file.name}" хэт том байна (${formatBytes(file.size)}).`);
        return;
      }

      uploads.push({
        field: name,
        slot: "page",
        blob: file,
        contentType,
        fileName: file.name,
        append: true,
      });
    }

    setError(null);
    registry.set(name, uploads);
    setPicked({
      count: uploads.length,
      bytes: uploads.reduce((sum, upload) => sum + upload.blob.size, 0),
      resetVersion,
    });
  }

  return (
    <div className="block">
      <span className="ad-label">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        className="ad-upload du-drop"
        onClick={() => inputRef.current?.click()}
      >
        <span className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
          <span className="ad-upload-ico">
            <Images size={20} />
          </span>
          <span>
            <span className="du-strong block">
              {visible ? `${visible.count} хуудас сонгосон` : "Хуудсууд сонгох"}
            </span>
            <span className="du-muted mt-1 block">
              {visible
                ? `${formatBytes(visible.bytes)} · хадгалахад дарааллаар нь илгээнэ`
                : helper}
            </span>
          </span>
        </span>
      </button>
      {error ? (
        <p className="du-error">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </p>
      ) : null}
    </div>
  );
}

/** Styles for the fields above; rendered once inside `.yume-admin`. */
export const DIRECT_UPLOAD_STYLES = `
.yume-admin .du-drop { display: block; width: 100%; text-align: left; font: inherit; color: inherit; }
.yume-admin .du-drop:disabled { opacity: 0.7; cursor: progress; }
.yume-admin .du-strong { font-size: 14px; font-weight: 600; color: var(--home-plum); }
.yume-admin .du-muted { font-size: 12px; line-height: 1.5; color: var(--home-plum-soft); }
.yume-admin .du-existing { display: flex; align-items: center; gap: 14px; }
.yume-admin .du-existing img {
  width: 72px; flex-shrink: 0; object-fit: cover; border-radius: 12px;
  border: 1px solid var(--home-line); background: var(--home-paper);
}
.yume-admin .du-existing-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.yume-admin .du-result {
  display: flex; gap: 14px; align-items: flex-start;
  border-radius: 20px; border: 1px solid var(--home-line-strong);
  background: var(--home-paper-2); padding: 14px;
}
.yume-admin .du-thumb {
  position: relative; width: 92px; flex-shrink: 0; overflow: hidden;
  border-radius: 12px; border: 1px solid var(--home-line); background: var(--home-paper);
}
.yume-admin .du-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.yume-admin .du-tag {
  position: absolute; left: 6px; top: 6px;
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 7px; border-radius: 999px;
  font-family: 'Marcellus', serif; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  color: #fff; background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
}
.yume-admin .du-meta { min-width: 0; flex: 1; }
.yume-admin .du-name { font-size: 13.5px; font-weight: 600; color: var(--home-plum); word-break: break-all; }
.yume-admin .du-size { margin-top: 3px; font-size: 12px; color: var(--home-plum-soft); }
.yume-admin .du-btns { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
.yume-admin .du-mini { padding: 8px 12px; font-size: 10.5px; }
.yume-admin .du-danger { color: #a8506a; }
.yume-admin .du-error {
  margin-top: 8px; display: flex; align-items: flex-start; gap: 6px;
  font-size: 13px; line-height: 1.5; color: #9c4a59;
}
.yume-admin .du-spin { animation: du-spin 0.9s linear infinite; }
@keyframes du-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .yume-admin .du-spin { animation: none; } }
`;
