-- Admin performance: index the columns the admin lists order/filter/count on.
-- All additive + non-destructive.
CREATE INDEX IF NOT EXISTS "Profile_created_at_idx" ON "Profile" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "Profile_bannedAt_idx" ON "Profile" ("bannedAt");
CREATE INDEX IF NOT EXISTS "SellerProfile_created_at_idx" ON "SellerProfile" ("created_at" DESC);
