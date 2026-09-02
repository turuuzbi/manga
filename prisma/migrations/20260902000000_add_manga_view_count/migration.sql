-- Total chapter opens per series, counted for signed-out readers too.
-- Feeds the "Топ 10 үзэлттэй манга" rail; the raw number stays admin-only.
ALTER TABLE "public"."Manga" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Supports ordering the top-viewed rail without a full scan.
CREATE INDEX "Manga_viewCount_idx" ON "public"."Manga"("viewCount");
