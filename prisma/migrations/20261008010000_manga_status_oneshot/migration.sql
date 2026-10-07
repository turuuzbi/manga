-- "Oneshot" series status. On its own migration: a value added to an enum
-- cannot be used in the same transaction that adds it.
ALTER TYPE "public"."MangaStatus" ADD VALUE 'ONESHOT';
