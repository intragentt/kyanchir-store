/*
  Warnings:

  - A unique constraint covering the columns `[internalUsername]` on the table `SupportAgent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `internalUsername` to the `SupportAgent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."SupportAgent" ADD COLUMN     "internalUsername" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SupportAgent_internalUsername_key" ON "public"."SupportAgent"("internalUsername");
