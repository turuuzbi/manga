import type { Metadata } from "next";
import { SchedulePage } from "@/app/schedule/SchedulePage";

// The same for every reader, so served from the cache. Saving the schedule in
// admin revalidates it at once; this is the fallback refresh.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Хуваарь — ЮҮМЭ Орчуулагч",
};

export default function ScheduleWeekPage() {
  return <SchedulePage />;
}
