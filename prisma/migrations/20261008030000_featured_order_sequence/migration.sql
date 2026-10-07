-- Hero slider ("Онцлох слайдер") positions become strictly 1, 2, 3, … with no
-- repeats or gaps; the admin action keeps them that way from now on.
-- Renumber the current line-up in the order the homepage already shows it:
-- featuredOrder, unordered ones last, then title. Series not in the slider
-- lose any leftover number.
UPDATE "public"."Manga"
SET "featuredOrder" = NULL
WHERE NOT "isFeatured" AND "featuredOrder" IS NOT NULL;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY "featuredOrder" ASC NULLS LAST, "mangaName" ASC, id ASC) AS rn
  FROM "public"."Manga"
  WHERE "isFeatured"
)
UPDATE "public"."Manga" m
SET "featuredOrder" = ranked.rn
FROM ranked
WHERE m.id = ranked.id AND m."featuredOrder" IS DISTINCT FROM ranked.rn;
