import type { Prisma } from "@prisma/client";

/**
 * The featured slider's images for one series. Each device has its own art
 * (1:1 phone, 16:9 desktop); a missing one borrows the other device's image,
 * and only when both are missing does the slide fall back to the poster. The
 * poster fields themselves are never written from here — the detail page's
 * poster stays independent of the slider.
 */
export function featuredSlideImages(
  manga: {
    featuredImageMobile: string | null;
    featuredImageDesktop: string | null;
  },
  poster: string | undefined,
): { mobileImage?: string; desktopImage?: string } {
  return {
    mobileImage: manga.featuredImageMobile ?? manga.featuredImageDesktop ?? poster,
    desktopImage: manga.featuredImageDesktop ?? manga.featuredImageMobile ?? poster,
  };
}

/**
 * Seats a series in the hero slider ("Онцлох слайдер") and renumbers the whole
 * line-up 1, 2, 3, … with no repeats or gaps. Asking for position N puts the
 * series there and moves the one at N, and every one after it, down a place;
 * a blank position keeps its current place (or the end, if it is new);
 * leaving the slider closes the gap. Runs inside the caller's transaction, and
 * the lock makes two admins saving at once take turns instead of interleaving.
 */
export async function placeInFeaturedSlider(
  tx: Prisma.TransactionClient,
  mangaId: string,
  isFeatured: boolean,
  position: number | null,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"featured-order"}))`;

  const [self, others] = await Promise.all([
    tx.manga.findUnique({ where: { id: mangaId }, select: { featuredOrder: true } }),
    // The homepage's order: by position, unnumbered ones last, then title.
    tx.manga.findMany({
      where: { isFeatured: true, id: { not: mangaId } },
      orderBy: [
        { featuredOrder: { sort: "asc", nulls: "last" } },
        { mangaName: "asc" },
      ],
      select: { id: true, featuredOrder: true },
    }),
  ]);

  const lineUp = others.map((entry) => entry.id);

  if (isFeatured) {
    const wanted = position ?? self?.featuredOrder ?? lineUp.length + 1;
    lineUp.splice(Math.min(Math.max(wanted, 1), lineUp.length + 1) - 1, 0, mangaId);
  }

  const currentOrder = new Map(others.map((entry) => [entry.id, entry.featuredOrder]));
  currentOrder.set(mangaId, self?.featuredOrder ?? null);

  for (const [index, id] of lineUp.entries()) {
    if (currentOrder.get(id) !== index + 1) {
      await tx.manga.update({ where: { id }, data: { featuredOrder: index + 1 } });
    }
  }

  if (!isFeatured && self?.featuredOrder != null) {
    await tx.manga.update({ where: { id: mangaId }, data: { featuredOrder: null } });
  }
}
