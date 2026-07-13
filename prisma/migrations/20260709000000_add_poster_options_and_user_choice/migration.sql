-- Add curated poster candidates per manga and a per-user chosen-poster preference.

-- AlterTable
ALTER TABLE "public"."Manga"
ADD COLUMN "posterOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "public"."UserPosterChoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPosterChoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPosterChoice_userId_idx" ON "public"."UserPosterChoice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPosterChoice_userId_mangaId_key" ON "public"."UserPosterChoice"("userId", "mangaId");

-- AddForeignKey
ALTER TABLE "public"."UserPosterChoice" ADD CONSTRAINT "UserPosterChoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPosterChoice" ADD CONSTRAINT "UserPosterChoice_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "public"."Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
