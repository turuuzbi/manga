import { AdminConsole } from "@/app/admin/AdminConsole";
import prisma from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";

export const maxDuration = 300;

export default async function AdminPage() {
  const dbUser = await requireAdminUser();

  if (!dbUser) {
    return (
      <main className="min-h-screen bg-[#09090b] px-4 py-24 text-zinc-100">
        <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
            Admin Access
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            You do not have admin access right now.
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            This page now requires a signed-in Clerk session plus a Prisma user
            role of <span className="font-semibold text-zinc-200">ADMIN</span>.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
            If you are testing on Vercel with Clerk development keys, Clerk may
            also treat the deployed site as signed out until you switch the app
            to production keys or configure the correct environment.
          </div>
        </div>
      </main>
    );
  }

  const [mangaCount, chapterCount, pageCount, recentManga, mangaLibrary] = await Promise.all([
    prisma.manga.count(),
    prisma.chapter.count(),
    prisma.page.count(),
    prisma.manga.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        _count: {
          select: {
            chapters: true,
          },
        },
      },
    }),
    prisma.manga.findMany({
      orderBy: {
        mangaName: "asc",
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
        chapters: {
          orderBy: {
            chapterNumber: "desc",
          },
          include: {
            pages: {
              orderBy: {
                pageNumber: "asc",
              },
              select: {
                id: true,
                pageNumber: true,
                imageUrl: true,
              },
            },
            _count: {
              select: {
                pages: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <AdminConsole
      dbUser={
        {
          email: dbUser.email,
          username: dbUser.username,
          role: dbUser.role,
          createdAt: dbUser.createdAt.toISOString(),
        }
      }
      stats={{ mangaCount, chapterCount, pageCount }}
      recentManga={recentManga.map((entry: (typeof recentManga)[number]) => ({
        id: entry.id,
        mangaName: entry.mangaName,
        status: entry.status,
        chapterCount: entry._count.chapters,
      }))}
      mangaLibrary={mangaLibrary.map((entry) => ({
        id: entry.id,
        mangaName: entry.mangaName,
        description: entry.description ?? "",
        author: entry.author ?? "",
        artist: entry.artist ?? "",
        status: entry.status,
        genres: entry.genres.map((genreEntry) => genreEntry.genre.name),
        chapterCount: entry._count.chapters,
        chapters: entry.chapters.map((chapter) => ({
          id: chapter.id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title ?? "",
          publishedAt: chapter.publishedAt.toISOString(),
          pageCount: chapter._count.pages,
          pages: chapter.pages.map((page) => ({
            id: page.id,
            pageNumber: page.pageNumber,
            imageUrl: page.imageUrl,
          })),
        })),
      }))}
    />
  );
}
