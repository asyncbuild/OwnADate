/*
  Warnings:

  - You are about to drop the column `paymentId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `signature` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `currency` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.

*/
-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
ADD COLUMN     "imageUrl" VARCHAR(500);

-- AlterTable
ALTER TABLE "claims" ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
ADD COLUMN     "imageUrl" VARCHAR(500);

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "paymentId",
DROP COLUMN "signature",
ADD COLUMN     "imageUrl" VARCHAR(500),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);
