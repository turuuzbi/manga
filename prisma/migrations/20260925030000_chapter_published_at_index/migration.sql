-- "Сүүлийн шинэчлэл" is now a feed of chapters (one card per chapter), read
-- newest first and paginated on /updates.
CREATE INDEX "Chapter_publishedAt_idx" ON "public"."Chapter"("publishedAt");
