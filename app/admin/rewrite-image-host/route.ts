import prisma from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";

/**
 * TEMPORARY, admin only: points stored image URLs at R2_PUBLIC_URL instead of
 * the hosts in R2_LEGACY_PUBLIC_URLS (the same rewrite as
 * scripts/rewrite-image-hosts.mjs, for when no shell can reach the database).
 * GET counts the rows; GET ?apply=1 rewrites them in one transaction. Safe to
 * repeat. Delete this route once the rewrite has run.
 */
export const dynamic = "force-dynamic";

const COLUMNS: Record<string, string[]> = {
  Manga: [
    "coverImage",
    "homeCoverImage",
    "detailCoverImage",
    "defaultPoster",
    "featuredImageDesktop",
    "featuredImageMobile",
    "promoImageUrl",
    "rewardBackgroundUrl",
    "rewardBackgroundOriginalUrl",
  ],
  Chapter: ["coverImage", "badgeImage"],
  Page: ["imageUrl"],
  User: ["avatarUrl"],
  UserPosterChoice: ["posterUrl"],
  Article: ["imageUrl"],
  UserReward: ["imageUrl", "originalUrl"],
};

export async function GET(request: Request) {
  const admin = await requireAdminUser();

  if (!admin) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const apply = new URL(request.url).searchParams.get("apply") === "1";
  const newBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  const oldBases = (process.env.R2_LEGACY_PUBLIC_URLS ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter((value) => value && value !== newBase);

  if (!newBase || oldBases.length === 0) {
    return Response.json(
      { error: "R2_PUBLIC_URL and R2_LEGACY_PUBLIC_URLS must both be set" },
      { status: 400 },
    );
  }

  const counts = await prisma.$transaction(
    async (tx) => {
      const result: Record<string, number> = {};

      for (const oldBase of oldBases) {
        const prefix = `${oldBase}/`;

        for (const [table, columns] of Object.entries(COLUMNS)) {
          for (const column of columns) {
            const key = `${table}.${column}`;
            const count = apply
              ? await tx.$executeRawUnsafe(
                  `UPDATE "public"."${table}" SET "${column}" = $1 || substr("${column}", length($2) + 1) WHERE starts_with("${column}", $2)`,
                  `${newBase}/`,
                  prefix,
                )
              : Number(
                  (
                    await tx.$queryRawUnsafe<{ n: number }[]>(
                      `SELECT count(*)::int AS n FROM "public"."${table}" WHERE starts_with("${column}", $1)`,
                      prefix,
                    )
                  )[0].n,
                );

            result[key] = (result[key] ?? 0) + count;
          }
        }

        const where = `EXISTS (SELECT 1 FROM unnest("posterOptions") AS y(v) WHERE starts_with(y.v, $1))`;
        const key = "Manga.posterOptions[]";
        const count = apply
          ? await tx.$executeRawUnsafe(
              `UPDATE "public"."Manga" SET "posterOptions" = ARRAY(
                 SELECT CASE WHEN starts_with(x.v, $2) THEN $1 || substr(x.v, length($2) + 1) ELSE x.v END
                 FROM unnest("posterOptions") WITH ORDINALITY AS x(v, i) ORDER BY x.i
               ) WHERE EXISTS (SELECT 1 FROM unnest("posterOptions") AS y(v) WHERE starts_with(y.v, $2))`,
              `${newBase}/`,
              prefix,
            )
          : Number(
              (
                await tx.$queryRawUnsafe<{ n: number }[]>(
                  `SELECT count(*)::int AS n FROM "public"."Manga" WHERE ${where}`,
                  prefix,
                )
              )[0].n,
            );

        result[key] = (result[key] ?? 0) + count;
      }

      return result;
    },
    { timeout: 60_000 },
  );

  return Response.json({
    mode: apply ? "rewrote" : "dry run (add ?apply=1 to rewrite)",
    from: oldBases,
    to: newBase,
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
    counts,
  });
}
