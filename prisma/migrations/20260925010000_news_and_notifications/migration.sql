-- МЭДЭЭ: admin-written articles everyone sees, plus per-reader notices, both
-- listed in one feed and counted in one unread badge.
CREATE TABLE "public"."Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Article_publishedAt_idx" ON "public"."Article"("publishedAt");

ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "public"."User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Seen state for signed-in readers (signed-out readers use localStorage).
CREATE TABLE "public"."ArticleSeen" (
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleSeen_pkey" PRIMARY KEY ("userId","articleId")
);

CREATE INDEX "ArticleSeen_articleId_idx" ON "public"."ArticleSeen"("articleId");

ALTER TABLE "public"."ArticleSeen" ADD CONSTRAINT "ArticleSeen_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ArticleSeen" ADD CONSTRAINT "ArticleSeen_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "public"."NotificationKind" AS ENUM ('REWARD');

-- rewardId's foreign key arrives with the UserReward table in the next
-- migration; the unique index is here so a reward can never notify twice.
CREATE TABLE "public"."UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "public"."NotificationKind" NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "rewardId" TEXT,
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserNotification_rewardId_key" ON "public"."UserNotification"("rewardId");
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "public"."UserNotification"("userId", "createdAt");

ALTER TABLE "public"."UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
