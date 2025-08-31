/*
  Warnings:

  - You are about to drop the column `assignedRole` on the `SupportRoute` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."SupportRoute" DROP COLUMN "assignedRole";

-- AlterTable
ALTER TABLE "public"."SupportTicket" ADD COLUMN     "assignedEmail" TEXT;
