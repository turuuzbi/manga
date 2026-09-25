import type { Metadata } from "next";
import { UpdatesPage } from "@/app/updates/UpdatesPage";

// The same for every reader, so served from the cache: a cached hit runs no
// server code. Publishing or editing a chapter in admin revalidates it at once
// (revalidateSeriesSurfaces); this is only the fallback refresh.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Сүүлийн шинэчлэл — ЮҮМЭ Орчуулагч",
};

export default function UpdatesFirstPage() {
  return <UpdatesPage page={1} />;
}
