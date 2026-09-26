"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { scheduleTodayKey } from "@/lib/schedule";

function subscribe(onChange: () => void) {
  // Re-check when a tab left open past midnight comes back into view.
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/**
 * One day of the schedule. The page is cached for everyone, so the day it
 * was rendered on can be stale by the time it is read; the browser's own
 * Ulaanbaatar date decides which day is today and which are past. The server's
 * guess is used until hydration, so the markup always matches.
 */
export function ScheduleDay({
  dayKey,
  label,
  serverToday,
  children,
}: {
  dayKey: string;
  label: string;
  serverToday: string;
  children: ReactNode;
}) {
  const today = useSyncExternalStore(
    subscribe,
    () => scheduleTodayKey(),
    () => serverToday,
  );
  const state = dayKey === today ? "today" : dayKey < today ? "past" : "upcoming";

  return (
    <section className={`ys-day is-${state}`}>
      <header className="ys-day-head">
        <h2 className="ys-day-label">
          <time dateTime={dayKey}>{label}</time>
        </h2>
        {state === "today" ? (
          <span className="ys-today" aria-current="date">
            Өнөөдөр
          </span>
        ) : null}
      </header>
      {children}
    </section>
  );
}
