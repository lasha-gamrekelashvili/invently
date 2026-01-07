/*
  Warnings:

  - You are about to drop the column `status` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."ProductStatus";

-- CreateIndex
CREATE INDEX "products_tenantId_isActive_idx" ON "public"."products"("tenantId", "isActive");
