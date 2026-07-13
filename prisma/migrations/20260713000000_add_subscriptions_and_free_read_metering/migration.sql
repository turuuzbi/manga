-- Subscriptions / payments (QPay) and per-user + per-IP free-read metering.

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('TWO_WEEKS', 'ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN "premiumUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "qpayInvoiceId" TEXT,
    "qpayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeReadUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeReadUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IpDailyClaim" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpDailyClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_qpayInvoiceId_key" ON "public"."Payment"("qpayInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "public"."Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paymentId_key" ON "public"."Subscription"("paymentId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_expiresAt_idx" ON "public"."Subscription"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FreeReadUsage_userId_dayKey_chapterId_key" ON "public"."FreeReadUsage"("userId", "dayKey", "chapterId");

-- CreateIndex
CREATE INDEX "FreeReadUsage_userId_dayKey_idx" ON "public"."FreeReadUsage"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "FreeReadUsage_dayKey_idx" ON "public"."FreeReadUsage"("dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "IpDailyClaim_ipHash_dayKey_key" ON "public"."IpDailyClaim"("ipHash", "dayKey");

-- CreateIndex
CREATE INDEX "IpDailyClaim_dayKey_idx" ON "public"."IpDailyClaim"("dayKey");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
