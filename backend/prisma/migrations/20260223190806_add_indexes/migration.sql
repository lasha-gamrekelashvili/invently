-- CreateIndex
CREATE INDEX "carts_tenantId_sessionId_idx" ON "public"."carts"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "orders_tenantId_createdAt_idx" ON "public"."orders"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_tenantId_paymentStatus_idx" ON "public"."orders"("tenantId", "paymentStatus");
