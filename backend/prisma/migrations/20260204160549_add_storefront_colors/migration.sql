-- AlterTable
ALTER TABLE "public"."store_settings" ADD COLUMN     "backgroundColor" TEXT DEFAULT '#fafafa',
ADD COLUMN     "cardInfoBackgroundColor" TEXT DEFAULT '#fafafa',
ADD COLUMN     "sidebarBackgroundColor" TEXT DEFAULT '#f5f5f5',
ADD COLUMN     "sidebarHoverColor" TEXT DEFAULT '#e5e5e580',
ADD COLUMN     "sidebarSelectedColor" TEXT DEFAULT '#e5e5e5';
