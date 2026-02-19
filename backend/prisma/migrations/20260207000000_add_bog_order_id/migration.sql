-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN "bogOrderId" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "orders_bogOrderId_key" ON "public"."orders"("bogOrderId");
