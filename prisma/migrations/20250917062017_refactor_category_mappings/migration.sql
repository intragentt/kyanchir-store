/*
  Warnings:

  - You are about to drop the `CategoryCodeMapping` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "CategoryCodeMapping";

-- CreateTable
CREATE TABLE "CodeRule" (
    "id" TEXT NOT NULL,
    "assignedCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorySynonym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategorySynonym_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeRule_assignedCode_key" ON "CodeRule"("assignedCode");

-- CreateIndex
CREATE UNIQUE INDEX "CategorySynonym_name_key" ON "CategorySynonym"("name");

-- AddForeignKey
ALTER TABLE "CategorySynonym" ADD CONSTRAINT "CategorySynonym_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CodeRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
