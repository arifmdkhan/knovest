-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isSubscriptionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionPrice" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscribedToId" TEXT NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_subscriberId_idx" ON "Subscription"("subscriberId");

-- CreateIndex
CREATE INDEX "Subscription_subscribedToId_idx" ON "Subscription"("subscribedToId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriberId_subscribedToId_key" ON "Subscription"("subscriberId", "subscribedToId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscribedToId_fkey" FOREIGN KEY ("subscribedToId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
