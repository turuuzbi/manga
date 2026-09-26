-- МЭДЭЭ view counts: one row per viewer per article (signed-in user or
-- anonymous device), so refreshes never count twice. Admin-only.
ALTER TABLE "public"."Article" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "public"."ArticleView" (
    "articleId" TEXT NOT NULL,
    "viewerKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleView_pkey" PRIMARY KEY ("articleId","viewerKey")
);

ALTER TABLE "public"."ArticleView" ADD CONSTRAINT "ArticleView_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Who wrote each end-of-chapter note: the bubble shows that account's avatar
-- and name instead of a hard-coded "ЮҮМЭ".
ALTER TABLE "public"."Chapter" ADD COLUMN "yumeCommentAuthorId" TEXT;
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_yumeCommentAuthorId_fkey"
  FOREIGN KEY ("yumeCommentAuthorId") REFERENCES "public"."User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Notes written before this migration have no recorded author. They were
-- written as the site's own account, yume_ (which also authors МЭДЭЭ posts),
-- so attribute them to it. No-op if that account does not exist.
UPDATE "public"."Chapter"
SET "yumeCommentAuthorId" = (
  SELECT id FROM "public"."User"
  WHERE username = 'yume_' AND role = 'ADMIN'
  LIMIT 1
)
WHERE "yumeComment" IS NOT NULL AND "yumeComment" <> '' AND "yumeCommentAuthorId" IS NULL;

-- Monthly release schedule ("Хуваарь").
CREATE TABLE "public"."ScheduleEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mangaId" TEXT,
    "customTitle" TEXT,
    "chapterLabel" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduleEntry_date_idx" ON "public"."ScheduleEntry"("date");
CREATE INDEX "ScheduleEntry_mangaId_idx" ON "public"."ScheduleEntry"("mangaId");

ALTER TABLE "public"."ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_mangaId_fkey"
  FOREIGN KEY ("mangaId") REFERENCES "public"."Manga"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
