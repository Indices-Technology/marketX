-- CreateTable
CREATE TABLE "TrustScanEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sellerId" UUID NOT NULL,
    "surface" TEXT,
    "orderId" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrustScanEvent_sellerId_created_at_idx" ON "TrustScanEvent"("sellerId", "created_at" DESC);
