-- CreateTable
CREATE TABLE "SkuSequence" (
    "prefix" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SkuSequence_pkey" PRIMARY KEY ("prefix")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkuSequence_prefix_key" ON "SkuSequence"("prefix");
