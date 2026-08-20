-- Payout.status becomes a database enum instead of a free-text column.
--
-- Three values are used in practice today — PENDING, PAID, REJECTED — enforced
-- only by scattered application checks and one endpoint validating the string by
-- hand. A typo writes a status nothing will ever match, and the row silently
-- stops appearing in the admin queue.
--
-- Automated settlement needs more states than three, and needs the invalid ones
-- to be unrepresentable rather than merely avoided:
--
--   PENDING     created, awaiting approval
--   APPROVED    a human approved it; not yet handed to a provider
--   PROCESSING  handed to the provider; outcome not yet known
--   PAID        provider confirmed success
--   FAILED      provider rejected it; funds returned to the wallet
--   REVERSED    succeeded, then bounced back; funds returned to the wallet
--   REJECTED    a human declined it; funds returned to the wallet
--
-- PROCESSING is the load-bearing addition. Without it there is no way to record
-- "the money may or may not have left" — which is precisely the state a network
-- timeout leaves you in, and precisely when a naive retry pays twice.
--
-- No behaviour changes here. The three existing values keep their exact names
-- and meanings; this migration only moves the guarantee from convention into the
-- type system.

CREATE TYPE "PayoutStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REVERSED',
  'REJECTED'
);

-- 1. Normalise casing/whitespace before the cast. Every row should already be a
--    clean uppercase value; this makes a stray 'pending ' convert rather than
--    abort the deploy. Anything still unrecognised WILL fail the cast below, on
--    purpose — a status this migration cannot interpret is a data question for a
--    human, not something to silently coerce.
UPDATE "Payout" SET "status" = upper(btrim("status"));

-- 2. The net-required CHECK compares status as text, so it must be dropped
--    before the column changes type and re-added against the enum afterwards.
ALTER TABLE "Payout" DROP CONSTRAINT IF EXISTS "Payout_pending_requires_net";

ALTER TABLE "Payout"
  ALTER COLUMN "status" TYPE "PayoutStatus" USING "status"::"PayoutStatus";

-- 3. Re-add, now enum-typed. Same guarantee as before: anything awaiting payment
--    must carry a known net, so an executor is never handed a row it would have
--    to guess about. APPROVED and PROCESSING are included because by then the
--    row is even closer to money actually moving.
ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_pending_requires_net"
    CHECK ("status" NOT IN ('PENDING', 'APPROVED', 'PROCESSING') OR "amountNet" IS NOT NULL);

-- 4. The admin queue is always filtered by status, and the settlement executor
--    will poll for APPROVED/PROCESSING rows. Both are status-first lookups.
CREATE INDEX IF NOT EXISTS "Payout_status_requested_at_idx"
  ON "Payout" ("status", "requested_at" DESC);
