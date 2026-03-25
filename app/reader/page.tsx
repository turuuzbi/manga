import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReaderPage() {
  const firstChapter = await prisma.chapter.findFirst({
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        chapterNumber: "asc",
      },
    ],
    select: {
      id: true,
    },
  });

  if (firstChapter) {
    redirect(`/reader/${firstChapter.id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-zinc-100">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.38)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Reader
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          No chapters are ready yet.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Import a manga chapter from the admin panel, then the reader will
          route here automatically.
        </p>
        <div className="mt-6">
          <Link
            href="/admin"
            className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Open Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
