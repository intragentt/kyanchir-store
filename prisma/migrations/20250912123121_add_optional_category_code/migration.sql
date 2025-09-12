-- DropIndex
DROP INDEX "Category_code_key";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "code" DROP DEFAULT;
