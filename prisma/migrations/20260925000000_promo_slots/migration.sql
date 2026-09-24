-- Homepage ad panels move from one stacked strip to four fixed slots between
-- the shelves (see HomeLanding). The unique index allows one banner per slot,
-- which also caps the homepage at four. NULL means "kept, not shown"; Postgres
-- lets any number of rows share NULL under a unique index.
ALTER TABLE "public"."Manga" ADD COLUMN "promoSlot" INTEGER;
ALTER TABLE "public"."Manga"
  ADD CONSTRAINT "Manga_promoSlot_range" CHECK ("promoSlot" BETWEEN 1 AND 4);
CREATE UNIQUE INDEX "Manga_promoSlot_key" ON "public"."Manga"("promoSlot");

-- Seat the existing banners in the order the strip showed them (promoOrder,
-- nulls last, then title). The strip sat where slot 2 is now, so the first
-- banner goes to slot 2 and the second to slot 3. Any further ones fill 4 and
-- then 1; a fifth or later keeps its image and simply has no slot.
-- promoOrder itself is left in place, unused, so nothing is dropped.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY "promoOrder" ASC NULLS LAST, "mangaName" ASC) AS rn
  FROM "public"."Manga"
  WHERE "promoImageUrl" IS NOT NULL
)
UPDATE "public"."Manga" m
SET "promoSlot" = CASE ranked.rn
  WHEN 1 THEN 2
  WHEN 2 THEN 3
  WHEN 3 THEN 4
  WHEN 4 THEN 1
END
FROM ranked
WHERE m.id = ranked.id AND ranked.rn <= 4;
