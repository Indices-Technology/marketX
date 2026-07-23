-- CreateTable
CREATE TABLE "ReputationProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sellerId" UUID NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "facts" JSONB NOT NULL,
    "dimensions" JSONB NOT NULL,
    "computedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReputationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReputationProfile_sellerId_isCurrent_idx" ON "ReputationProfile"("sellerId", "isCurrent");

-- CreateIndex
CREATE INDEX "ReputationProfile_sellerId_computedAt_idx" ON "ReputationProfile"("sellerId", "computedAt" DESC);
