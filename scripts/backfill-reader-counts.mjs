/**
 * Rebuilds Manga.readerCount from ReadingProgress.
 *
 * A reader is a distinct signed-in user with at least one ReadingProgress row
 * for the series — the same definition the live counter maintains. The initial
 * migration already backfilled once; this exists to re-run afterwards, because
 * it recomputes rather than adjusts and is therefore safe at any time:
 *
 *   node scripts/backfill-reader-counts.mjs          # apply
 *   node scripts/backfill-reader-counts.mjs --check  # report drift, change nothing
 *
 * Reach for it if the counter ever looks wrong (two chapters of a brand-new
 * series opened in the same instant can in principle be counted twice), or
 * after any bulk edit to ReadingProgress.
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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const checkOnly = process.argv.includes("--check");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const rows = await prisma.$queryRaw`
    SELECT
      m.id,
      m."mangaName",
      m."readerCount"                                AS stored,
      COALESCE(COUNT(DISTINCT rp."userId"), 0)::int  AS actual
    FROM "Manga" m
    LEFT JOIN "ReadingProgress" rp ON rp."mangaId" = m.id
    GROUP BY m.id, m."mangaName", m."readerCount"
    ORDER BY actual DESC, m."mangaName"
  `;

  const drifted = rows.filter((row) => row.stored !== row.actual);

  console.log(`${rows.length} series checked, ${drifted.length} out of date.`);

  for (const row of drifted) {
    console.log(
      `  ${String(row.stored).padStart(5)} -> ${String(row.actual).padStart(5)}  ${row.mangaName}`,
    );
  }

  if (checkOnly) {
    console.log("\n--check: nothing written.");
  } else if (drifted.length > 0) {
    // One statement, so the table is never left half-updated.
    await prisma.$executeRaw`
      UPDATE "Manga" m
      SET "readerCount" = COALESCE(counts.readers, 0)
      FROM (
        SELECT "mangaId", COUNT(DISTINCT "userId")::int AS readers
        FROM "ReadingProgress"
        GROUP BY "mangaId"
      ) AS counts
      WHERE m.id = counts."mangaId"
        AND m."readerCount" IS DISTINCT FROM counts.readers
    `;
    console.log(`\nUpdated ${drifted.length} series.`);
  } else {
    console.log("\nAlready correct; nothing to do.");
  }
} finally {
  await prisma.$disconnect();
}
