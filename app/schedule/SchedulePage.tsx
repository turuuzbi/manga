import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import prisma from "@/lib/db";
import {
  SCHEDULE_HREF,
  currentMonthKey,
  dateToDayKey,
  dayLabel,
  monthDateRange,
  monthLabel,
  parseMonthKey,
  scheduleMonthHref,
  scheduleTodayKey,
  shiftMonth,
} from "@/lib/schedule";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import {
  SectionHeader,
  YUME_CARD_STYLES,
} from "@/app/_components/MangaPosterCard";
import { ScheduleDay } from "@/app/schedule/ScheduleDay";

const SCHEDULE_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap');

.yume-schedule { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-schedule * { box-sizing: border-box; }

.yume-schedule .ys-top {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.yume-schedule .ys-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--home-plum-soft); text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}
.yume-schedule .ys-back:hover { color: var(--home-rose-deep); transform: translateX(-2px); }

.yume-schedule .ys-switch {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  margin-bottom: 26px; padding: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--home-paper) 92%, transparent);
  border: 1px solid var(--home-line-strong);
  box-shadow: 0 16px 36px -26px var(--home-shadow-strong), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.yume-schedule .ys-arrow {
  flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 999px;
  color: var(--home-plum); text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.yume-schedule .ys-arrow:hover { background: var(--home-paper-2); color: var(--home-rose-deep); }
.yume-schedule .ys-arrow.is-off { visibility: hidden; }
.yume-schedule .ys-month {
  min-width: 0; text-align: center;
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: clamp(20px, 5.4vw, 26px); line-height: 1.1; color: var(--home-plum);
}

.yume-schedule .ys-days { display: grid; gap: 26px; }
.yume-schedule .ys-day { transition: opacity 0.2s; }
.yume-schedule .ys-day.is-past { opacity: 0.5; }
.yume-schedule .ys-day-head {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.yume-schedule .ys-day-head::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, var(--home-line-strong), transparent);
}
.yume-schedule .ys-day-label {
  font-family: 'Cormorant Garamond', serif; font-weight: 700;
  font-size: 20px; line-height: 1.2; color: var(--home-plum);
}
.yume-schedule .ys-day.is-today .ys-day-label { color: var(--home-rose-deep); }
.yume-schedule .ys-today {
  flex-shrink: 0;
  border-radius: 999px; padding: 3px 10px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  color: #fff; background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
}

.yume-schedule .ys-entries { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.yume-schedule .ys-entry {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px 10px 10px;
  border-radius: 18px;
  text-decoration: none; color: inherit;
  background: color-mix(in srgb, var(--home-paper) 92%, transparent);
  border: 1px solid var(--home-line);
  box-shadow: 0 16px 36px -28px var(--home-shadow-strong);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s, box-shadow 0.3s;
}
.yume-schedule a.ys-entry:hover {
  transform: translateY(-2px);
  border-color: var(--home-line-strong);
  box-shadow: 0 22px 44px -28px var(--home-shadow-strong);
}
.yume-schedule .ys-day.is-today .ys-entry {
  border-color: color-mix(in srgb, var(--home-gold) 60%, var(--home-line));
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--home-gold) 16%, transparent),
    0 16px 36px -26px var(--home-shadow-strong);
}
.yume-schedule .ys-thumb {
  flex-shrink: 0; width: 52px; aspect-ratio: 3 / 4;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; border-radius: 11px;
  border: 1px solid var(--home-line);
  color: var(--home-gold);
  background: var(--home-paper-2);
}
.yume-schedule .ys-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.yume-schedule .ys-body { min-width: 0; flex: 1; display: grid; gap: 3px; }
.yume-schedule .ys-title {
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-style: italic;
  font-size: 19px; line-height: 1.15; color: var(--home-plum);
  overflow-wrap: anywhere;
}
.yume-schedule .ys-chapter {
  font-size: 13px; font-weight: 700; color: var(--home-rose-deep);
  overflow-wrap: anywhere;
}
.yume-schedule .ys-note {
  font-size: 13px; line-height: 1.5; color: var(--home-plum-soft);
  overflow-wrap: anywhere;
}
.yume-schedule .ys-go { flex-shrink: 0; color: var(--home-plum-soft); }

