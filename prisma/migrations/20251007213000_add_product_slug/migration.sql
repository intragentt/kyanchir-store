ALTER TABLE "public"."Product" ADD COLUMN "slug" TEXT;

CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug");
