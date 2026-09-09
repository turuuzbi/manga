-- Per-chapter opens, for the admin "Үзэлт шалгах" breakdown. Bumped in the same
-- transaction as Manga.viewCount so the two cannot diverge.
ALTER TABLE "public"."Chapter" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Homepage promo strip: a 3:1 banner per series. Setting the image is what
-- promotes the title; promoOrder sorts the strip with nulls last.
ALTER TABLE "public"."Manga" ADD COLUMN "promoImageUrl" TEXT;
ALTER TABLE "public"."Manga" ADD COLUMN "promoOrder" INTEGER;

CREATE INDEX "Manga_promoOrder_idx" ON "public"."Manga"("promoOrder");

-- Seed chapter views from the historical ReadingProgress rows, the same floor
-- Manga.viewCount was seeded from. Repeat opens were never recorded, so this
-- understates; counting from here on is exact.
UPDATE "public"."Chapter" c
SET "viewCount" = COALESCE(counts.opens, 0)
FROM (
  SELECT "chapterId", COUNT(id)::int AS opens
  FROM "public"."ReadingProgress"
  GROUP BY "chapterId"
) AS counts
WHERE c.id = counts."chapterId";
