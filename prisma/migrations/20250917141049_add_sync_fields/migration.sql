/*
  Warnings:

  - A unique constraint covering the columns `[moyskladId]` on the table `ProductSize` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductSize" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moyskladId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_moyskladId_key" ON "ProductSize"("moyskladId");
