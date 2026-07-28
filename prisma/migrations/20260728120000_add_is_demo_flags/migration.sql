-- Closed-testing demo markers. Additive + idempotent backfill: existing rows
-- default to false, then everything rooted in a seeded @peppr.test profile is
-- flagged as demo. See docs/DB_CLEANUP.md.

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- Backfill demo markers from the @peppr.test seed convention
UPDATE "Profile" SET "isDemo" = true WHERE "email" LIKE '%@peppr.test';

UPDATE "SellerProfile" AS s SET "isDemo" = true
FROM "Profile" AS p
WHERE s."profileId" = p."id" AND p."email" LIKE '%@peppr.test';

UPDATE "Post" AS po SET "isDemo" = true
FROM "Profile" AS p
WHERE po."authorId" = p."id" AND p."email" LIKE '%@peppr.test';
