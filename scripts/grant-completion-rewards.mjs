/**
 * Grants completion rewards to readers who had already finished a series
 * before its reward background was set (МАНГА ЗАСАХ → "Бэлэг background").
 *
 * Same rule as the live grant in lib/rewards.ts, which runs on every chapter
 * open: a signed-in reader who has a ReadingProgress row for every published
 * chapter (out already, and with at least one page) gets the series' current
 * background once, plus the МЭДЭЭ notice. Safe to run any number of times —
 * UserReward is unique per reader per series, and a reader who already has the
 * reward is skipped:
 *
 *   node scripts/grant-completion-rewards.mjs          # grant
 *   node scripts/grant-completion-rewards.mjs --check  # list who qualifies, change nothing
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

// Must match rewardNoticeMessage / REWARD_NOTICE_HREF in lib/rewards.ts.
const noticeMessage = (mangaName) =>
  `${mangaName} бүх бүлгийг уншиж дууссан тул background бэлгэнд ирлээ`;
const NOTICE_HREF = "/profile#backgrounds";

try {
  const qualifying = await prisma.$queryRaw`
    WITH readable AS (
      SELECT c.id, c."mangaId"
      FROM "Chapter" c
      JOIN "Manga" m ON m.id = c."mangaId"
      WHERE m."rewardBackgroundUrl" IS NOT NULL
        AND c."publishedAt" <= now()
        AND EXISTS (SELECT 1 FROM "Page" p WHERE p."chapterId" = c.id)
    ),
    totals AS (
      SELECT "mangaId", COUNT(*)::int AS total FROM readable GROUP BY "mangaId"
    ),
    reads AS (
      SELECT rp."userId", r."mangaId", COUNT(DISTINCT rp."chapterId")::int AS done
      FROM "ReadingProgress" rp
      JOIN readable r ON r.id = rp."chapterId"
      GROUP BY rp."userId", r."mangaId"
    )
    SELECT reads."userId", m.id AS "mangaId", m."mangaName",
           m."rewardBackgroundUrl", m."rewardBackgroundOriginalUrl"
    FROM reads
    JOIN totals USING ("mangaId")
    JOIN "Manga" m ON m.id = reads."mangaId"
    WHERE reads.done = totals.total
      AND NOT EXISTS (
        SELECT 1 FROM "UserReward" ur
        WHERE ur."userId" = reads."userId" AND ur."mangaId" = reads."mangaId"
      )
    ORDER BY m."mangaName", reads."userId"
  `;

  const bySeries = new Map();
  for (const row of qualifying) {
    bySeries.set(row.mangaName, (bySeries.get(row.mangaName) ?? 0) + 1);
  }

  console.log(`${qualifying.length} reward(s) to grant.`);
  for (const [name, count] of bySeries) {
    console.log(`  ${String(count).padStart(5)}  ${name}`);
  }

  if (checkOnly) {
    console.log("\n--check: nothing written.");
  } else {
    let granted = 0;

    for (const row of qualifying) {
      try {
        await prisma.$transaction(async (tx) => {
          const reward = await tx.userReward.create({
            data: {
              userId: row.userId,
              mangaId: row.mangaId,
              mangaName: row.mangaName,
              imageUrl: row.rewardBackgroundUrl,
              originalUrl: row.rewardBackgroundOriginalUrl ?? row.rewardBackgroundUrl,
            },
            select: { id: true },
          });

          await tx.userNotification.create({
            data: {
              userId: row.userId,
              kind: "REWARD",
              message: noticeMessage(row.mangaName),
              href: NOTICE_HREF,
              rewardId: reward.id,
            },
          });
        });
        granted += 1;
      } catch (error) {
        // Granted by a live chapter open in the meantime: nothing to do.
        if (error?.code !== "P2002") throw error;
      }
    }

    console.log(`\nGranted ${granted} reward(s).`);
  }
} finally {
  await prisma.$disconnect();
}
