-- Hero slide artwork per device (16:9 desktop, 1:1 phone), independent of the
-- poster fields the detail page uses. Both optional: the slider falls back
-- from one to the other, then to the poster.
ALTER TABLE "public"."Manga" ADD COLUMN "featuredImageDesktop" TEXT;
ALTER TABLE "public"."Manga" ADD COLUMN "featuredImageMobile" TEXT;

-- Yume's note after a chapter's last page. Optional; empty means none.
ALTER TABLE "public"."Chapter" ADD COLUMN "yumeComment" TEXT;
