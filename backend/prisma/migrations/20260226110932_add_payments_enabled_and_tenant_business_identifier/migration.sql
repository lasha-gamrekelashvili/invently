-- AlterTable
ALTER TABLE "public"."store_settings" ADD COLUMN     "paymentsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."tenants" ADD COLUMN     "businessIdentifier" TEXT;
