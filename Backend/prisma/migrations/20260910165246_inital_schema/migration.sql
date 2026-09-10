-- CreateEnum
CREATE TYPE "DateStatus" AS ENUM ('AVAILABLE', 'LOCKED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Love', 'Birthday', 'Aniversary', 'Milestone', 'Memory', 'Special');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "dates" (
    "dateKey" VARCHAR(10) NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "status" "DateStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dates_pkey" PRIMARY KEY ("dateKey")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "certificateId" VARCHAR(50) NOT NULL,
    "dateKey" VARCHAR(10) NOT NULL,
    "ownerName" VARCHAR(100) NOT NULL,
    "initial" VARCHAR(5) NOT NULL,
    "isGift" BOOLEAN NOT NULL DEFAULT false,
    "senderName" VARCHAR(100),
    "buyerEmail" VARCHAR(255) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "story" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'Memory',
    "link" VARCHAR(500),
    "pricePaid" INTEGER NOT NULL,
    "paymentId" VARCHAR(100) NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "dateKey" VARCHAR(10) NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "name" VARCHAR(100) NOT NULL,
    "isGift" BOOLEAN NOT NULL DEFAULT false,
    "senderName" VARCHAR(100),
    "buyerEmail" VARCHAR(255) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "story" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'Memory',
    "link" VARCHAR(500),
    "paymentId" VARCHAR(100),
    "signature" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "actorName" VARCHAR(100) NOT NULL,
    "initial" VARCHAR(5) NOT NULL,
    "dateLabel" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claims_certificateId_key" ON "claims"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "claims_dateKey_key" ON "claims"("dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "claims_paymentId_key" ON "claims"("paymentId");

-- CreateIndex
CREATE INDEX "claims_certificateId_idx" ON "claims"("certificateId");

-- CreateIndex
CREATE INDEX "claims_dateKey_idx" ON "claims"("dateKey");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_dateKey_fkey" FOREIGN KEY ("dateKey") REFERENCES "dates"("dateKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_dateKey_fkey" FOREIGN KEY ("dateKey") REFERENCES "dates"("dateKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
