"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  listScheduleMonthAction,
  saveScheduleMonthAction,
  type AdminScheduleEntry,
} from "@/app/admin/schedule-actions";
import {
  addDays,
  currentMonthKey,
  isDayKey,
  monthBounds,
  monthLabel,
  parseMonthKey,
  scheduleMonthHref,
  scheduleTodayKey,
  shiftMonth,
  weekdayLabel,
} from "@/lib/schedule";

type DraftRow = {
  /** React key; stays put while the row is edited. */
  key: string;
  /** Saved entry id, or null for a row not saved yet. */
  id: string | null;
  date: string;
  /** "" = no series on the site; customTitle is used instead. */
  mangaId: string;
  customTitle: string;
  chapterLabel: string;
  note: string;
};

type Status = { ok: boolean; message: string } | null;

const UNSAVED_WARNING = "Хадгалаагүй өөрчлөлт байна. Орхих уу?";

const PANEL_STYLES = `
.yume-admin .sp-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
}
.yume-admin .sp-bar .ad-input { width: auto; flex: 1 1 170px; max-width: 220px; }
.yume-admin .sp-month-label {
  flex-basis: 100%;
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: 22px; color: var(--home-plum);
}
.yume-admin .sp-public {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--home-rose-deep); text-decoration: none;
}
.yume-admin .sp-public:hover { text-decoration: underline; }

.yume-admin .sp-list { container-type: inline-size; display: grid; gap: 10px; }
.yume-admin .sp-head { display: none; }
.yume-admin .sp-row {
  display: grid; gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "date    actions"
    "series  series"
    "chapter chapter"
    "note    note";
  padding: 12px; border-radius: 16px;
  background: var(--home-paper-2); border: 1px solid var(--home-line);
}
.yume-admin .sp-row.is-new { border-style: dashed; border-color: var(--home-line-strong); }
.yume-admin .sp-row.is-invalid {
  border-color: #c15f73;
  box-shadow: 0 0 0 3px color-mix(in srgb, #c15f73 16%, transparent);
}
.yume-admin .sp-cell { min-width: 0; display: grid; gap: 6px; align-content: start; }
.yume-admin .sp-date { grid-area: date; }
.yume-admin .sp-series { grid-area: series; }
.yume-admin .sp-chapter { grid-area: chapter; }
.yume-admin .sp-note { grid-area: note; }
.yume-admin .sp-actions { grid-area: actions; display: flex; gap: 6px; align-items: flex-start; }
.yume-admin .sp-actions .ad-icon-btn { padding: 10px; }
.yume-admin .sp-date-line { display: flex; align-items: center; gap: 10px; }
.yume-admin .sp-weekday { font-size: 13px; font-weight: 600; color: var(--home-plum-soft); white-space: nowrap; }
.yume-admin .sp-moves { font-size: 12px; color: var(--home-rose-deep); }
.yume-admin .sp-row .ad-input, .yume-admin .sp-row .ad-select {
  /* 16px keeps iOS Safari from zooming into the field on focus. */
  padding: 10px 12px; border-radius: 11px; font-size: 16px;
}
.yume-admin .sp-row .ad-select { padding-right: 34px; background-position: right 10px center; }
.yume-admin .sp-row input[type="date"] { min-height: 44px; }
.yume-admin .sp-mini {
  font-family: 'Marcellus', serif; font-size: 9px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--home-gold);
}
@container (min-width: 700px) {
  .yume-admin .sp-head, .yume-admin .sp-row {
    grid-template-columns: 158px minmax(0, 1.4fr) 128px minmax(0, 1fr) auto;
    grid-template-areas: "date series chapter note actions";
    column-gap: 8px;
  }
  .yume-admin .sp-head {
    display: grid; padding: 0 13px;
    font-family: 'Marcellus', serif; font-size: 10px; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--home-gold);
  }
  .yume-admin .sp-head span:last-child { width: 88px; }
  .yume-admin .sp-row { padding: 8px 12px; }
  .yume-admin .sp-row .sp-mini { display: none; }
  .yume-admin .sp-row .ad-input, .yume-admin .sp-row .ad-select { font-size: 14px; }
  .yume-admin .sp-date-line { flex-direction: column; align-items: stretch; gap: 3px; }
  .yume-admin .sp-weekday { font-size: 11.5px; padding-left: 4px; }
}

.yume-admin .sp-add {
  width: 100%;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 16px; padding: 14px;
  border: 1px dashed var(--home-line-strong); background: var(--home-paper);
  font-size: 14px; font-weight: 600; color: var(--home-rose-deep); cursor: pointer;
}
.yume-admin .sp-add:hover { border-color: var(--home-rose); }
.yume-admin .sp-empty {
  border-radius: 16px; padding: 28px 16px; text-align: center;
  border: 1px dashed var(--home-line-strong); color: var(--home-plum-soft); font-size: 14px;
}
.yume-admin .sp-savebar {
  position: sticky; bottom: 12px; z-index: 5;
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
  border-radius: 18px; padding: 10px 12px 10px 16px;
  background: color-mix(in srgb, var(--home-paper) 94%, transparent);
  border: 1px solid var(--home-line-strong);
  box-shadow: 0 18px 40px -20px var(--home-shadow-strong);
  backdrop-filter: blur(10px);
}
.yume-admin .sp-savebar-note { font-size: 13px; font-weight: 600; color: var(--home-plum); }
.yume-admin .sp-savebar .ad-btn { padding: 11px 16px; }
`;

