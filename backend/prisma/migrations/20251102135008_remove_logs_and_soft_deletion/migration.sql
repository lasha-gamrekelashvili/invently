/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- AlterTable
ALTER TABLE "public"."carts" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."categories" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."product_images" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."product_variants" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."tenants" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "deletedAt";

-- DropTable
DROP TABLE "public"."audit_logs";
