-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AgentRole" AS ENUM ('SUPPORT', 'MANAGEMENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TicketSource" AS ENUM ('EMAIL', 'WEB_FORM', 'TELEGRAM_BOT');

-- CreateEnum
CREATE TYPE "public"."SenderType" AS ENUM ('CLIENT', 'AGENT');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bonusPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'CLIENT';

-- CreateTable
CREATE TABLE "public"."SupportAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "role" "public"."AgentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportRoute" (
    "id" TEXT NOT NULL,
    "kyanchirEmail" TEXT NOT NULL,
    "assignedRole" "public"."AgentRole" NOT NULL,

    CONSTRAINT "SupportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportTicket" (
    "id" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientName" TEXT,
    "subject" TEXT NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "source" "public"."TicketSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderType" "public"."SenderType" NOT NULL,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportAgent_email_key" ON "public"."SupportAgent"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SupportAgent_telegramId_key" ON "public"."SupportAgent"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportRoute_kyanchirEmail_key" ON "public"."SupportRoute"("kyanchirEmail");

-- AddForeignKey
ALTER TABLE "public"."SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportMessage" ADD CONSTRAINT "SupportMessage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."SupportAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
