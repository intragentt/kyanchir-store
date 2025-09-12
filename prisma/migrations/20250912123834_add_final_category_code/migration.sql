/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Made the column `code` on table `Category` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");
