-- Distinct readers per series, denormalised from ReadingProgress so the detail
-- page renders without a COUNT DISTINCT.
ALTER TABLE "public"."Manga" ADD COLUMN "readerCount" INTEGER NOT NULL DEFAULT 0;

-- "Distinct readers of this series" needs mangaId as the leading column; the
-- existing ReadingProgress_userId_mangaId_idx cannot serve it.
CREATE INDEX "ReadingProgress_mangaId_userId_idx"
  ON "public"."ReadingProgress"("mangaId", "userId");

-- Backfill from existing progress rows, so the column is correct the moment it
-- exists rather than reading 0 until the standalone script is run.
UPDATE "public"."Manga" m
SET "readerCount" = COALESCE(counts.readers, 0)
FROM (
  SELECT "mangaId", COUNT(DISTINCT "userId")::int AS readers
  FROM "public"."ReadingProgress"
  GROUP BY "mangaId"
) AS counts
WHERE m.id = counts."mangaId";
