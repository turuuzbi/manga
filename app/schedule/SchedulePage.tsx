import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import prisma from "@/lib/db";
import {
  WEEKDAYS,
  normalizeWeekdays,
  scheduleTodayWeekday,
  weekdayName,
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

/* Phones: the seven days as one list, Monday first. */
.yume-schedule .ys-week { display: grid; gap: 22px; }
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
.yume-schedule .ys-none {
  margin: 0; padding: 2px 4px;
  font-size: 13px; color: var(--home-plum-soft); opacity: 0.6;
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
.yume-schedule .ys-note {
  font-size: 13px; line-height: 1.5; color: var(--home-plum-soft);
  overflow-wrap: anywhere;
}
.yume-schedule .ys-go { flex-shrink: 0; color: var(--home-plum-soft); }

/* Wide screens: Monday to Sunday side by side, one column per day. */
@media (min-width: 1024px) {
  .yume-schedule .ys-week { grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; }
  .yume-schedule .ys-day {
    min-width: 0; padding: 12px 10px 14px;
    border-radius: 20px;
    background: color-mix(in srgb, var(--home-paper) 70%, transparent);
    border: 1px solid var(--home-line);
  }
  .yume-schedule .ys-day.is-today {
    border-color: color-mix(in srgb, var(--home-gold) 60%, var(--home-line));
  }
  .yume-schedule .ys-day-head { flex-wrap: wrap; justify-content: center; gap: 6px; }
  .yume-schedule .ys-day-head::after { flex-basis: 100%; }
  .yume-schedule .ys-day-label { font-size: 18px; }
  .yume-schedule .ys-none { text-align: center; }
  .yume-schedule .ys-entry { flex-direction: column; align-items: stretch; gap: 8px; padding: 8px; border-radius: 14px; }
  .yume-schedule .ys-thumb { width: 100%; }
  .yume-schedule .ys-title { font-size: 16px; }
  .yume-schedule .ys-note { font-size: 12px; }
  .yume-schedule .ys-go { display: none; }
}

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
  note: string | null;
  mangaId: string | null;
  imageUrl: string | null;
};

/** The schedule's series grouped by weekday (1 = Monday … 7 = Sunday). */
async function loadWeek(): Promise<Map<number, ScheduleItem[]>> {
  const entries = await prisma.weeklyScheduleEntry.findMany({
    select: {
      id: true,
      customTitle: true,
      weekdays: true,
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

  const week = new Map<number, ScheduleItem[]>(WEEKDAYS.map((day) => [day, []]));

  for (const entry of entries) {
    const title = entry.manga?.mangaName ?? entry.customTitle?.trim();

    // A series deleted since, with no title of its own: nothing to show.
    if (!title) {
      continue;
    }

    const item: ScheduleItem = {
      id: entry.id,
      title,
      note: entry.note,
      mangaId: entry.manga?.id ?? null,
      imageUrl:
        entry.manga?.defaultPoster ??
        entry.manga?.homeCoverImage ??
        entry.manga?.coverImage ??
        entry.manga?.detailCoverImage ??
        null,
    };

    for (const weekday of normalizeWeekdays(entry.weekdays)) {
      week.get(weekday)?.push(item);
    }
  }

  // Within a day, by title, so the order does not depend on save order.
  for (const items of week.values()) {
    items.sort((left, right) => left.title.localeCompare(right.title, "mn"));
  }

  return week;
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
 * "Хуваарь": which series come out on which weekday, every week, Monday to
 * Sunday. Identical for every reader so it is cached (see the route's
 * `revalidate`); saving in admin refreshes it at once. Which day is today is
 * settled in the browser (ScheduleDay).
 */
export async function SchedulePage() {
  const week = await loadWeek();
  const hasEntries = [...week.values()].some((items) => items.length > 0);
  const today = scheduleTodayWeekday();

  return (
    <>
      <style>{YUME_CARD_STYLES}</style>
      <style>{SCHEDULE_STYLES}</style>

      <div className="yume-surface yume-schedule relative min-h-screen">
        <CelestialFrame />

        <MangaTopNav />

        <main
          className="motion-ink-fade relative mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:max-w-6xl"
          style={{ zIndex: 1 }}
        >
          <div className="ys-top motion-ink-up">
            <Link href="/" className="ys-back">
              <ChevronLeft size={14} />
              Нүүр
            </Link>
          </div>

          <div className="mt-6">
            <SectionHeader eyebrow="Долоо хоногийн хуваарь" title="Хуваарь" />
            {/* Weekdays can read like a promise; say plainly that chapters
                still go out by hand. */}
            <p className="ys-note -mt-2 mb-6">
              Хуваарийг өдөр бүр биш, гараар гаргана.
            </p>
          </div>

          {hasEntries ? (
            <div className="ys-week">
              {WEEKDAYS.map((weekday) => {
                const items = week.get(weekday) ?? [];

                return (
                  <ScheduleDay
                    key={weekday}
                    weekday={weekday}
                    label={weekdayName(weekday)}
                    serverToday={today}
                  >
                    {items.length > 0 ? (
                      <ul className="ys-entries">
                        {items.map((item) => (
                          <ScheduleEntryCard key={item.id} item={item} />
                        ))}
                      </ul>
                    ) : (
                      <p className="ys-none">—</p>
                    )}
                  </ScheduleDay>
                );
              })}
            </div>
          ) : (
            <div className="ys-empty">Хуваарь удахгүй гарна.</div>
          )}
        </main>
      </div>
    </>
  );
}
