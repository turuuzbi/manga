import { redirect } from "next/navigation";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MangaIndexPage() {
  const firstManga = await prisma.manga.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
    },
  });

  if (firstManga) {
    redirect(`/manga/${firstManga.id}`);
  }

  redirect("/");
}
