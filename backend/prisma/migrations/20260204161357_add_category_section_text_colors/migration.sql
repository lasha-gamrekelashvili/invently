-- AlterTable
ALTER TABLE "public"."store_settings" ADD COLUMN     "categorySectionAccentColor" TEXT DEFAULT '#171717',
ADD COLUMN     "categorySectionLinkColor" TEXT DEFAULT '#525252',
ADD COLUMN     "categorySectionLinkHoverColor" TEXT DEFAULT '#171717',
ADD COLUMN     "categorySectionTitleColor" TEXT DEFAULT '#171717';
