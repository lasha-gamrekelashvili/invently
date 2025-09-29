-- CreateTable
CREATE TABLE "public"."store_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aboutUs" JSONB,
    "contact" JSONB,
    "privacyPolicy" JSONB,
    "termsOfService" JSONB,
    "shippingInfo" JSONB,
    "returns" JSONB,
    "faq" JSONB,
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "trackOrderUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_settings_tenantId_key" ON "public"."store_settings"("tenantId");

-- AddForeignKey
ALTER TABLE "public"."store_settings" ADD CONSTRAINT "store_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
