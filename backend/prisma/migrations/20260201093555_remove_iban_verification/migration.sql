/*
  Warnings:

  - You are about to drop the column `ibanUpdatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `ibanVerified` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "ibanUpdatedAt",
DROP COLUMN "ibanVerified";
