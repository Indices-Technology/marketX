-- Freeze released funds while a dispute is open.
--
-- THE GAP THIS CLOSES
--
-- Seller credit has two phases: pending_balance on payment, then balance on
-- delivery. A dispute resolved against the seller calls reverseOrderCredit,
-- which reverses CREDIT_PENDING rows only.
--
-- So for an order that already reached DELIVERED — which is most disputed
-- orders, since a buyer usually disputes AFTER receiving something wrong — the
-- money is already in `balance`. openDispute has no wallet effect whatsoever,
-- reverseOrderCredit matches zero rows, and nothing stops the seller
-- withdrawing before the dispute is heard.
--
-- Today the only thing standing in the way is that a human sends every payout by
-- hand and would notice. Automate that step without this and the escrow becomes
-- drainable by anyone willing to dispute-and-run.
--
-- HOW IT WORKS
--
-- A hold is a row, not just a number. `SellerWallet.held_balance` is a
-- denormalised counter so the withdrawal guard stays a single atomic statement,
-- but the truth is the sum of ACTIVE WalletHold rows — which makes every freeze
-- attributable to the dispute that caused it, and reconcilable after the fact.
--
--   ACTIVE    dispute open, funds frozen
--   RELEASED  resolved in the seller's favour, funds usable again
--   CAPTURED  resolved against the seller, funds taken back to refund the buyer
--
-- WHAT A HOLD CANNOT DO
--
-- It cannot recover money already withdrawn. If a seller has ₦3,000 left and the
-- disputed order was ₦10,000, only ₦3,000 can be frozen. `amountRequested`
-- records what the dispute was worth and `amount` what was actually secured;
-- the difference is an unsecured claim, recorded honestly rather than hidden by
-- clamping one number.

CREATE TYPE "WalletHoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CAPTURED');

ALTER TABLE "SellerWallet"
  ADD COLUMN "held_balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "WalletHold" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletId"         UUID NOT NULL,
  "orderId"          INTEGER NOT NULL,
  "ticketId"         UUID NOT NULL,
  "amount"           DOUBLE PRECISION NOT NULL,
  "amountRequested"  DOUBLE PRECISION NOT NULL,
  "status"           "WalletHoldStatus" NOT NULL DEFAULT 'ACTIVE',
  "reason"           TEXT NOT NULL,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "resolved_at"      TIMESTAMPTZ,
  CONSTRAINT "WalletHold_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "SellerWallet"("id") ON DELETE CASCADE,
  CONSTRAINT "WalletHold_amounts_sane"
    CHECK ("amount" >= 0 AND "amountRequested" >= 0 AND "amount" <= "amountRequested")
);

-- Idempotency, enforced by the database rather than by a read-then-write check:
-- one dispute freezes one wallet exactly once, however many times the hook runs.
CREATE UNIQUE INDEX "WalletHold_ticketId_walletId_key"
  ON "WalletHold" ("ticketId", "walletId");

-- Reconciliation and release both scan a wallet's active holds.
CREATE INDEX "WalletHold_walletId_status_idx" ON "WalletHold" ("walletId", "status");
CREATE INDEX "WalletHold_orderId_idx" ON "WalletHold" ("orderId");

-- Invariants. `held_balance <= balance` holds under every operation:
--   hold     caps at (balance - held), so it cannot over-freeze
--   withdraw requires (balance - held) >= amount, so balance never falls below held
--   capture  decrements both by the same amount
--   release  decrements held only
-- Enforcing it here makes "we froze money that isn't there" unrepresentable,
-- rather than a property the application is trusted to preserve.
ALTER TABLE "SellerWallet"
  ADD CONSTRAINT "SellerWallet_held_nonnegative" CHECK ("held_balance" >= 0),
  ADD CONSTRAINT "SellerWallet_held_not_above_balance" CHECK ("held_balance" <= "balance");
