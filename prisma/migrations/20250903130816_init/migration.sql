/*
  Warnings:

  - You are about to drop the column `type` on the `PresetItem` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `SupportAgent` table. All the data in the column will be lost.
  - You are about to drop the column `senderType` on the `SupportMessage` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `typeId` to the `PresetItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `SupportAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderTypeId` to the `SupportMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceId` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusId` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PresetItem" DROP COLUMN "type",
ADD COLUMN     "typeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "status",
ADD COLUMN     "statusId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."SupportAgent" DROP COLUMN "role",
ADD COLUMN     "roleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."SupportMessage" DROP COLUMN "senderType",
ADD COLUMN     "senderTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."SupportTicket" DROP COLUMN "source",
DROP COLUMN "status",
ADD COLUMN     "sourceId" TEXT NOT NULL,
ADD COLUMN     "statusId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "role",
ADD COLUMN     "roleId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."AgentRole";

-- DropEnum
DROP TYPE "public"."PresetItemType";

-- DropEnum
DROP TYPE "public"."SenderType";

-- DropEnum
DROP TYPE "public"."Status";

-- DropEnum
DROP TYPE "public"."TicketSource";

-- DropEnum
DROP TYPE "public"."TicketStatus";

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "public"."Status" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PresetItemType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PresetItemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgentRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TicketStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TicketSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SenderType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SenderType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Status_name_key" ON "public"."Status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PresetItemType_name_key" ON "public"."PresetItemType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_name_key" ON "public"."UserRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentRole_name_key" ON "public"."AgentRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TicketStatus_name_key" ON "public"."TicketStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TicketSource_name_key" ON "public"."TicketSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SenderType_name_key" ON "public"."SenderType"("name");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PresetItem" ADD CONSTRAINT "PresetItem_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."PresetItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."UserRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportAgent" ADD CONSTRAINT "SupportAgent_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."AgentRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."TicketStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."TicketSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportMessage" ADD CONSTRAINT "SupportMessage_senderTypeId_fkey" FOREIGN KEY ("senderTypeId") REFERENCES "public"."SenderType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
