-- CreateEnum
CREATE TYPE "ReputationDimension" AS ENUM ('IDENTITY', 'HISTORY', 'COMMERCE', 'FINANCIAL', 'COMMUNITY', 'SOCIAL');

-- CreateEnum
CREATE TYPE "SignalTier" AS ENUM ('GOLD', 'SILVER', 'BRONZE');

-- CreateEnum
CREATE TYPE "SignalSource" AS ENUM ('ESCROW_TRANSACTION', 'MANUAL_ESCROW', 'POD_DELIVERY', 'KYC_PROVIDER', 'CAC_REGISTRY', 'OPEN_BANKING', 'ASSOCIATION_ATTESTATION', 'FIELD_VERIFICATION', 'SOCIAL_IMPORT', 'PLATFORM_OBSERVED', 'SELF_REPORTED');

-- CreateTable
CREATE TABLE "ReputationSignal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sellerId" UUID NOT NULL,
    "signalKey" TEXT NOT NULL,
    "dimension" "ReputationDimension" NOT NULL,
    "tier" "SignalTier" NOT NULL,
    "value" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sourceType" "SignalSource" NOT NULL,
    "sourceRef" TEXT,
    "method" TEXT NOT NULL,
    "verifierId" TEXT,
    "observedAt" TIMESTAMPTZ(6) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6),
    "supersededById" UUID,
    "revokedAt" TIMESTAMPTZ(6),
    "revokedReason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReputationSignal_sellerId_dimension_observedAt_idx" ON "ReputationSignal"("sellerId", "dimension", "observedAt" DESC);

-- CreateIndex
CREATE INDEX "ReputationSignal_signalKey_idx" ON "ReputationSignal"("signalKey");

-- CreateIndex
CREATE INDEX "ReputationSignal_sourceRef_idx" ON "ReputationSignal"("sourceRef");
