import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchedulePage } from "@/app/schedule/SchedulePage";
import { monthLabel, parseMonthKey } from "@/lib/schedule";

// Any other month, as /schedule/2026-10. Built on first request, then cached
// like /schedule.
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ month: string }>;
}): Promise<Metadata> {
  const { month } = await params;

  return {
    title: parseMonthKey(month)
      ? `Хуваарь · ${monthLabel(month)} — ЮҮМЭ Орчуулагч`
      : "Хуваарь — ЮҮМЭ Орчуулагч",
  };
}

export default async function ScheduleMonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;

  if (!parseMonthKey(month)) {
    notFound();
  }

  return <SchedulePage monthKey={month} />;
}
