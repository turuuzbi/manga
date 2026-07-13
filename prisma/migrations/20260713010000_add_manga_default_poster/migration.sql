-- Admin-selectable default poster (one of Manga.posterOptions).
ALTER TABLE "public"."Manga" ADD COLUMN "defaultPoster" TEXT;
