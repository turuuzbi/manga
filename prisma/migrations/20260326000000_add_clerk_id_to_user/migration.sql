ALTER TABLE "User" ADD COLUMN "clerkId" TEXT;

UPDATE "User"
SET "clerkId" = COALESCE("username", "id")
WHERE "clerkId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "clerkId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL;

CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
