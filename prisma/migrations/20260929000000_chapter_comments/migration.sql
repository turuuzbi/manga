-- Chapter comments share the Comment table with series comments: a row with
-- chapterId set belongs to that chapter's end screen. isSpoiler blurs it until
-- the reader chooses to see it; deletedAt soft-deletes it. Additive: existing
-- series comments get chapterId NULL, isSpoiler false, deletedAt NULL.
ALTER TABLE "public"."Comment" ADD COLUMN "chapterId" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "isSpoiler" BOOLEAN NOT NULL DEFAULT false;

-- A chapter's comments, newest first.
CREATE INDEX "Comment_chapterId_createdAt_idx" ON "public"."Comment"("chapterId", "createdAt" DESC);

-- Site-wide newest comments (the homepage carousel).
CREATE INDEX "Comment_createdAt_idx" ON "public"."Comment"("createdAt" DESC);

ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
