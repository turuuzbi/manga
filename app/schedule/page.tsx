import type { Metadata } from "next";
import { SchedulePage } from "@/app/schedule/SchedulePage";
import { currentMonthKey } from "@/lib/schedule";

// The same for every reader, so served from the cache. Saving the schedule in
// admin revalidates it at once; this is the fallback refresh, and also how
// the page moves on to a new month.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Хуваарь — ЮҮМЭ Орчуулагч",
};

export default function ScheduleCurrentMonthPage() {
  return <SchedulePage monthKey={currentMonthKey()} />;
}
