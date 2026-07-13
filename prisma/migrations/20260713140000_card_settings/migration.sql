-- MarketX Card config (owner-controlled visibility + business-card contact
-- values). Nullable/additive.
ALTER TABLE "SellerProfile" ADD COLUMN "cardSettings" JSONB;
