-- AlterEnum
ALTER TYPE "GrowthChannel" ADD VALUE 'AFFILIATE';

-- AlterTable
ALTER TABLE "AssetDistribution" ADD COLUMN     "sharerProfileId" UUID;

-- CreateIndex
CREATE INDEX "AssetDistribution_sharerProfileId_idx" ON "AssetDistribution"("sharerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDistribution_assetId_channel_sharerProfileId_key" ON "AssetDistribution"("assetId", "channel", "sharerProfileId");