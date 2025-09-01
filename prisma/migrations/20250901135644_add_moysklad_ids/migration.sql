/*
  Warnings:

  - A unique constraint covering the columns `[moyskladId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[moyskladId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[moyskladId]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'SUPPORT';

-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "moyskladId" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "moyskladId" TEXT;

-- AlterTable
ALTER TABLE "public"."Variant" ADD COLUMN     "moyskladId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Category_moyskladId_key" ON "public"."Category"("moyskladId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_moyskladId_key" ON "public"."Product"("moyskladId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_moyskladId_key" ON "public"."Variant"("moyskladId");
