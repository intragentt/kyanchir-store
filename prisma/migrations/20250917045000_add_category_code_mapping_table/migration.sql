-- CreateTable
CREATE TABLE "CategoryCodeMapping" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "assignedCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryCodeMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryCodeMapping_categoryName_key" ON "CategoryCodeMapping"("categoryName");
