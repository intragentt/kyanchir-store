-- CreateTable
CREATE TABLE "public"."AlternativeName" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "AlternativeName_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AlternativeName" ADD CONSTRAINT "AlternativeName_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
