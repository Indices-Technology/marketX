-- ── Second wave: core-table drift (moderation, social connections, reviews,
-- affiliate/order fields, seller profile fields, post/story counters, etc.) ──

-- CreateEnum
DO $$ BEGIN
CREATE TYPE "ModerationStatus" AS ENUM ('ACTIVE', 'FLAGGED', 'UNDER_REVIEW', 'HIDDEN', 'REMOVED');
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- CreateEnum
DO $$ BEGIN
CREATE TYPE "SocialPlatform" AS ENUM ('TIKTOK', 'META_FB', 'META_IG');
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- CreateEnum
DO $$ BEGIN
CREATE TYPE "SocialConnectionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MENTION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SQUARE_ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SQUARE_MEMBERSHIP_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SQUARE_MEMBERSHIP_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SQUARE_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SQUARE_OFFER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WALL_SHOUTOUT';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'SHIPPING_PAID';

-- DropForeignKey
DO $$ BEGIN
ALTER TABLE "Measurement" DROP CONSTRAINT "Measurement_productId_fkey";
EXCEPTION
WHEN undefined_object THEN NULL;
WHEN undefined_table THEN NULL;
END $$;

-- DropForeignKey
DO $$ BEGIN
ALTER TABLE "Products" DROP CONSTRAINT "Products_shippingZoneId_fkey";
EXCEPTION
WHEN undefined_object THEN NULL;
WHEN undefined_table THEN NULL;
END $$;

-- DropForeignKey
DO $$ BEGIN
ALTER TABLE "ShippingZone" DROP CONSTRAINT "ShippingZone_sellerId_fkey";
EXCEPTION
WHEN undefined_object THEN NULL;
WHEN undefined_table THEN NULL;
END $$;

-- DropForeignKey
DO $$ BEGIN
ALTER TABLE "SocialMediaInfo" DROP CONSTRAINT "SocialMediaInfo_productId_fkey";
EXCEPTION
WHEN undefined_object THEN NULL;
WHEN undefined_table THEN NULL;
END $$;

-- DropForeignKey
DO $$ BEGIN
ALTER TABLE "SocialMediaInfo" DROP CONSTRAINT "SocialMediaInfo_userId_fkey";
EXCEPTION
WHEN undefined_object THEN NULL;
WHEN undefined_table THEN NULL;
END $$;

-- DropForeignKey
DO $$ BEGIN
ALTER TABLE "ZoneRate" DROP CONSTRAINT "ZoneRate_zoneId_fkey";
EXCEPTION
WHEN undefined_object THEN NULL;
WHEN undefined_table THEN NULL;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "Addresses_userId_key";

-- DropIndex
DROP INDEX IF EXISTS "Orders_paymentRef_key";

-- AlterTable
ALTER TABLE "Addresses" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "label" TEXT;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "priceAtAdd" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "musicArtist" TEXT,
ADD COLUMN IF NOT EXISTS "musicSource" TEXT,
ADD COLUMN IF NOT EXISTS "musicSourceUrl" TEXT,
ADD COLUMN IF NOT EXISTS "musicTitle" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "conversationId" UUID;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "affiliateCut" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "affiliateCut" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "affiliateUserId" UUID,
ADD COLUMN IF NOT EXISTS "purchaseGroupId" UUID,
ADD COLUMN IF NOT EXISTS "shippingBreakdown" JSONB,
ALTER COLUMN "shippedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "carrierStatusAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deliveredAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PodDelivery" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isProductPost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "mentions" JSONB,
ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "squareId" UUID,
ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "wallTargetSlug" TEXT,
ADD COLUMN IF NOT EXISTS "wallTargetType" TEXT;

-- AlterTable
ALTER TABLE "Products" DROP COLUMN IF EXISTS "shippingZoneId",
ADD COLUMN IF NOT EXISTS "cartCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "condition" TEXT,
ADD COLUMN IF NOT EXISTS "dealEndsAt" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "isDeal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "linkedPostId" UUID,
ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "showInFeed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "showInReels" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "socialCaptions" JSONB,
ADD COLUMN IF NOT EXISTS "squareId" UUID,
ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "businessHours" JSONB,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "hideLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "locationLabel" TEXT,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "pod_delivery_days" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS "pod_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "pod_zones" JSONB,
ADD COLUMN IF NOT EXISTS "primarySquareId" UUID,
ADD COLUMN IF NOT EXISTS "shippingConfig" JSONB,
ADD COLUMN IF NOT EXISTS "state" TEXT,
ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
ADD COLUMN IF NOT EXISTS "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "show_near_me" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "show_shop_today" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "show_stories" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE IF EXISTS "Measurement" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "ShippingZone" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "SocialMediaInfo" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "ZoneRate" CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PostTags" (
    "postId" UUID NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "PostTags_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" INTEGER NOT NULL,
    "authorId" UUID NOT NULL,
    "orderId" INTEGER,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SocialConnection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sellerId" UUID NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMPTZ(6),
    "refreshExpiresAt" TIMESTAMPTZ(6),
    "status" "SocialConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_productId_idx" ON "Review"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_authorId_idx" ON "Review"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Review_productId_authorId_key" ON "Review"("productId", "authorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SocialConnection_sellerId_status_idx" ON "SocialConnection"("sellerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SocialConnection_sellerId_platform_providerUserId_key" ON "SocialConnection"("sellerId", "platform", "providerUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Addresses_userId_idx" ON "Addresses"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comment_productId_parentId_created_at_idx" ON "Comment"("productId", "parentId", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comment_postId_parentId_created_at_idx" ON "Comment"("postId", "parentId", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Follow_followerId_followingType_idx" ON "Follow"("followerId", "followingType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Orders_paymentRef_idx" ON "Orders"("paymentRef");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Orders_purchaseGroupId_idx" ON "Orders"("purchaseGroupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Orders_userId_created_at_idx" ON "Orders"("userId", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_created_at_idx" ON "Post"("created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_visibility_created_at_idx" ON "Post"("visibility", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_moderationStatus_idx" ON "Post"("moderationStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_wallTargetType_wallTargetSlug_created_at_idx" ON "Post"("wallTargetType", "wallTargetSlug", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Products_linkedPostId_key" ON "Products"("linkedPostId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Products_status_created_at_idx" ON "Products"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Products_status_isDeal_created_at_idx" ON "Products"("status", "isDeal", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Products_status_showInFeed_created_at_idx" ON "Products"("status", "showInFeed", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Products_status_isThrift_created_at_idx" ON "Products"("status", "isThrift", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Products_moderationStatus_idx" ON "Products"("moderationStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SellerProfile_is_active_followers_count_idx" ON "SellerProfile"("is_active", "followers_count" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Story_expiresAt_idx" ON "Story"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Story_authorId_expiresAt_idx" ON "Story"("authorId", "expiresAt");

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "Products" ADD CONSTRAINT "Products_linkedPostId_fkey" FOREIGN KEY ("linkedPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "Products" ADD CONSTRAINT "Products_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES "Square"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_affiliateUserId_fkey" FOREIGN KEY ("affiliateUserId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "Post" ADD CONSTRAINT "Post_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES "Square"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "PostTags" ADD CONSTRAINT "PostTags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "PostTags" ADD CONSTRAINT "PostTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- AddForeignKey
DO $$ BEGIN
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;