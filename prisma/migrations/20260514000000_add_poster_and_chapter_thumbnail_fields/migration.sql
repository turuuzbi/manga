ALTER TYPE "public"."MangaStatus" ADD VALUE IF NOT EXISTS 'CATCHING_UP';
ALTER TYPE "public"."MangaStatus" ADD VALUE IF NOT EXISTS 'FINISHED_RELEASING';

ALTER TABLE "public"."Manga"
ADD COLUMN "homeCoverImage" TEXT,
ADD COLUMN "detailCoverImage" TEXT;

ALTER TABLE "public"."Chapter"
ADD COLUMN "coverImage" TEXT;
