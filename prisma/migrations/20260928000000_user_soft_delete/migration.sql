-- Deleting a Clerk account now marks the user row instead of deleting it, so
-- the reader's payments, subscriptions and reading history stay for reporting.
-- Additive: existing rows get NULL (not deleted).
ALTER TABLE "public"."User" ADD COLUMN "deletedAt" TIMESTAMP(3);
