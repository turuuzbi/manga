"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  listWeeklyScheduleAction,
  saveWeeklyScheduleAction,
  type AdminScheduleEntry,
} from "@/app/admin/schedule-actions";
import { SCHEDULE_HREF, WEEKDAYS, weekdayName } from "@/lib/schedule";

type DraftRow = {
  /** React key; stays put while the row is edited. */
  key: string;
  /** Saved entry id, or null for a row not saved yet. */
  id: string | null;
  /** "" = no series on the site; customTitle is used instead. */
  mangaId: string;
  customTitle: string;
  /** ISO weekdays, 1 = Monday … 7 = Sunday, ascending. */
  weekdays: number[];
  note: string;
};

type Status = { ok: boolean; message: string } | null;

const PANEL_STYLES = `
.yume-admin .sp-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
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
    "series  actions"
    "days    days"
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
.yume-admin .sp-series { grid-area: series; }
.yume-admin .sp-days { grid-area: days; }
.yume-admin .sp-note { grid-area: note; }
.yume-admin .sp-actions { grid-area: actions; display: flex; gap: 6px; align-items: flex-start; }
.yume-admin .sp-actions .ad-icon-btn { padding: 10px; }
.yume-admin .sp-row .ad-input, .yume-admin .sp-row .ad-select {
  /* 16px keeps iOS Safari from zooming into the field on focus. */
  padding: 10px 12px; border-radius: 11px; font-size: 16px;
}
.yume-admin .sp-row .ad-select { padding-right: 34px; background-position: right 10px center; }
.yume-admin .sp-mini {
  font-family: 'Marcellus', serif; font-size: 9px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--home-gold);
}
.yume-admin .sp-weekdays { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; }
.yume-admin .sp-day {
  min-height: 44px; border-radius: 11px;
  font-size: 13px; font-weight: 700; cursor: pointer;
  color: var(--home-plum-soft);
  background: var(--home-paper);
  border: 1px solid var(--home-line);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.yume-admin .sp-day:hover { border-color: var(--home-line-strong); }
.yume-admin .sp-day.is-on {
  color: #fff;
  background: linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%);
  border-color: transparent;
}
@container (min-width: 760px) {
  .yume-admin .sp-head, .yume-admin .sp-row {
    grid-template-columns: minmax(0, 1.2fr) 300px minmax(0, 1fr) auto;
    grid-template-areas: "series days note actions";
    column-gap: 10px;
  }
  .yume-admin .sp-head {
    display: grid; padding: 0 13px;
    font-family: 'Marcellus', serif; font-size: 10px; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--home-gold);
  }
  .yume-admin .sp-head span:last-child { width: 44px; }
  .yume-admin .sp-row { padding: 8px 12px; }
  .yume-admin .sp-row .sp-mini { display: none; }
  .yume-admin .sp-row .ad-input, .yume-admin .sp-row .ad-select { font-size: 14px; }
  .yume-admin .sp-day { min-height: 40px; font-size: 12px; }
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
    mangaId: entry.mangaId ?? "",
    customTitle: entry.customTitle,
    weekdays: entry.weekdays,
    note: entry.note,
  };
}

/** What a save would send, for spotting unsaved edits. */
function signature(rows: DraftRow[]) {
  return JSON.stringify(
    rows.map((row) => [
      row.id,
      row.mangaId,
      row.mangaId ? "" : row.customTitle.trim(),
      row.weekdays,
      row.note.trim(),
    ]),
  );
}

function rowProblem(row: DraftRow) {
  return row.weekdays.length === 0 || (!row.mangaId && !row.customTitle.trim());
}

/**
 * "Хуваарь": the weekly release schedule. One row per series with the
 * weekday(s) it comes out on, every week; all rows are saved together.
 */
export function SchedulePanel({
  series,
}: {
  series: Array<{ id: string; mangaName: string }>;
}) {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [savedSignature, setSavedSignature] = useState(signature([]));
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showProblems, setShowProblems] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [isSaving, startSave] = useTransition();
  const requestRef = useRef(0);

  const dirty = loaded && signature(rows) !== savedSignature;
  const seriesName = new Map(series.map((entry) => [entry.id, entry.mangaName]));
  // Series already on another row: one row per series.
  const usedSeries = new Set(rows.map((row) => row.mangaId).filter(Boolean));

  function applySaved(entries: AdminScheduleEntry[]) {
    const drafts = entries.map(toDraft);
    setRows(drafts);
    setSavedSignature(signature(drafts));
    setLoaded(true);
    setShowProblems(false);
  }

  /**
   * Loads the schedule into the editor. A failed load leaves the editor
   * closed: an empty list saved over the real one would delete it.
   */
  function load() {
    const request = ++requestRef.current;

    listWeeklyScheduleAction()
      .then((entries) => {
        if (request !== requestRef.current) {
          return;
        }
        setLoadError(!entries);
        if (entries) {
          applySaved(entries);
        }
      })
      .catch(() => {
        if (request === requestRef.current) {
          setLoadError(true);
        }
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => load(), []);

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

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function toggleDay(key: string, weekday: number) {
    setRows((current) =>
      current.map((row) =>
        row.key === key
          ? {
              ...row,
              weekdays: row.weekdays.includes(weekday)
                ? row.weekdays.filter((day) => day !== weekday)
                : [...row.weekdays, weekday].sort((left, right) => left - right),
            }
          : row,
      ),
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { key: newRowKey(), id: null, mangaId: "", customTitle: "", weekdays: [], note: "" },
    ]);
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  function revert() {
    if (!window.confirm("Өөрчлөлтүүдийг буцаах уу?")) {
      return;
    }

    setStatus(null);
    setLoaded(false);
    load();
  }

  function save() {
    if (rows.some(rowProblem)) {
      setShowProblems(true);
      setStatus({
        ok: false,
        message: "Улаан хүрээтэй мөрүүдийг гүйцээнэ үү: цуврал (эсвэл гарчиг), гарах өдөр.",
      });
      return;
    }

    startSave(async () => {
      try {
        const result = await saveWeeklyScheduleAction(
          rows.map((row) => ({
            id: row.id,
            mangaId: row.mangaId || null,
            customTitle: row.customTitle,
            weekdays: row.weekdays,
            note: row.note,
          })),
        );

        setStatus({ ok: result.ok, message: result.message });

        if (result.ok && result.entries) {
          applySaved(result.entries);
        }
      } catch {
        setStatus({ ok: false, message: "Хадгалж чадсангүй. Дахин оролдоно уу." });
      }
    });
  }

  return (
    <section className="ad-card motion-ink-up p-5 sm:p-7">
      <style>{PANEL_STYLES}</style>

      <div className="mb-6 space-y-2">
        <p className="ad-eyebrow">
          <CalendarDays size={13} /> Хуваарь
        </p>
        <h2 className="ad-h2">Долоо хоногийн хуваарь</h2>
        <p className="ad-sub">
          Цуврал бүрт нэг мөр нэмээд долоо хоног бүр гарах өдрүүдийг нь сонгоно.
          Хадгалмагц нийтийн хуудсанд шууд гарна.
        </p>
      </div>

      <div className="sp-bar mb-5">
        <a href={SCHEDULE_HREF} target="_blank" rel="noreferrer" className="sp-public ml-auto">
          <ExternalLink size={14} /> Нийтийн хуудас
        </a>
      </div>

      {loadError ? (
        <div className="ad-banner ad-banner-err mb-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>Хуваарийг ачаалж чадсангүй. Хуудсаа сэргээнэ үү.</p>
        </div>
      ) : null}

      {!loaded ? (
        loadError ? null : <div className="sp-empty">Ачаалж байна…</div>
      ) : (
        <div className="sp-list">
          {rows.length > 0 ? (
            <div className="sp-head" aria-hidden="true">
              <span>Цуврал</span>
              <span>Гарах өдөр</span>
              <span>Тэмдэглэл</span>
              <span />
            </div>
          ) : (
            <div className="sp-empty">
              Хуваарь хоосон байна. Доорх товчоор эхний мөрөө нэмнэ үү.
            </div>
          )}

          {rows.map((row, index) => {
            const invalid = showProblems && rowProblem(row);
            const missingSeries = row.mangaId !== "" && !seriesName.has(row.mangaId);

            return (
              <div
                key={row.key}
                className={`sp-row${row.id ? "" : " is-new"}${invalid ? " is-invalid" : ""}`}
              >
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
                      <option
                        key={entry.id}
                        value={entry.id}
                        disabled={entry.id !== row.mangaId && usedSeries.has(entry.id)}
                      >
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

                <div className="sp-cell sp-days">
                  <span className="sp-mini">Гарах өдөр</span>
                  <div
                    className="sp-weekdays"
                    role="group"
                    aria-label={`${index + 1}-р мөрийн гарах өдрүүд`}
                  >
                    {WEEKDAYS.map((weekday) => {
                      const on = row.weekdays.includes(weekday);

                      return (
                        <button
                          key={weekday}
                          type="button"
                          className={`sp-day${on ? " is-on" : ""}`}
                          aria-pressed={on}
                          title={weekdayName(weekday)}
                          onClick={() => toggleDay(row.key, weekday)}
                        >
                          {weekdayName(weekday, true)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="sp-cell sp-note">
                  <span className="sp-mini">Тэмдэглэл</span>
                  <input
                    className="ad-input"
                    value={row.note}
                    maxLength={200}
                    placeholder="Сонголттой"
                    onChange={(event) => updateRow(row.key, { note: event.target.value })}
                  />
                </label>

                <div className="sp-actions">
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
