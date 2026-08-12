-- Denormalised trust tier on the seller row, so surfaces that already load a
-- seller (feed, product tiles, map, search) can label the tier without a second
-- query. Written by the reputation engine on snapshot persist.

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "trustTier" TEXT;

-- Seed from the current snapshots so existing sellers don't wait for their next
-- recompute to show a tier they have already earned. `facts` is the engine's
-- envelope: { enoughEvidence, tier, source, facts: { … } }.
UPDATE "SellerProfile" s
SET "trustTier" = p."facts" ->> 'tier'
FROM "ReputationProfile" p
WHERE p."sellerId" = s."id"
  AND p."isCurrent" = true
  AND p."facts" ->> 'tier' IS NOT NULL;
