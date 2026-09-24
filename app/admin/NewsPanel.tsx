"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Newspaper,
  PenLine,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  deleteArticleAction,
  listArticlesAction,
  saveArticleAction,
  type AdminArticle,
  type NewsActionState,
} from "@/app/admin/news-actions";
import {
  DirectImageField,
  UploadProgressNote,
  UploadRegistryContext,
  useNewUploadRegistry,
  useSafeActionState,
  useUploadRegistryState,
} from "@/app/admin/direct-upload";
import { MARKDOWN_STYLES, renderMarkdown } from "@/lib/markdown";

const INITIAL_STATE: NewsActionState = { ok: false, message: "" };

/** Title ideas from the owner; tapping one fills the title field. */
const TITLE_EXAMPLES = [
  "Энэ манга дууслаа",
  "Энэ манганы бүх бүлэг үнэгүй хэсэгт орлоо",
  "9 сарын хуваарь",
];

const PANEL_STYLES = `
.yume-admin .np-row {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  border-radius: 16px; padding: 12px 14px;
  background: var(--home-paper-2); border: 1px solid var(--home-line);
}
.yume-admin .np-row.is-editing { border-color: var(--home-rose); box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-rose) 16%, transparent); }
.yume-admin .np-row-title { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 18px; line-height: 1.2; color: var(--home-plum); }
.yume-admin .np-row-date { margin-top: 3px; font-size: 12px; color: var(--home-plum-soft); }
.yume-admin .np-example {
  border-radius: 999px; border: 1px dashed var(--home-line-strong); background: var(--home-paper);
  padding: 6px 12px; font-size: 12.5px; color: var(--home-plum); cursor: pointer;
}
.yume-admin .np-example:hover { border-color: var(--home-rose); color: var(--home-rose-deep); }
.yume-admin .np-preview {
  border-radius: 16px; padding: 16px 18px; font-size: 15px; line-height: 1.75;
  background: var(--home-paper); border: 1px dashed var(--home-line-strong); color: var(--home-plum);
}
`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

/**
 * "НИЙТЛЭЛ БИЧИХ": write, edit and delete МЭДЭЭ articles. Publishing a new
 * one is what raises every reader's unread badge and one-time popup; editing
 * an existing article changes it quietly.
 */
