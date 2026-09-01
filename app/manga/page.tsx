import Link from "next/link";
import { ArrowLeft, Moon, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth";
import { premiumDaysRemaining } from "@/lib/plans";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import {
  MangaPosterCard,
  SectionHeader,
  YUME_CARD_STYLES,
  buildGoogleFontsHref,
  type MangaStatusValue,
} from "@/app/_components/MangaPosterCard";

export const dynamic = "force-dynamic";

const LIBRARY_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap');

.yume-library { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-library * { box-sizing: border-box; }

.yume-library .yl-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--home-plum-soft); text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}
.yume-library .yl-back:hover { color: var(--home-rose-deep); transform: translateX(-2px); }

.yume-library .yl-search {
  position: relative;
  display: flex; align-items: center;
  max-width: 460px;
}
.yume-library .yl-search svg {
  position: absolute; left: 16px;
  color: var(--home-gold); pointer-events: none;
}
.yume-library .yl-search input {
  width: 100%;
  padding: 13px 18px 13px 42px;
  border-radius: 999px;
  border: 1px solid var(--home-line);
  background: var(--home-paper);
  color: var(--home-plum);
  font-family: inherit; font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.yume-library .yl-search input::placeholder { color: var(--home-plum-soft); }
.yume-library .yl-search input:focus {
  border-color: var(--home-rose);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-rose) 16%, transparent);
}

