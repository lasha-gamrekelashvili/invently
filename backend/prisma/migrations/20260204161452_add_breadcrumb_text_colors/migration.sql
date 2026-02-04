-- AlterTable
ALTER TABLE "public"."store_settings" ADD COLUMN     "breadcrumbActiveTextColor" TEXT DEFAULT '#171717',
ADD COLUMN     "breadcrumbHoverColor" TEXT DEFAULT '#171717',
ADD COLUMN     "breadcrumbIconColor" TEXT DEFAULT '#a3a3a3',
ADD COLUMN     "breadcrumbTextColor" TEXT DEFAULT '#525252';
