-- Creator/store media watermark (reels & video). Additive + non-destructive.
ALTER TABLE "SellerProfile"
  ADD COLUMN "watermark_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "watermark_text" TEXT;
