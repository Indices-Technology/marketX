-- Add GOOGLE_GBP to the SocialPlatform enum (Google Business Profile connections).
-- Postgres requires ADD VALUE outside a transaction; Prisma runs migration
-- statements individually so this is safe. IF NOT EXISTS guards re-runs.
ALTER TYPE "SocialPlatform" ADD VALUE IF NOT EXISTS 'GOOGLE_GBP';