.yume-library .yl-filters {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-top: 18px;
}
.yume-library .yl-group-label {
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--home-gold);
  width: 100%; margin-bottom: 2px;
}
.yume-library .yl-count {
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--home-plum-soft);
}
.yume-library .yl-empty {
  border-radius: 24px;
  border: 1px dashed var(--home-line-strong);
  background: var(--home-paper);
  padding: 60px 24px; text-align: center;
  color: var(--home-plum-soft);
}
`;

const STATUS_FILTERS: Array<{ value: MangaStatusValue; label: string }> = [
  { value: "ONGOING", label: "Гарч байгаа" },
  { value: "COMPLETED", label: "Дууссан" },
  { value: "CATCHING_UP", label: "Гүйцэж байна" },
  { value: "STOPPED", label: "Зогссон" },
];

const VALID_STATUSES = new Set(STATUS_FILTERS.map((entry) => entry.value));

function isStatusValue(value: string): value is MangaStatusValue {
  return VALID_STATUSES.has(value as MangaStatusValue);
}

/** Keeps the other active filters when a pill toggles one of them. */
function buildHref(params: {
  q?: string;
  genre?: string;
  status?: string;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.genre) search.set("genre", params.genre);
  if (params.status) search.set("status", params.status);

  const query = search.toString();

  return query ? `/manga?${query}` : "/manga";
}

type LibraryPageProps = {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    status?: string;
  }>;
};

export default async function MangaLibraryPage({
  searchParams,
}: LibraryPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const genre = (params.genre ?? "").trim();
  const status = (params.status ?? "").trim().toUpperCase();
  const activeStatus = isStatusValue(status) ? status : null;

  const where: Prisma.MangaWhereInput = {
    ...(query
      ? {
          OR: [
            { mangaName: { contains: query, mode: "insensitive" as const } },
            { author: { contains: query, mode: "insensitive" as const } },
            { artist: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(genre ? { genres: { some: { genre: { is: { name: genre } } } } } : {}),
    ...(activeStatus ? { status: activeStatus } : {}),
  };

  const [currentUser, mangas, genreFilters] = await Promise.all([
    getCurrentDbUser(),
    prisma.manga.findMany({
      where,
      orderBy: { mangaName: "asc" },
      include: {
        genres: { include: { genre: true } },
        chapters: {
          orderBy: { chapterNumber: "desc" },
          take: 1,
          select: { chapterNumber: true },
        },
      },
    }),
    prisma.genre.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { mangas: true } } },
    }),
  ]);

  const series = mangas.map((manga) => ({
    id: manga.id,
    title: manga.mangaName,
    genres: manga.genres.map((entry) => entry.genre.name),
    latestChapter: manga.chapters[0]?.chapterNumber ?? 0,
    coverUrl:
      manga.defaultPoster ??
      manga.homeCoverImage ??
      manga.coverImage ??
      undefined,
    status: manga.status,
    titleFont: manga.titleFont ?? null,
  }));

  const customFontsHref = buildGoogleFontsHref(
    series
      .map((manga) => manga.titleFont ?? "")
      .filter(Boolean) as string[],
  );

  const headingTitle = query ? `"${query}" хайлт` : "Бүх манга";

  return (
    <>
      {customFontsHref ? (
        <link rel="stylesheet" href={customFontsHref} />
      ) : null}
      <style>{YUME_CARD_STYLES}</style>
      <style>{LIBRARY_STYLES}</style>

      <div className="yume-surface yume-library relative min-h-screen">
        <CelestialFrame />

        <MangaTopNav
          navLinks={[
            { label: "Нүүр", href: "/" },
            { label: "Сан", href: "/manga" },
            { label: "Бидний тухай", href: "/about" },
          ]}
          isAdmin={currentUser?.role === "ADMIN"}
          premiumDaysLeft={premiumDaysRemaining(currentUser)}
        />

        <main className="motion-ink-fade relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-8 md:px-8">
          <Link href="/" className="motion-ink-up yl-back">
            <ArrowLeft size={15} />
            Нүүр
          </Link>

          <div className="motion-ink-up mt-6">
            <SectionHeader eyebrow="Бүх цуглуулга" title={headingTitle} />
          </div>

          <form action="/manga" className="motion-ink-up yl-search">
            <Search size={15} />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Цуврал, зохиолч хайх..."
              aria-label="Хайх"
            />
            {genre ? <input type="hidden" name="genre" value={genre} /> : null}
            {activeStatus ? (
              <input type="hidden" name="status" value={activeStatus} />
            ) : null}
          </form>

          <div className="motion-ink-up yl-filters">
            <span className="yl-group-label">Төлөв</span>
            <Link
              href={buildHref({ q: query, genre })}
              className={`yume-pill${activeStatus === null ? " active" : ""}`}
            >
              Бүгд
            </Link>
            {STATUS_FILTERS.map((entry) => (
              <Link
                key={entry.value}
                href={buildHref({
                  q: query,
                  genre,
                  status: activeStatus === entry.value ? undefined : entry.value,
                })}
                className={`yume-pill${activeStatus === entry.value ? " active" : ""}`}
              >
                {entry.label}
              </Link>
            ))}
          </div>

          <div className="motion-ink-up yl-filters mb-8">
            <span className="yl-group-label">Төрөл</span>
            <Link
              href={buildHref({ q: query, status: activeStatus ?? undefined })}
              className={`yume-pill${genre ? "" : " active"}`}
            >
              Бүгд
            </Link>
            {genreFilters.map((entry) => (
              <Link
                key={entry.name}
                href={buildHref({
                  q: query,
                  genre: genre === entry.name ? undefined : entry.name,
                  status: activeStatus ?? undefined,
                })}
                title={`${entry._count.mangas} манга`}
                className={`yume-pill${genre === entry.name ? " active" : ""}`}
              >
                {entry.name}
              </Link>
            ))}
          </div>

          <p className="yl-count mb-5">{series.length} цуврал</p>

          {series.length > 0 ? (
            <div className="yume-grid">
              {series.map((manga, index) => (
                <MangaPosterCard
                  key={manga.id}
                  manga={manga}
                  activeGenre={genre || null}
                  delayIndex={index}
                />
              ))}
            </div>
          ) : (
            <div className="yl-empty">
              <Moon size={26} style={{ color: "var(--home-gold)" }} />
              <p
                className="mt-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22,
                }}
              >
                {query
                  ? `"${query}"-д тохирох манга олдсонгүй.`
                  : "Энэ шүүлтэд тохирох манга алга байна."}
              </p>
              <Link href="/manga" className="yume-viewall mt-4 inline-flex">
                Шүүлтийг цэвэрлэх
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
