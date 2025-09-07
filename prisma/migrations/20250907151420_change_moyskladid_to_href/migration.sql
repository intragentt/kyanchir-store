/*
  Warnings:

  - You are about to drop the column `moyskladId` on the `ProductSize` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[moySkladHref]` on the table `ProductSize` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProductSize_moyskladId_key";

-- AlterTable
ALTER TABLE "ProductSize" DROP COLUMN "moyskladId",
ADD COLUMN     "moySkladHref" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_moySkladHref_key" ON "ProductSize"("moySkladHref");
