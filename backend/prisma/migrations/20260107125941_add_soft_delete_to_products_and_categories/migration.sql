/*
  Warnings:

  - A unique constraint covering the columns `[sku,tenantId]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."categories_slug_tenantId_key";

-- DropIndex
DROP INDEX "public"."products_slug_tenantId_key";

-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sku" TEXT;

-- CreateIndex
CREATE INDEX "categories_tenantId_isDeleted_idx" ON "public"."categories"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "categories_slug_tenantId_idx" ON "public"."categories"("slug", "tenantId");

-- CreateIndex
CREATE INDEX "products_tenantId_isDeleted_idx" ON "public"."products"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "products_slug_tenantId_idx" ON "public"."products"("slug", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_tenantId_key" ON "public"."products"("sku", "tenantId");