.yume-schedule .ys-empty {
  border-radius: 24px;
  border: 1px dashed var(--home-line-strong);
  background: color-mix(in srgb, var(--home-paper) 90%, transparent);
  padding: 56px 24px; text-align: center;
  color: var(--home-plum-soft);
}
`;

export type ScheduleItem = {
  id: string;
  title: string;
  chapterLabel: string;
  note: string | null;
  mangaId: string | null;
  imageUrl: string | null;
};

export type ScheduleDayItems = { dayKey: string; items: ScheduleItem[] };

/** Entries of one month, grouped by day in date order. */
async function loadMonth(monthKey: string): Promise<ScheduleDayItems[]> {
  const { start, end } = monthDateRange(monthKey);
  const entries = await prisma.scheduleEntry.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      date: true,
      customTitle: true,
      chapterLabel: true,
      note: true,
      manga: {
        select: {
          id: true,
          mangaName: true,
          defaultPoster: true,
          homeCoverImage: true,
          coverImage: true,
          detailCoverImage: true,
        },
      },
    },
  });

  const days = new Map<string, ScheduleItem[]>();

  for (const entry of entries) {
    const title = entry.manga?.mangaName ?? entry.customTitle?.trim();

    // A series deleted since, with no title of its own: nothing to show.
    if (!title) {
      continue;
    }

    const dayKey = dateToDayKey(entry.date);
    const list = days.get(dayKey) ?? [];
    list.push({
      id: entry.id,
      title,
      chapterLabel: entry.chapterLabel,
      note: entry.note,
      mangaId: entry.manga?.id ?? null,
      imageUrl:
        entry.manga?.defaultPoster ??
        entry.manga?.homeCoverImage ??
        entry.manga?.coverImage ??
        entry.manga?.detailCoverImage ??
        null,
    });
    days.set(dayKey, list);
  }

  // Within a day, by title, so the order does not depend on save order.
  return [...days.entries()].map(([dayKey, items]) => ({
    dayKey,
    items: items.sort((left, right) => left.title.localeCompare(right.title, "mn")),
  }));
}

function ScheduleEntryCard({ item }: { item: ScheduleItem }) {
  const content = (
    <>
      <span className="ys-thumb">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" />
        ) : (
          <CalendarDays size={20} />
        )}
      </span>
      <span className="ys-body">
        <span className="ys-title">{item.title}</span>
        <span className="ys-chapter">{item.chapterLabel}</span>
        {item.note ? <span className="ys-note">{item.note}</span> : null}
      </span>
    </>
  );

  return (
    <li>
      {item.mangaId ? (
        <Link href={`/manga/${item.mangaId}`} prefetch={false} className="ys-entry">
          {content}
          <ChevronRight size={18} className="ys-go" />
        </Link>
      ) : (
        <div className="ys-entry">{content}</div>
      )}
    </li>
  );
}

/**
 * "Хуваарь": one month of upcoming chapters as a day-by-day agenda. Identical
 * for every reader so it is cached (see the routes' `revalidate`); saving in
 * admin refreshes it at once. Which day is today is settled in the browser
 * (ScheduleDay).
 */
export async function SchedulePage({ monthKey }: { monthKey: string }) {
  return (
    <ScheduleView
      monthKey={monthKey}
      days={await loadMonth(monthKey)}
      today={scheduleTodayKey()}
      thisMonth={currentMonthKey()}
    />
  );
}

/** The page itself, from already-loaded entries. */
export function ScheduleView({
  monthKey,
  days,
  today,
  thisMonth,
}: {
  monthKey: string;
  days: ScheduleDayItems[];
  /** Ulaanbaatar day and month at render time. */
  today: string;
  thisMonth: string;
}) {
  const previous = shiftMonth(monthKey, -1);
  const next = shiftMonth(monthKey, 1);
  const hasPrevious = parseMonthKey(previous) !== null && previous !== monthKey;
  const hasNext = parseMonthKey(next) !== null && next !== monthKey;

  return (
    <>
      <style>{YUME_CARD_STYLES}</style>
      <style>{SCHEDULE_STYLES}</style>

      <div className="yume-surface yume-schedule relative min-h-screen">
        <CelestialFrame />

        <MangaTopNav />

        <main
          className="motion-ink-fade relative mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6"
          style={{ zIndex: 1 }}
        >
          <div className="ys-top motion-ink-up">
            <Link href="/" className="ys-back">
              <ChevronLeft size={14} />
              Нүүр
            </Link>
            {monthKey !== thisMonth ? (
              <Link href={SCHEDULE_HREF} className="yume-pill">
                Энэ сар
              </Link>
            ) : null}
          </div>

          <div className="mt-6">
            <SectionHeader eyebrow="Бүлэг гарах хуваарь" title="Хуваарь" />
          </div>

          <nav className="ys-switch" aria-label="Сар сонгох">
            <Link
              href={scheduleMonthHref(previous)}
              className={`ys-arrow${hasPrevious ? "" : " is-off"}`}
              aria-label={monthLabel(previous)}
              aria-hidden={!hasPrevious}
              tabIndex={hasPrevious ? undefined : -1}
              prefetch={false}
            >
              <ChevronLeft size={20} />
            </Link>
            <h2 className="ys-month" aria-live="polite">
              {monthLabel(monthKey)}
            </h2>
            <Link
              href={scheduleMonthHref(next)}
              className={`ys-arrow${hasNext ? "" : " is-off"}`}
              aria-label={monthLabel(next)}
              aria-hidden={!hasNext}
              tabIndex={hasNext ? undefined : -1}
              prefetch={false}
            >
              <ChevronRight size={20} />
            </Link>
          </nav>

          {days.length > 0 ? (
            <div className="ys-days">
              {days.map((day) => (
                <ScheduleDay
                  key={day.dayKey}
                  dayKey={day.dayKey}
                  label={dayLabel(day.dayKey)}
                  serverToday={today}
                >
                  <ul className="ys-entries">
                    {day.items.map((item) => (
                      <ScheduleEntryCard key={item.id} item={item} />
                    ))}
                  </ul>
                </ScheduleDay>
              ))}
            </div>
          ) : (
            <div className="ys-empty">Энэ сарын хуваарь удахгүй гарна.</div>
          )}
        </main>
      </div>
    </>
  );
}
