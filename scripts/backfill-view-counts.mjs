/**
 * One-time seed for Manga.viewCount from historical ReadingProgress rows.
 *
 *   node scripts/backfill-view-counts.mjs --check   # report, write nothing
 *   node scripts/backfill-view-counts.mjs           # seed (refuses if counts exist)
 *   node scripts/backfill-view-counts.mjs --force   # seed anyway, overwriting
 *
 * WHY THIS IS A FLOOR, NOT THE TRUE TOTAL
 *
 * viewCount counts every chapter open, re-reads included. ReadingProgress holds
 * one row per (userId, chapterId) and merely overwrites `readAt` when a chapter
 * is opened again, so historical repeat opens were never recorded anywhere.
 * The row count therefore gives the number of distinct chapters ever opened —
 * a lower bound. Live counting from here on is exact; only the seeded portion
 * understates.
 *
 * WHY IT REFUSES TO RE-RUN
 *
 * Unlike backfill-reader-counts.mjs, which recomputes an exact value and is
 * safe at any time, this one SETS a floor. Running it after real traffic has
 * accumulated would throw that traffic away and reset every series back down.
 * So it stops if any series already has a non-zero count, and --force is the
 * only way past that.
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
const force = process.argv.includes("--force");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const rows = await prisma.$queryRaw`
    SELECT
      m.id,
      m."mangaName",
      m."viewCount"          AS stored,
      COUNT(rp.id)::int      AS floor
    FROM "Manga" m
    LEFT JOIN "ReadingProgress" rp ON rp."mangaId" = m.id
    GROUP BY m.id, m."mangaName", m."viewCount"
    ORDER BY floor DESC, m."mangaName"
  `;

  const alreadyCounting = rows.filter((row) => row.stored > 0);
  const totalFloor = rows.reduce((sum, row) => sum + row.floor, 0);

  console.log(`${rows.length} series | historical floor totals ${totalFloor} opens`);
  for (const row of rows.slice(0, 10)) {
    console.log(
      `  ${String(row.stored).padStart(6)} -> ${String(row.floor).padStart(6)}  ${row.mangaName.slice(0, 42)}`,
    );
  }
  if (rows.length > 10) console.log(`  … and ${rows.length - 10} more`);

  if (checkOnly) {
    console.log("\n--check: nothing written.");
  } else if (alreadyCounting.length > 0 && !force) {
    console.error(
      `\nRefusing to run: ${alreadyCounting.length} series already have a non-zero viewCount.` +
        "\nSeeding now would discard real reads counted since launch." +
        "\nRe-run with --force only if you intend to overwrite them.",
    );
    process.exitCode = 1;
  } else {
    // Single statement, so the table is never left half-seeded.
    await prisma.$executeRaw`
      UPDATE "Manga" m
      SET "viewCount" = COALESCE(counts.opens, 0)
      FROM (
        SELECT "mangaId", COUNT(id)::int AS opens
        FROM "ReadingProgress"
        GROUP BY "mangaId"
      ) AS counts
      WHERE m.id = counts."mangaId"
    `;
    console.log(`\nSeeded ${rows.filter((r) => r.floor > 0).length} series.`);
  }
} finally {
  await prisma.$disconnect();
}
