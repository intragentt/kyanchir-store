-- CreateEnum
CREATE TYPE "public"."PresetItemType" AS ENUM ('CATEGORY', 'TAG');

-- CreateTable
CREATE TABLE "public"."FilterPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilterPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PresetItem" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "type" "public"."PresetItemType" NOT NULL,
    "categoryId" TEXT,
    "tagId" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PresetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FilterPreset_name_key" ON "public"."FilterPreset"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PresetItem_presetId_categoryId_key" ON "public"."PresetItem"("presetId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PresetItem_presetId_tagId_key" ON "public"."PresetItem"("presetId", "tagId");

-- AddForeignKey
ALTER TABLE "public"."PresetItem" ADD CONSTRAINT "PresetItem_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "public"."FilterPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PresetItem" ADD CONSTRAINT "PresetItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PresetItem" ADD CONSTRAINT "PresetItem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
