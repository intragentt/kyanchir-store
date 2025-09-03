/*
  Warnings:

  - You are about to drop the `Inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Variant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_variantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Inventory" DROP CONSTRAINT "Inventory_sizeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Inventory" DROP CONSTRAINT "Inventory_variantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Variant" DROP CONSTRAINT "Variant_productId_fkey";

-- DropTable
DROP TABLE "public"."Inventory";

-- DropTable
DROP TABLE "public"."Variant";

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT,
    "price" INTEGER NOT NULL,
    "oldPrice" INTEGER,
    "discountPercentage" INTEGER,
    "discountExpiresAt" TIMESTAMP(3),
    "bonusPoints" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moyskladId" TEXT,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductSize" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_moyskladId_key" ON "public"."ProductVariant"("moyskladId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_color_key" ON "public"."ProductVariant"("productId", "color");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_productVariantId_sizeId_key" ON "public"."ProductSize"("productVariantId", "sizeId");

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductSize" ADD CONSTRAINT "ProductSize_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductSize" ADD CONSTRAINT "ProductSize_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."Size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
