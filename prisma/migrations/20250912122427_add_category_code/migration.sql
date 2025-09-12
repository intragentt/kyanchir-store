/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "code" TEXT NOT NULL DEFAULT 'TEMP';

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");