let rowCounter = 0;

function newRowKey() {
  rowCounter += 1;
  return `sp-${rowCounter}`;
}

function toDraft(entry: AdminScheduleEntry): DraftRow {
  return {
    key: newRowKey(),
    id: entry.id,
    date: entry.date,
    mangaId: entry.mangaId ?? "",
    customTitle: entry.customTitle,
    chapterLabel: entry.chapterLabel,
    note: entry.note,
  };
}

/** What a save would send, for spotting unsaved edits. */
function signature(rows: DraftRow[]) {
  return JSON.stringify(
    rows.map((row) => [
      row.id,
      row.date,
      row.mangaId,
      row.mangaId ? "" : row.customTitle.trim(),
      row.chapterLabel.trim(),
      row.note.trim(),
    ]),
  );
}

function rowProblem(row: DraftRow) {
  return (
    !isDayKey(row.date) ||
    !row.chapterLabel.trim() ||
    (!row.mangaId && !row.customTitle.trim())
  );
}

/** "115-р бүлэг" → "116-р бүлэг": the label's last number, plus one. */
function nextChapterLabel(label: string) {
  const match = /(\d+)(?!.*\d)/.exec(label);

  if (!match) {
    return label;
  }

  return (
    label.slice(0, match.index) +
    String(Number(match[1]) + 1) +
    label.slice(match.index + match[1].length)
  );
}

function clampToMonth(dayKey: string, monthKey: string) {
  const { first, last } = monthBounds(monthKey);

  return dayKey < first ? first : dayKey > last ? last : dayKey;
}

/**
 * "Хуваарь": the release schedule, one month at a time, edited as rows and
 * saved together. Built for entering a month quickly: "Мөр нэмэх" (or Enter in
 * a row's last fields) keeps the series picked last, moves the date on a day
 * and counts the chapter up; any row can be copied.
 */
