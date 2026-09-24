-- Completion rewards. A series with a reward background set gives it once to
-- every reader who opens all of its published chapters.
ALTER TABLE "public"."Manga" ADD COLUMN "rewardBackgroundUrl" TEXT;
ALTER TABLE "public"."Manga" ADD COLUMN "rewardBackgroundOriginalUrl" TEXT;

-- Image URLs and the series name are copied at grant time so a later change to
-- the series' reward never takes back what a reader earned. The unique index
-- on (userId, mangaId) is what makes granting idempotent.
CREATE TABLE "public"."UserReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "mangaName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserReward_userId_mangaId_key" ON "public"."UserReward"("userId", "mangaId");
CREATE INDEX "UserReward_userId_grantedAt_idx" ON "public"."UserReward"("userId", "grantedAt");

ALTER TABLE "public"."UserReward" ADD CONSTRAINT "UserReward_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserReward" ADD CONSTRAINT "UserReward_mangaId_fkey"
  FOREIGN KEY ("mangaId") REFERENCES "public"."Manga"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."UserNotification" ADD CONSTRAINT "UserNotification_rewardId_fkey"
  FOREIGN KEY ("rewardId") REFERENCES "public"."UserReward"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- The background a reader applied site-wide. Cleared if the reward goes away.
ALTER TABLE "public"."User" ADD COLUMN "siteBackgroundId" TEXT;
ALTER TABLE "public"."User" ADD CONSTRAINT "User_siteBackgroundId_fkey"
  FOREIGN KEY ("siteBackgroundId") REFERENCES "public"."UserReward"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
