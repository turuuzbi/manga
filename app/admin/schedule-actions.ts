"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { normalizeWeekdays } from "@/lib/schedule";

export type AdminScheduleEntry = {
  id: string;
  mangaId: string | null;
  customTitle: string;
  /** ISO weekdays, 1 = Monday … 7 = Sunday, ascending. */
  weekdays: number[];
  note: string;
};

/** A row as the panel sends it; id is null for a row not saved yet. */
export type ScheduleRowInput = {
  id: string | null;
  mangaId: string | null;
  customTitle: string;
  weekdays: number[];
  note: string;
};

export type ScheduleSaveResult = {
  ok: boolean;
  message: string;
  /** The schedule as saved, in display order. */
  entries?: AdminScheduleEntry[];
};

const MAX_ROWS = 200;
const MAX_TITLE_LENGTH = 120;
const MAX_NOTE_LENGTH = 200;

async function loadSchedule(): Promise<AdminScheduleEntry[]> {
  const rows = await prisma.weeklyScheduleEntry.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      mangaId: true,
      customTitle: true,
      weekdays: true,
      note: true,
      manga: { select: { mangaName: true } },
    },
  });

  // By first weekday, then title — roughly the public page's reading order.
  return rows
    .map((row) => ({
      entry: {
        id: row.id,
        mangaId: row.mangaId,
        customTitle: row.customTitle ?? "",
        weekdays: normalizeWeekdays(row.weekdays),
        note: row.note ?? "",
      },
      title: row.manga?.mangaName ?? row.customTitle ?? "",
    }))
    .sort(
      (left, right) =>
        (left.entry.weekdays[0] ?? 8) - (right.entry.weekdays[0] ?? 8) ||
        left.title.localeCompare(right.title, "mn"),
    )
    .map((row) => row.entry);
}

export async function listWeeklyScheduleAction(): Promise<AdminScheduleEntry[] | null> {
  if (!(await requireAdminUser())) {
    return null;
  }

  return loadSchedule();
}

/**
 * Saves the whole weekly schedule as the panel shows it: rows with an id are
 * updated (only when something changed), rows without one are created, and
 * saved rows missing from the list are deleted.
 */
export async function saveWeeklyScheduleAction(
  rows: ScheduleRowInput[],
): Promise<ScheduleSaveResult> {
  if (!(await requireAdminUser())) {
    return { ok: false, message: "Админ эрх шаардлагатай." };
  }

  if (!Array.isArray(rows)) {
    return { ok: false, message: "Хүсэлт буруу байна." };
  }

  if (rows.length > MAX_ROWS) {
    return { ok: false, message: `${MAX_ROWS}-аас олон мөр хадгалах боломжгүй.` };
  }

  const clean: ScheduleRowInput[] = [];
  const seenSeries = new Set<string>();

  for (const [index, row] of rows.entries()) {
    const line = `${index + 1}-р мөр`;
    const mangaId = typeof row?.mangaId === "string" && row.mangaId ? row.mangaId : null;
    const customTitle = mangaId ? "" : String(row?.customTitle ?? "").trim();
    const weekdays = normalizeWeekdays(row?.weekdays);
    const note = String(row?.note ?? "").trim();

    if (!mangaId && !customTitle) {
      return { ok: false, message: `${line}: цуврал сонгох эсвэл гарчиг бичнэ үү.` };
    }
    if (weekdays.length === 0) {
      return { ok: false, message: `${line}: гарах өдрөө сонгоно уу.` };
    }
    if (customTitle.length > MAX_TITLE_LENGTH || note.length > MAX_NOTE_LENGTH) {
      return { ok: false, message: `${line}: текст хэт урт байна.` };
    }

    // One row per series: its days are all picked on that row.
    const seriesKey = mangaId ?? `title:${customTitle.toLowerCase()}`;
    if (seenSeries.has(seriesKey)) {
      return {
        ok: false,
        message: `${line}: энэ цуврал өмнөх мөрөнд байна. Өдрүүдийг нэг мөрөнд сонгоно уу.`,
      };
    }
    seenSeries.add(seriesKey);

    clean.push({
      id: typeof row?.id === "string" && row.id ? row.id : null,
      mangaId,
      customTitle,
      weekdays,
      note,
    });
  }

  const mangaIds = clean.flatMap((row) => (row.mangaId ? [row.mangaId] : []));
  const [foundManga, existing] = await Promise.all([
    prisma.manga.findMany({ where: { id: { in: mangaIds } }, select: { id: true } }),
    prisma.weeklyScheduleEntry.findMany({
      select: { id: true, mangaId: true, customTitle: true, weekdays: true, note: true },
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
      saved.mangaId !== row.mangaId ||
      (saved.customTitle ?? "") !== row.customTitle ||
      normalizeWeekdays(saved.weekdays).join() !== row.weekdays.join() ||
      (saved.note ?? "") !== row.note;

    if (changed) {
      updates.push({ id: row.id, row });
    }
  }

  const deletedIds = existing
    .map((entry) => entry.id)
    .filter((id) => !keptIds.has(id));

  const data = (row: ScheduleRowInput) => ({
    mangaId: row.mangaId,
    customTitle: row.customTitle || null,
    weekdays: row.weekdays,
    note: row.note || null,
  });

  await prisma.$transaction([
    prisma.weeklyScheduleEntry.deleteMany({ where: { id: { in: deletedIds } } }),
    ...updates.map(({ id, row }) =>
      prisma.weeklyScheduleEntry.update({ where: { id }, data: data(row) }),
    ),
    prisma.weeklyScheduleEntry.createMany({ data: creates.map(data) }),
  ]);

  // The public schedule is cached; show a save at once.
  revalidatePath("/schedule");

  return {
    ok: true,
    message: `Хадгаллаа: ${creates.length} нэмсэн, ${updates.length} зассан, ${deletedIds.length} устгасан.`,
    entries: await loadSchedule(),
  };
}
