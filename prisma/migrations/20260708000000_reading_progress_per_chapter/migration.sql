-- Repurpose ReadingProgress from one-row-per-manga (current position) to
-- one-row-per-chapter read history. Existing rows already reference a chapter,
-- so no data is lost by the unique-key change.

-- DropIndex (old per-manga unique + broad userId index)
DROP INDEX IF EXISTS "public"."ReadingProgress_userId_mangaId_key";
DROP INDEX IF EXISTS "public"."ReadingProgress_userId_idx";

-- AlterTable: drop unused pageNumber, rename updatedAt -> readAt, give it a default
ALTER TABLE "public"."ReadingProgress" DROP COLUMN "pageNumber";
ALTER TABLE "public"."ReadingProgress" RENAME COLUMN "updatedAt" TO "readAt";
ALTER TABLE "public"."ReadingProgress" ALTER COLUMN "readAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_userId_chapterId_key" ON "public"."ReadingProgress"("userId", "chapterId");

-- CreateIndex
CREATE INDEX "ReadingProgress_userId_readAt_idx" ON "public"."ReadingProgress"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ReadingProgress_userId_mangaId_idx" ON "public"."ReadingProgress"("userId", "mangaId");
