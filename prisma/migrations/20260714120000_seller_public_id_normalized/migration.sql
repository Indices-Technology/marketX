-- Separator/case-insensitive shadow of publicId for lookup. Customers type the
-- public seller ID however they read it off a card (with hyphens, spaces, or
-- none), so searches match this collapsed uppercase alphanumeric form.

-- 1. Add the column.
ALTER TABLE "SellerProfile" ADD COLUMN "publicIdNormalized" TEXT;

-- 2. Backfill existing rows: strip every non-alphanumeric char, upper-case.
--    "MX-PLA-VDKR" -> "MXPLAVDKR". Matches normalizePublicId() in app code.
UPDATE "SellerProfile"
SET    "publicIdNormalized" = upper(regexp_replace("publicId", '[^A-Za-z0-9]', '', 'g'))
WHERE  "publicId" IS NOT NULL;

-- 3. Index for exact/prefix lookups (substring `contains` still seq-scans;
--    fine at current seller volume — revisit with a pg_trgm GIN index at scale).
CREATE INDEX "SellerProfile_publicIdNormalized_idx" ON "SellerProfile"("publicIdNormalized");
