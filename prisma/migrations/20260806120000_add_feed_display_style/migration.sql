-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "feed_display_style" TEXT NOT NULL DEFAULT 'minimal';