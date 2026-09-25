import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { UpdatesPage } from "@/app/updates/UpdatesPage";

// Older pages of the chapter feed. A path segment rather than ?page=: reading
// search params would force every view to render on the server. Built on
// first request, then cached like /updates.
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = {
  title: "Сүүлийн шинэчлэл — ЮҮМЭ Орчуулагч",
};

export default async function UpdatesPagedPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: raw } = await params;
  const page = Number(raw);

  if (!Number.isInteger(page) || page < 1 || page > 1000) {
    notFound();
  }

  if (page === 1) {
    permanentRedirect("/updates");
  }

  return <UpdatesPage page={page} />;
}