export function NewsPanel() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [defaultAuthor, setDefaultAuthor] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, startLoad] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [draftBody, setDraftBody] = useState("");
  // Bumped to remount the form with fresh defaults (after a publish, or when
  // "Шинэ нийтлэл" is pressed).
  const [formVersion, setFormVersion] = useState(0);
  const titleRef = useRef<HTMLInputElement>(null);
  const registry = useNewUploadRegistry();
  const uploads = useUploadRegistryState(registry);

  function load() {
    startLoad(async () => {
      try {
        const result = await listArticlesAction();
        setLoadError(!result);
        if (result) {
          setArticles(result.articles);
          setDefaultAuthor(result.defaultAuthorName);
        }
      } catch {
        setLoadError(true);
      } finally {
        setHasLoaded(true);
      }
    });
  }

  useEffect(load, []);

  const editing = articles.find((article) => article.id === editingId) ?? null;

  const [saveState, saveAction, savePending] = useSafeActionState(
    saveArticleAction,
    INITIAL_STATE,
    {
      registry,
      scope: () => ({ kind: "news" }),
      onSuccess: (_result, formData) => {
        // A new article is published: clear the form for the next one. An
        // edit keeps the form as the admin left it.
        if (!formData.get("articleId")) {
          setEditingId(null);
          setDraftBody("");
          setFormVersion((version) => version + 1);
        }
        load();
      },
    },
  );
  const [deleteState, deleteAction, deletePending] = useSafeActionState(
    deleteArticleAction,
    INITIAL_STATE,
    {
      onSuccess: () => {
        setEditingId(null);
        load();
      },
    },
  );

  function startNew() {
    registry.reset();
    setEditingId(null);
    setPreview(false);
    setDraftBody("");
    setFormVersion((version) => version + 1);
  }

  function startEdit(article: AdminArticle) {
    registry.reset();
    setEditingId(article.id);
    setPreview(false);
    setDraftBody(article.body);
  }

  const lastState = deleteState.message && !saveState.message ? deleteState : saveState;

  return (
    <section className="ad-card motion-ink-up p-5 sm:p-7">
      <style>{PANEL_STYLES + MARKDOWN_STYLES}</style>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="ad-eyebrow">
            <Newspaper size={13} /> Мэдээ
          </p>
          <h2 className="ad-h2">Нийтлэл бичих</h2>
          <p className="ad-sub">
            Нийтэлмэгц бүх уншигчид цэсэн дээр шинэ мэдээний тоо, дараагийн
            удаа сайтаа нээхэд нэг удаагийн мэдэгдэл харагдана. Засвар
            дахин мэдэгдэл явуулахгүй.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="ad-btn ad-btn-line"
        >
          <Plus size={15} /> Шинэ нийтлэл
        </button>
      </div>

      <UploadRegistryContext.Provider value={registry}>
        <form
          // hasLoaded: remount once the default byline has arrived.
          key={`${editingId ?? "new"}-${formVersion}-${hasLoaded ? 1 : 0}`}
          action={saveAction}
          className="space-y-5"
        >
          <input type="hidden" name="articleId" value={editingId ?? ""} />

          <label className="block">
            <span className="ad-label">Гарчиг</span>
            <input
              ref={titleRef}
              name="title"
              required
              maxLength={200}
              defaultValue={editing?.title ?? ""}
              placeholder={TITLE_EXAMPLES[0]}
              className="ad-input"
            />
          </label>
          {!editing ? (
            <div className="-mt-2 flex flex-wrap gap-2">
              {TITLE_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="np-example"
                  onClick={() => {
                    if (titleRef.current) {
                      titleRef.current.value = example;
                      titleRef.current.focus();
                    }
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          ) : null}

          <label className="block">
            <span className="ad-label">Зохиогч</span>
            <input
              name="authorName"
              maxLength={80}
              defaultValue={editing?.authorName ?? defaultAuthor}
              placeholder={defaultAuthor || "ЮҮМЭ Орчуулагч"}
              className="ad-input"
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="ad-label" style={{ marginBottom: 0 }}>
                Агуулга
              </span>
              <button
                type="button"
                className="ad-chip inline-flex items-center gap-1.5"
                onClick={() => setPreview((value) => !value)}
              >
                {preview ? <EyeOff size={12} /> : <Eye size={12} />}
                {preview ? "Засах" : "Урьдчилан харах"}
              </button>
            </div>
            <textarea
              name="body"
              required
              rows={10}
              maxLength={20000}
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              className="ad-textarea"
              style={{ display: preview ? "none" : undefined }}
              placeholder={
                "Догол мөр бүрийн хооронд хоосон мөр үлдээнэ.\n\n**Тод үг** гэж бичвэл тод болно.\n[Холбоосын нэр](https://yumemanga.mn/manga/...) гэж холбоос оруулна."
              }
            />
            {preview ? (
              <div className="np-preview yume-md">
                {draftBody.trim() ? renderMarkdown(draftBody) : "—"}
              </div>
            ) : (
              <p className="ad-sub mt-2">
                Хоосон мөр = шинэ догол мөр · **тод** · [холбоос](https://...)
              </p>
            )}
          </div>

          <DirectImageField
            name="imageUrl"
            slot="image"
            label="Зураг (сонголттой)"
            previewAspect="16 / 9"
            existingImage={editing?.imageUrl ?? null}
            helper="Нийтлэлийн дээд хэсэгт болон мэдэгдэлд харагдана."
          />
          {editing?.imageUrl ? (
            <label className="ad-check">
              <input type="checkbox" name="removeImage" className="mt-0.5 h-4 w-4" />
              <span>Зургийг хасах</span>
            </label>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={savePending || uploads.preparing > 0}
              className="ad-btn ad-btn-primary w-full sm:w-auto"
            >
              <PenLine size={16} />
              {editing ? "Нийтлэл хадгалах" : "Нийтлэх"}
            </button>
            {uploads.progress !== null ? (
              <UploadProgressNote registry={registry} />
            ) : savePending ? (
              <p className="ad-sub">Хадгалж байна...</p>
            ) : null}
          </div>
        </form>
      </UploadRegistryContext.Provider>

      {lastState.message ? (
        <div
          role={lastState.ok ? "status" : "alert"}
          className={`ad-banner mt-4 ${lastState.ok ? "ad-banner-ok" : "ad-banner-err"}`}
        >
          {lastState.ok ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
          )}
          <p>{lastState.message}</p>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="ad-h3">Нийтэлсэн мэдээ</h3>
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="ad-icon-btn"
            aria-label="Сэргээх"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {loadError ? (
          <div className="ad-banner ad-banner-err">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>Нийтлэлүүдийг ачаалж чадсангүй. Сэргээх товчийг дарна уу.</p>
          </div>
        ) : null}

        {hasLoaded && !loadError && articles.length === 0 ? (
          <div className="ad-dashed p-5 text-sm" style={{ color: "var(--home-plum-soft)" }}>
            Одоогоор нийтлэл алга.
          </div>
        ) : null}

        {!hasLoaded && isLoading ? <p className="ad-sub">Ачаалж байна...</p> : null}

        {articles.map((article) => (
          <div
            key={article.id}
            className={`np-row${article.id === editingId ? " is-editing" : ""}`}
          >
            <div className="min-w-0">
              <p className="np-row-title">{article.title}</p>
              <p className="np-row-date">
                {formatDate(article.publishedAt)} · {article.authorName}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="ad-icon-btn"
                aria-label="Засах"
                title="Засах"
                onClick={() => startEdit(article)}
              >
                <PenLine size={15} />
              </button>
              <form
                action={deleteAction}
                onSubmit={(event) => {
                  if (!window.confirm(`"${article.title}" нийтлэлийг устгах уу?`)) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="articleId" value={article.id} />
                <button
                  type="submit"
                  className="ad-icon-btn"
                  aria-label="Устгах"
                  title="Устгах"
                  disabled={deletePending}
                >
                  <Trash2 size={15} />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
