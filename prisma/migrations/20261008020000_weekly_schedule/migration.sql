-- The release schedule ("Хуваарь") becomes weekly: a series and the weekdays
-- it comes out on, recurring every week, instead of one row per date.
CREATE TABLE "public"."WeeklyScheduleEntry" (
    "id" TEXT NOT NULL,
    "mangaId" TEXT,
    "customTitle" TEXT,
    "weekdays" INTEGER[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyScheduleEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeeklyScheduleEntry_mangaId_idx" ON "public"."WeeklyScheduleEntry"("mangaId");

ALTER TABLE "public"."WeeklyScheduleEntry" ADD CONSTRAINT "WeeklyScheduleEntry_mangaId_fkey"
  FOREIGN KEY ("mangaId") REFERENCES "public"."Manga"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Carry the dated rows across: one weekly row per series (or per free-standing
-- title), on every weekday any of its dates fell on (ISO: 1 = Monday …
-- 7 = Sunday). The id of the series' first dated row is reused. Chapter labels
-- and per-date notes described one date, so they are not carried over. Rows
-- whose series was deleted and that have no title of their own were already
-- hidden from the public page and are skipped.
-- ScheduleEntry itself is left in place, unused, so nothing is dropped.
INSERT INTO "public"."WeeklyScheduleEntry"
  ("id", "mangaId", "customTitle", "weekdays", "createdAt", "updatedAt")
SELECT
  MIN(e."id"),
  e."mangaId",
  CASE WHEN e."mangaId" IS NULL THEN BTRIM(e."customTitle") END,
  ARRAY_AGG(DISTINCT EXTRACT(ISODOW FROM e."date")::INTEGER
            ORDER BY EXTRACT(ISODOW FROM e."date")::INTEGER),
  MIN(e."createdAt"),
  CURRENT_TIMESTAMP
FROM "public"."ScheduleEntry" e
WHERE e."mangaId" IS NOT NULL OR COALESCE(BTRIM(e."customTitle"), '') <> ''
GROUP BY e."mangaId", CASE WHEN e."mangaId" IS NULL THEN BTRIM(e."customTitle") END;
