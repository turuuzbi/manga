-- 1. Per-manga paywall window size (null = fall back to the global default).
ALTER TABLE "public"."Manga" ADD COLUMN "paywalledChapters" INTEGER;

-- 2. Status cleanup:
--    - "HIATUS" ("On Hiatus") becomes "STOPPED".
--    - "FINISHED_RELEASING" ("Source Completed") is dropped entirely.
--
-- Postgres cannot drop a value from an enum in place, so the type is rebuilt.
-- Any straggling FINISHED_RELEASING rows are folded into COMPLETED first so
-- the cast below cannot fail (there were none at the time of writing).

UPDATE "public"."Manga"
SET "status" = 'COMPLETED'
WHERE "status" = 'FINISHED_RELEASING';

ALTER TYPE "public"."MangaStatus" RENAME VALUE 'HIATUS' TO 'STOPPED';

ALTER TYPE "public"."MangaStatus" RENAME TO "MangaStatus_old";

CREATE TYPE "public"."MangaStatus" AS ENUM (
  'ONGOING',
  'COMPLETED',
  'CATCHING_UP',
  'STOPPED'
);

ALTER TABLE "public"."Manga" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "public"."Manga"
  ALTER COLUMN "status" TYPE "public"."MangaStatus"
  USING ("status"::text::"public"."MangaStatus");

ALTER TABLE "public"."Manga" ALTER COLUMN "status" SET DEFAULT 'ONGOING';

DROP TYPE "public"."MangaStatus_old";
