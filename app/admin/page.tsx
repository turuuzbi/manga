import { AdminConsole } from "@/app/admin/AdminConsole";
import prisma from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";

export const maxDuration = 300;

export default async function AdminPage() {
  const dbUser = await requireAdminUser();

  if (!dbUser) {
    return (
      <main className="yume-surface min-h-screen px-4 py-24">
        <div
          className="mx-auto max-w-xl p-8"
          style={{
            borderRadius: 26,
            border: "1px solid var(--home-line-strong)",
            background:
              "color-mix(in srgb, var(--home-paper) 86%, transparent)",
            boxShadow:
              "0 30px 60px -30px var(--home-shadow-strong), inset 0 1px 0 rgba(255,255,255,0.5)",
            backdropFilter: "blur(10px)",
          }}
        >
          <p
            style={{
              fontFamily: "'Marcellus', serif",
              fontSize: 11,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--home-gold)",
            }}
          >
            Удирдлагын самбар
          </p>
          <h1
            className="mt-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "2.4rem",
              color: "var(--home-plum)",
            }}
          >
            Танд админы эрх алга байна.
          </h1>
        </div>
      </main>
    );
  }

  const [mangaCount, chapterCount, pageCount, recentManga, mangaLibrary] =
    await Promise.all([
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
      dbUser={{
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        createdAt: dbUser.createdAt.toISOString(),
      }}
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
        coverImage: entry.coverImage ?? "",
        homeCoverImage: entry.homeCoverImage ?? "",
        detailCoverImage: entry.detailCoverImage ?? "",
        titleFont: entry.titleFont ?? "",
        author: entry.author ?? "",
        artist: entry.artist ?? "",
        status: entry.status,
        genres: entry.genres.map((genreEntry) => genreEntry.genre.name),
        chapterCount: entry._count.chapters,
        chapters: entry.chapters.map((chapter) => ({
          id: chapter.id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title ?? "",
          coverImage: chapter.coverImage ?? "",
          badgeImage: chapter.badgeImage ?? "",
          badgeScale: chapter.badgeScale ?? null,
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
