"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { scheduleTodayWeekday } from "@/lib/schedule";

function subscribe(onChange: () => void) {
  // Re-check when a tab left open past midnight comes back into view.
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/**
 * One weekday of the schedule. The page is cached for everyone, so the day it
 * was rendered on can be stale by the time it is read; the browser's own
 * Ulaanbaatar weekday decides which one is today. The server's guess is used
 * until hydration, so the markup always matches.
 */
export function ScheduleDay({
  weekday,
  label,
  serverToday,
  children,
}: {
  /** 1 = Monday … 7 = Sunday. */
  weekday: number;
  label: string;
  serverToday: number;
  children: ReactNode;
}) {
  const today = useSyncExternalStore(
    subscribe,
    () => scheduleTodayWeekday(),
    () => serverToday,
  );
  const isToday = weekday === today;

  return (
    <section className={`ys-day${isToday ? " is-today" : ""}`}>
      <header className="ys-day-head">
        <h2 className="ys-day-label">{label}</h2>
        {isToday ? (
          <span className="ys-today" aria-current="date">
            Өнөөдөр
          </span>
        ) : null}
      </header>
      {children}
    </section>
  );
}
