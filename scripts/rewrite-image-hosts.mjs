/**
 * Points stored image URLs at a new public bucket host.
 *
 * Every image column holds the full URL, so moving the bucket from its r2.dev
 * test address to a custom domain would leave existing rows on the old host.
 * Object keys do not change, so only the URL prefix is rewritten; no file is
 * copied.
 *
 *   node scripts/rewrite-image-hosts.mjs --from https://pub-xxxx.r2.dev
 *       dry run: counts the rows per column, changes nothing
 *   node scripts/rewrite-image-hosts.mjs --from https://pub-xxxx.r2.dev --apply
 *       rewrites them, all in one transaction
 *
 * The new host is R2_PUBLIC_URL. Needs DATABASE_URL (from .env.local or the
 * environment). Re-running is safe: rows already on the new host are skipped.
 * After a dry run it also lists any other text column that still mentions the
 * old host (e.g. an article body), which this script does not touch.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync, existsSync } from "node:fs";

// Load .env the same way `next` does; this script runs outside the framework.
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const fromIndex = process.argv.indexOf("--from");
const oldBase = process.argv[fromIndex + 1]?.replace(/\/$/, "");
const newBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
const apply = process.argv.includes("--apply");

if (fromIndex === -1 || !oldBase || !newBase || !process.env.DATABASE_URL) {
  console.error(
    "Usage: node scripts/rewrite-image-hosts.mjs --from <old host URL> [--apply]\n" +
      "Needs DATABASE_URL and R2_PUBLIC_URL (the new host) in .env.local.",
  );
  process.exit(1);
}

if (oldBase === newBase) {
  console.error("The old and new hosts are the same; nothing to do.");
  process.exit(1);
}

// Single-valued columns, by table.
const COLUMNS = {
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
// text[] columns, by table.
const ARRAYS = { Manga: ["posterOptions"] };

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const prefix = `${oldBase}/`;

async function run(tx) {
  const results = [];

  for (const [table, columns] of Object.entries(COLUMNS)) {
    for (const column of columns) {
      const where = `starts_with("${column}", $2)`;
      const count = apply
        ? await tx.$executeRawUnsafe(
            `UPDATE "public"."${table}" SET "${column}" = $1 || substr("${column}", length($2) + 1) WHERE ${where}`,
            `${newBase}/`,
            prefix,
          )
        : Number(
            (
              await tx.$queryRawUnsafe(
                `SELECT count(*)::int AS n FROM "public"."${table}" WHERE ${where}`,
                `${newBase}/`,
                prefix,
              )
            )[0].n,
          );
      results.push([`${table}.${column}`, count]);
    }
  }

  for (const [table, columns] of Object.entries(ARRAYS)) {
    for (const column of columns) {
      const where = `EXISTS (SELECT 1 FROM unnest("${column}") AS u(x) WHERE starts_with(u.x, $2))`;
      const count = apply
        ? await tx.$executeRawUnsafe(
            `UPDATE "public"."${table}" SET "${column}" = ARRAY(
               SELECT CASE WHEN starts_with(u.x, $2) THEN $1 || substr(u.x, length($2) + 1) ELSE u.x END
               FROM unnest("${column}") WITH ORDINALITY AS u(x, i) ORDER BY u.i
             ) WHERE ${where}`,
            `${newBase}/`,
            prefix,
          )
        : Number(
            (
              await tx.$queryRawUnsafe(
                `SELECT count(*)::int AS n FROM "public"."${table}" WHERE ${where}`,
                `${newBase}/`,
                prefix,
              )
            )[0].n,
          );
      results.push([`${table}.${column}[]`, count]);
    }
  }

  return results;
}

try {
  const results = await prisma.$transaction(run, { timeout: 120_000 });

  console.log(`${apply ? "Rewrote" : "Would rewrite"} ${oldBase} -> ${newBase}`);
  for (const [name, count] of results) {
    console.log(`  ${name.padEnd(36)} ${count}`);
  }
  console.log(`Total rows: ${results.reduce((sum, [, n]) => sum + n, 0)}`);

  // Anything else that still mentions the old host (free text, columns added
  // since this script was written).
  const known = new Set([
    ...Object.entries(COLUMNS).flatMap(([t, cs]) => cs.map((c) => `${t}.${c}`)),
    ...Object.entries(ARRAYS).flatMap(([t, cs]) => cs.map((c) => `${t}.${c}`)),
  ]);
  const textColumns = await prisma.$queryRawUnsafe(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public'
       AND (data_type IN ('text', 'character varying') OR (data_type = 'ARRAY' AND udt_name = '_text'))`,
  );
  const stragglers = [];

  for (const { table_name: table, column_name: column } of textColumns) {
    if (known.has(`${table}.${column}`) || table.startsWith("_prisma")) continue;
    const [{ n }] = await prisma.$queryRawUnsafe(
      `SELECT count(*)::int AS n FROM "public"."${table}" WHERE position($1 in "${column}"::text) > 0`,
      oldBase,
    );
    if (n > 0) stragglers.push(`${table}.${column} (${n})`);
  }

  console.log(
    stragglers.length
      ? `Still mention the old host and are NOT handled here: ${stragglers.join(", ")}`
      : "No other column mentions the old host.",
  );
  if (!apply) console.log("Dry run only. Add --apply to write.");
} finally {
  await prisma.$disconnect();
}
