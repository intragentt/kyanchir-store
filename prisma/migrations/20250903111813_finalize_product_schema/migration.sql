/*
  Warnings:

  - You are about to drop the column `moyskladId` on the `ProductVariant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[moyskladId]` on the table `ProductSize` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ProductVariant_moyskladId_key";

-- AlterTable
ALTER TABLE "public"."ProductSize" ADD COLUMN     "moyskladId" TEXT;

-- AlterTable
ALTER TABLE "public"."ProductVariant" DROP COLUMN "moyskladId";

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "public"."Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_moyskladId_key" ON "public"."ProductSize"("moyskladId");
