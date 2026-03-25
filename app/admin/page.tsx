import { AdminConsole } from "@/app/admin/AdminConsole";
import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";

export default async function AdminPage() {
  const dbUser = await syncCurrentClerkUser();

  const [mangaCount, chapterCount, pageCount, recentManga] = await Promise.all([
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
  ]);

  return (
    <AdminConsole
      dbUser={
        dbUser
          ? {
              email: dbUser.email,
              username: dbUser.username,
              role: dbUser.role,
              createdAt: dbUser.createdAt.toISOString(),
            }
          : null
      }
      stats={{ mangaCount, chapterCount, pageCount }}
      recentManga={recentManga.map((entry) => ({
        id: entry.id,
        mangaName: entry.mangaName,
        status: entry.status,
        chapterCount: entry._count.chapters,
      }))}
    />
  );
}
