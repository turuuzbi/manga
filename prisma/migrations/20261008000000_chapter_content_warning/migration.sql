-- Optional notice per chapter (18+ or violence), shown as a modal before the
-- pages load. NULL = no notice, so every existing chapter keeps opening as
-- before.
CREATE TYPE "public"."ContentWarning" AS ENUM ('ADULT', 'VIOLENCE');

ALTER TABLE "public"."Chapter" ADD COLUMN "contentWarning" "public"."ContentWarning";