export function SchedulePanel({
  series,
}: {
  series: Array<{ id: string; mangaName: string }>;
}) {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [savedSignature, setSavedSignature] = useState(signature([]));
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lastSeries, setLastSeries] = useState("");
  const [showProblems, setShowProblems] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const requestRef = useRef(0);

  const dirty = loadedMonth !== null && signature(rows) !== savedSignature;
  const seriesName = new Map(series.map((entry) => [entry.id, entry.mangaName]));

  function applySaved(entries: AdminScheduleEntry[], month: string) {
    const drafts = entries.map(toDraft);
    setRows(drafts);
    setSavedSignature(signature(drafts));
    setLoadedMonth(month);
    setShowProblems(false);
    setLastSeries(drafts.at(-1)?.mangaId ?? "");
  }

  /**
   * Loads a month into the editor. A failed load leaves the editor closed:
   * an empty list saved over a month that has entries would delete them.
   */
  function loadMonth(month: string) {
    const request = ++requestRef.current;

    listScheduleMonthAction(month)
      .then((entries) => {
        if (request !== requestRef.current) {
          return;
        }
        setLoadError(!entries);
        if (entries) {
          applySaved(entries, month);
        }
      })
      .catch(() => {
        if (request === requestRef.current) {
          setLoadError(true);
        }
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadMonth(monthKey), [monthKey]);

  // Leaving the page (reload, closing the tab) with edits: the browser asks.
  useEffect(() => {
    if (!dirty) {
      return;
    }

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function goToMonth(next: string) {
    if (!parseMonthKey(next) || next === monthKey) {
      return;
    }
    if (dirty && !window.confirm(UNSAVED_WARNING)) {
      return;
    }

    setStatus(null);
    setLoadError(false);
    setLoadedMonth(null);
    setMonthKey(next);
  }

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

    if (patch.mangaId !== undefined) {
      setLastSeries(patch.mangaId);
    }
  }

  function addRow() {
    const last = rows.at(-1);
    // The newest row of the series picked last: its title and chapter.
    const template = [...rows].reverse().find((row) => row.mangaId === lastSeries);
    const today = scheduleTodayKey();
    const date = last
      ? clampToMonth(addDays(last.date, 1), monthKey)
      : today.startsWith(monthKey)
        ? today
        : monthBounds(monthKey).first;
    const row: DraftRow = {
      key: newRowKey(),
      id: null,
      date,
      mangaId: lastSeries,
      customTitle: !lastSeries && template ? template.customTitle : "",
      chapterLabel: template ? nextChapterLabel(template.chapterLabel) : "",
      note: "",
    };

    setRows((current) => [...current, row]);
    setFocusKey(row.key);
  }

  function duplicateRow(key: string) {
    const index = rows.findIndex((row) => row.key === key);

    if (index < 0) {
      return;
    }

    const copy = { ...rows[index], key: newRowKey(), id: null };
    setRows((current) => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
    setFocusKey(copy.key);
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  function revert() {
    if (!window.confirm("Өөрчлөлтүүдийг буцаах уу?")) {
      return;
    }

    setStatus(null);
    setLoadedMonth(null);
    loadMonth(monthKey);
  }

  function save() {
    if (rows.some(rowProblem)) {
      setShowProblems(true);
      setStatus({
        ok: false,
        message: "Улаан хүрээтэй мөрүүдийг гүйцээнэ үү: огноо, цуврал (эсвэл гарчиг), бүлэг.",
      });
      return;
    }

    const month = monthKey;

    startSave(async () => {
      try {
        const result = await saveScheduleMonthAction(
          month,
          rows.map((row) => ({
            id: row.id,
            date: row.date,
            mangaId: row.mangaId || null,
            customTitle: row.customTitle,
            chapterLabel: row.chapterLabel,
            note: row.note,
          })),
        );

        setStatus({ ok: result.ok, message: result.message });

        if (result.ok && result.entries) {
          applySaved(result.entries, month);
        }
      } catch {
        setStatus({ ok: false, message: "Хадгалж чадсангүй. Дахин оролдоно уу." });
      }
    });
  }

  /** Enter in the last row's text fields adds the next row. */
  function onFieldKeyDown(event: KeyboardEvent<HTMLInputElement>, key: string) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (rows.at(-1)?.key === key) {
        addRow();
      }
    }
  }

  const loading = loadedMonth !== monthKey;

  return (
    <section className="ad-card motion-ink-up p-5 sm:p-7">
      <style>{PANEL_STYLES}</style>

      <div className="mb-6 space-y-2">
        <p className="ad-eyebrow">
          <CalendarDays size={13} /> Хуваарь
        </p>
        <h2 className="ad-h2">Бүлэг гарах хуваарь</h2>
        <p className="ad-sub">
          Сараа сонгоод мөр нэмнэ. Шинэ мөр сүүлд сонгосон цувралаа авч, огноог
          нэг өдрөөр, бүлгийг нэгээр ахиулна. Хадгалмагц нийтийн хуудсанд шууд
          гарна.
        </p>
      </div>

      <div className="sp-bar mb-5">
        <p className="sp-month-label">{monthLabel(monthKey)}</p>
        <button
          type="button"
          className="ad-icon-btn"
          onClick={() => goToMonth(shiftMonth(monthKey, -1))}
          aria-label="Өмнөх сар"
        >
          <ChevronLeft size={16} />
        </button>
        <input
          type="month"
          className="ad-input"
          value={monthKey}
          onChange={(event) => goToMonth(event.target.value)}
          aria-label="Сар"
        />
        <button
          type="button"
          className="ad-icon-btn"
          onClick={() => goToMonth(shiftMonth(monthKey, 1))}
          aria-label="Дараах сар"
        >
          <ChevronRight size={16} />
        </button>
        <a
          href={scheduleMonthHref(monthKey)}
          target="_blank"
          rel="noreferrer"
          className="sp-public ml-auto"
        >
          <ExternalLink size={14} /> Нийтийн хуудас
        </a>
      </div>

      {loadError ? (
        <div className="ad-banner ad-banner-err mb-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>Хуваарийг ачаалж чадсангүй. Хуудсаа сэргээнэ үү.</p>
        </div>
      ) : null}

      {loading ? (
        loadError ? null : <div className="sp-empty">Ачаалж байна…</div>
      ) : (
        <div className="sp-list">
          {rows.length > 0 ? (
            <div className="sp-head" aria-hidden="true">
              <span>Огноо</span>
              <span>Цуврал</span>
              <span>Бүлэг</span>
              <span>Тэмдэглэл</span>
              <span />
            </div>
          ) : (
            <div className="sp-empty">
              Энэ сард бүртгэл алга. Доорх товчоор эхний мөрөө нэмнэ үү.
            </div>
          )}

          {rows.map((row, index) => {
            const invalid = showProblems && rowProblem(row);
            const outsideMonth = isDayKey(row.date) && !row.date.startsWith(monthKey);
            const missingSeries = row.mangaId !== "" && !seriesName.has(row.mangaId);

            return (
              <div
                key={row.key}
                className={`sp-row${row.id ? "" : " is-new"}${invalid ? " is-invalid" : ""}`}
              >
                <label className="sp-cell sp-date">
                  <span className="sp-mini">Огноо</span>
                  <span className="sp-date-line">
                    <input
                      type="date"
                      className="ad-input"
                      value={row.date}
                      required
                      onChange={(event) => updateRow(row.key, { date: event.target.value })}
                      aria-label={`${index + 1}-р мөрийн огноо`}
                    />
                    <span className="sp-weekday">
                      {isDayKey(row.date) ? weekdayLabel(row.date) : ""}
                    </span>
                  </span>
                  {outsideMonth ? (
                    <span className="sp-moves">Өөр сар руу шилжинэ</span>
                  ) : null}
                </label>

                <div className="sp-cell sp-series">
                  <span className="sp-mini">Цуврал</span>
                  <select
                    className="ad-select"
                    value={row.mangaId}
                    onChange={(event) => updateRow(row.key, { mangaId: event.target.value })}
                    aria-label={`${index + 1}-р мөрийн цуврал`}
                  >
                    <option value="">— Гарчиг гараар бичих —</option>
                    {missingSeries ? (
                      <option value={row.mangaId}>(устгагдсан цуврал)</option>
                    ) : null}
                    {series.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.mangaName}
                      </option>
                    ))}
                  </select>
                  {row.mangaId === "" ? (
                    <input
                      className="ad-input"
                      value={row.customTitle}
                      maxLength={120}
                      placeholder="Гарчиг"
                      onChange={(event) =>
                        updateRow(row.key, { customTitle: event.target.value })
                      }
                      aria-label={`${index + 1}-р мөрийн гарчиг`}
                    />
                  ) : null}
                </div>

                <label className="sp-cell sp-chapter">
                  <span className="sp-mini">Бүлэг</span>
                  <input
                    className="ad-input"
                    value={row.chapterLabel}
                    maxLength={60}
                    placeholder="115-р бүлэг"
                    autoFocus={row.key === focusKey}
                    onChange={(event) =>
                      updateRow(row.key, { chapterLabel: event.target.value })
                    }
                    onKeyDown={(event) => onFieldKeyDown(event, row.key)}
                    enterKeyHint="next"
                  />
                </label>

                <label className="sp-cell sp-note">
                  <span className="sp-mini">Тэмдэглэл</span>
                  <input
                    className="ad-input"
                    value={row.note}
                    maxLength={200}
                    placeholder="Сонголттой"
                    onChange={(event) => updateRow(row.key, { note: event.target.value })}
                    onKeyDown={(event) => onFieldKeyDown(event, row.key)}
                    enterKeyHint="next"
                  />
                </label>

                <div className="sp-actions">
                  <button
                    type="button"
                    className="ad-icon-btn"
                    onClick={() => duplicateRow(row.key)}
                    aria-label="Хуулж нэмэх"
                    title="Хуулж нэмэх"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    className="ad-icon-btn"
                    onClick={() => removeRow(row.key)}
                    aria-label="Устгах"
                    title="Устгах"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          <button type="button" className="sp-add" onClick={addRow}>
            <Plus size={16} /> Мөр нэмэх
          </button>
        </div>
      )}

      {status ? (
        <div className={`ad-banner mt-4 ${status.ok ? "ad-banner-ok" : "ad-banner-err"}`}>
          {status.ok ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
          )}
          <p>{status.message}</p>
        </div>
      ) : null}

      {dirty ? (
        <div className="sp-savebar mt-4">
          <span className="sp-savebar-note">Хадгалаагүй өөрчлөлт байна</span>
          <span className="flex gap-2">
            <button
              type="button"
              className="ad-btn ad-btn-line"
              onClick={revert}
              disabled={isSaving}
            >
              <RotateCcw size={14} /> Буцаах
            </button>
            <button
              type="button"
              className="ad-btn ad-btn-gold"
              onClick={save}
              disabled={isSaving}
            >
              <Save size={14} /> {isSaving ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          </span>
        </div>
      ) : null}
    </section>
  );
}
