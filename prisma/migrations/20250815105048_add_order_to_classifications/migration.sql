-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Tag" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;
