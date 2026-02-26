-- AlterTable
ALTER TABLE "public"."store_settings" ADD COLUMN     "allowOrdersWithoutPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "catalogueOnlyMessage" TEXT;
