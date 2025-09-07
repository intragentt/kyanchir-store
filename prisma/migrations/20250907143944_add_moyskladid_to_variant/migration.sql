/*
  Warnings:

  - The primary key for the `_ProductTags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ProductToCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[moySkladId]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_ProductTags` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_ProductToCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "moySkladId" TEXT;

-- AlterTable
ALTER TABLE "_ProductTags" DROP CONSTRAINT "_ProductTags_AB_pkey";

-- AlterTable
ALTER TABLE "_ProductToCategory" DROP CONSTRAINT "_ProductToCategory_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_moySkladId_key" ON "ProductVariant"("moySkladId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductTags_AB_unique" ON "_ProductTags"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductToCategory_AB_unique" ON "_ProductToCategory"("A", "B");
