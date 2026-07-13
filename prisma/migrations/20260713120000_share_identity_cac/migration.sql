-- Share Identity System: immutable public seller ID + Nigeria CAC business
-- registration. All additive/nullable — existing sellers keep NULL until the
-- publicId backfill runs; cac_verified defaults false.

CREATE TYPE "CacType" AS ENUM ('RC', 'BN');

ALTER TABLE "SellerProfile"
  ADD COLUMN "publicId" TEXT,
  ADD COLUMN "business_name" TEXT,
  ADD COLUMN "cac_number" TEXT,
  ADD COLUMN "cac_type" "CacType",
  ADD COLUMN "cac_verified" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "SellerProfile_publicId_key" ON "SellerProfile"("publicId");
