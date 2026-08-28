-- Owner-curated homepage hero carousel. Replaces the automatic
-- "top 5 by chapter count" selection with an explicit admin choice.

-- AlterTable
ALTER TABLE "public"."Manga"
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "featuredOrder" INTEGER;

-- CreateIndex
CREATE INDEX "Manga_isFeatured_featuredOrder_idx"
ON "public"."Manga"("isFeatured", "featuredOrder");

-- Seed the curation with what the hero was already showing (the five series
-- with the most chapters) so the carousel is not empty on deploy. The owner
-- can re-curate from the admin console afterwards.
WITH seeded AS (
  SELECT
    m."id",
    ROW_NUMBER() OVER (
      ORDER BY COUNT(c."id") DESC, m."mangaName" ASC
    ) AS position
  FROM "public"."Manga" m
  LEFT JOIN "public"."Chapter" c ON c."mangaId" = m."id"
  GROUP BY m."id", m."mangaName"
  ORDER BY COUNT(c."id") DESC, m."mangaName" ASC
  LIMIT 5
)
UPDATE "public"."Manga" m
SET "isFeatured" = true,
    "featuredOrder" = seeded.position
FROM seeded
WHERE m."id" = seeded."id";
