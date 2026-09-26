"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  dateToDayKey,
  dayKeyToDate,
  isDayKey,
  monthDateRange,
  parseMonthKey,
} from "@/lib/schedule";

export type AdminScheduleEntry = {
  id: string;
  /** "YYYY-MM-DD" */
  date: string;
  mangaId: string | null;
  customTitle: string;
  chapterLabel: string;
  note: string;
};

/** A row as the panel sends it; id is null for a row not saved yet. */
export type ScheduleRowInput = {
  id: string | null;
  date: string;
  mangaId: string | null;
  customTitle: string;
  chapterLabel: string;
  note: string;
};

export type ScheduleSaveResult = {
  ok: boolean;
  message: string;
  /** The month as saved, in display order. */
  entries?: AdminScheduleEntry[];
};

const MAX_ROWS = 300;
const MAX_TITLE_LENGTH = 120;
const MAX_LABEL_LENGTH = 60;
const MAX_NOTE_LENGTH = 200;

async function loadMonth(monthKey: string): Promise<AdminScheduleEntry[]> {
  const { start, end } = monthDateRange(monthKey);
  const rows = await prisma.scheduleEntry.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      date: true,
      mangaId: true,
      customTitle: true,
      chapterLabel: true,
      note: true,
      manga: { select: { mangaName: true } },
    },
  });

  // The public page's order: by day, then title.
  return rows
    .map((row) => ({
      entry: {
        id: row.id,
        date: dateToDayKey(row.date),
        mangaId: row.mangaId,
        customTitle: row.customTitle ?? "",
        chapterLabel: row.chapterLabel,
        note: row.note ?? "",
      },
      title: row.manga?.mangaName ?? row.customTitle ?? "",
    }))
    .sort(
      (left, right) =>
        left.entry.date.localeCompare(right.entry.date) ||
        left.title.localeCompare(right.title, "mn"),
    )
    .map((row) => row.entry);
}

/** The public schedule is cached; show a save at once. */
function revalidateSchedule() {
  revalidatePath("/schedule");
  revalidatePath("/schedule/[month]", "page");
}

export async function listScheduleMonthAction(
  monthKey: string,
): Promise<AdminScheduleEntry[] | null> {
  if (!(await requireAdminUser()) || !parseMonthKey(monthKey)) {
    return null;
  }

  return loadMonth(monthKey);
}

/**
 * Saves one month as the panel shows it: rows with an id are updated (only
 * when something changed), rows without one are created, and this month's
 * entries missing from the list are deleted. A row may carry a date in
 * another month; it simply moves there.
 */
export async function saveScheduleMonthAction(
  monthKey: string,
  rows: ScheduleRowInput[],
): Promise<ScheduleSaveResult> {
  if (!(await requireAdminUser())) {
    return { ok: false, message: "Админ эрх шаардлагатай." };
  }

  if (!parseMonthKey(monthKey) || !Array.isArray(rows)) {
    return { ok: false, message: "Хүсэлт буруу байна." };
  }

  if (rows.length > MAX_ROWS) {
    return { ok: false, message: `Нэг сард ${MAX_ROWS}-аас олон мөр хадгалах боломжгүй.` };
  }

  const clean: ScheduleRowInput[] = [];

  for (const [index, row] of rows.entries()) {
    const line = `${index + 1}-р мөр`;
    const date = String(row?.date ?? "");
    const mangaId = typeof row?.mangaId === "string" && row.mangaId ? row.mangaId : null;
    const customTitle = mangaId ? "" : String(row?.customTitle ?? "").trim();
    const chapterLabel = String(row?.chapterLabel ?? "").trim();
    const note = String(row?.note ?? "").trim();

    if (!isDayKey(date)) {
      return { ok: false, message: `${line}: огноо буруу байна.` };
    }
    if (!mangaId && !customTitle) {
      return { ok: false, message: `${line}: цуврал сонгох эсвэл гарчиг бичнэ үү.` };
    }
    if (!chapterLabel) {
      return { ok: false, message: `${line}: бүлгээ бичнэ үү.` };
    }
    if (
      customTitle.length > MAX_TITLE_LENGTH ||
      chapterLabel.length > MAX_LABEL_LENGTH ||
      note.length > MAX_NOTE_LENGTH
    ) {
      return { ok: false, message: `${line}: текст хэт урт байна.` };
    }

    clean.push({
      id: typeof row?.id === "string" && row.id ? row.id : null,
      date,
      mangaId,
      customTitle,
      chapterLabel,
      note,
    });
  }

  const mangaIds = [...new Set(clean.flatMap((row) => (row.mangaId ? [row.mangaId] : [])))];
  const { start, end } = monthDateRange(monthKey);
  const [foundManga, existing] = await Promise.all([
    prisma.manga.findMany({ where: { id: { in: mangaIds } }, select: { id: true } }),
    prisma.scheduleEntry.findMany({
      where: { date: { gte: start, lt: end } },
      select: {
        id: true,
        date: true,
        mangaId: true,
        customTitle: true,
        chapterLabel: true,
        note: true,
      },
    }),
  ]);

  if (foundManga.length !== mangaIds.length) {
    return {
      ok: false,
      message: "Сонгосон цувралын нэг нь олдсонгүй. Хуудсаа сэргээгээд дахин оролдоно уу.",
    };
  }

  const existingById = new Map(existing.map((entry) => [entry.id, entry]));
  const keptIds = new Set<string>();
  const updates: Array<{ id: string; row: ScheduleRowInput }> = [];
  const creates: ScheduleRowInput[] = [];

  for (const row of clean) {
    const saved = row.id ? existingById.get(row.id) : undefined;

    // Unknown ids (deleted meanwhile in another tab) are saved as new rows.
    if (!row.id || !saved || keptIds.has(row.id)) {
      creates.push(row);
      continue;
    }

    keptIds.add(row.id);

    const changed =
      dateToDayKey(saved.date) !== row.date ||
      saved.mangaId !== row.mangaId ||
      (saved.customTitle ?? "") !== row.customTitle ||
      saved.chapterLabel !== row.chapterLabel ||
      (saved.note ?? "") !== row.note;

    if (changed) {
      updates.push({ id: row.id, row });
    }
  }

  const deletedIds = existing
    .map((entry) => entry.id)
    .filter((id) => !keptIds.has(id));

  const data = (row: ScheduleRowInput) => ({
    date: dayKeyToDate(row.date),
    mangaId: row.mangaId,
    customTitle: row.customTitle || null,
    chapterLabel: row.chapterLabel,
    note: row.note || null,
  });

  await prisma.$transaction([
    prisma.scheduleEntry.deleteMany({ where: { id: { in: deletedIds } } }),
    ...updates.map(({ id, row }) =>
      prisma.scheduleEntry.update({ where: { id }, data: data(row) }),
    ),
    prisma.scheduleEntry.createMany({ data: creates.map(data) }),
  ]);

  revalidateSchedule();

  return {
    ok: true,
    message: `Хадгаллаа: ${creates.length} нэмсэн, ${updates.length} зассан, ${deletedIds.length} устгасан.`,
    entries: await loadMonth(monthKey),
  };
}
