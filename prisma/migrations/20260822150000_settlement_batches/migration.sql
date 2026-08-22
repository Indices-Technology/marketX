-- Settlement batches: the machine prepares, a human approves.
--
-- WHAT A BATCH IS
--
-- A proposal, not a payout. Preparing a batch reads wallets and writes ONLY
-- SettlementBatch/SettlementBatchItem rows — it never debits a wallet and never
-- creates a Payout. That separation is what makes shadow mode possible: the
-- engine can run daily for weeks against live balances, and be checked against
-- human judgement, with no way for it to move money.
--
-- A batch item becomes a real Payout only when a person approves the batch. The
-- `payoutId` back-reference records which proposal produced which payout.
--
-- WHY THE DIGEST
--
-- `approvalDigest` fixes what was approved: a hash over each item's id, net
-- amount and destination at preparation time. It is recomputed before execution
-- and a mismatch aborts the batch. Without it, "approved ₦2m" and "sent ₦2m" are
-- two unrelated facts and the approval means nothing — anything that mutated in
-- between would be paid out under a signature that never covered it.
--
-- WHY approvedBy IS TEXT, NOT A USER FK
--
-- Approval is granted by a POLICY, and a person is one policy outcome. Today it
-- is always a moderator id. Later, low-risk items may be auto-approved under a
-- named rule, recorded as 'SYSTEM:policy-v1'. Same column, same audit trail, no
-- re-architecture — and no foreign key that would forbid a non-human approver.

CREATE TYPE "SettlementBatchStatus" AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'EXECUTING',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "SettlementBatch" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "status"         "SettlementBatchStatus" NOT NULL DEFAULT 'DRAFT',
  "currency"       TEXT NOT NULL DEFAULT 'NGN',
  -- True = prepared for observation only. A shadow batch can never be approved
  -- or executed; it exists to be read and compared against what a human would
  -- have done.
  "shadow"         BOOLEAN NOT NULL DEFAULT true,
  "periodStart"    TIMESTAMPTZ NOT NULL,
  "periodEnd"      TIMESTAMPTZ NOT NULL,
  "payoutCount"    INTEGER NOT NULL DEFAULT 0,
  "flaggedCount"   INTEGER NOT NULL DEFAULT 0,
  "totalGross"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalNet"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalFees"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "approvalDigest" TEXT,
  "preparedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "approvedAt"     TIMESTAMPTZ,
  "approvedBy"     TEXT,
  "executedAt"     TIMESTAMPTZ,
  "notes"          TEXT,
  CONSTRAINT "SettlementBatch_currency_iso" CHECK ("currency" ~ '^[A-Z]{3}$'),
  CONSTRAINT "SettlementBatch_totals_nonnegative"
    CHECK ("totalGross" >= 0 AND "totalNet" >= 0 AND "totalFees" >= 0),
  CONSTRAINT "SettlementBatch_net_not_above_gross" CHECK ("totalNet" <= "totalGross"),
  -- A shadow batch is an observation. Letting one carry an approval or an
  -- execution timestamp would make the safest mode look like a real payout run.
  CONSTRAINT "SettlementBatch_shadow_never_settles"
    CHECK (NOT "shadow" OR ("approvedAt" IS NULL AND "executedAt" IS NULL))
);

CREATE TABLE "SettlementBatchItem" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId"       UUID NOT NULL,
  -- Mirrors Payout: a seller wallet OR a buyer (affiliate) wallet, never both.
  "walletId"      UUID,
  "buyerWalletId" UUID,
  "amountGross"   DOUBLE PRECISION NOT NULL,
  "amountNet"     DOUBLE PRECISION NOT NULL,
  "platformFee"   DOUBLE PRECISION NOT NULL,
  "transferFee"   DOUBLE PRECISION NOT NULL,
  -- Risk codes that fired, e.g. {FIRST_PAYOUT,BANK_CHANGED_RECENTLY}. Stored as
  -- codes rather than prose so they can be filtered, counted and tuned.
  "flags"         TEXT[] NOT NULL DEFAULT '{}',
  -- Flagged items default to excluded: attention is opt-in for the machine and
  -- opt-out for the human, never the reverse.
  "excluded"      BOOLEAN NOT NULL DEFAULT false,
  "excludeReason" TEXT,
  -- Set when approval turns this proposal into a real payout.
  "payoutId"      UUID,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "SettlementBatchItem_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "SettlementBatch"("id") ON DELETE CASCADE,
  CONSTRAINT "SettlementBatchItem_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "SellerWallet"("id") ON DELETE CASCADE,
  CONSTRAINT "SettlementBatchItem_buyerWalletId_fkey"
    FOREIGN KEY ("buyerWalletId") REFERENCES "BuyerWallet"("id") ON DELETE CASCADE,
  CONSTRAINT "SettlementBatchItem_payoutId_fkey"
    FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL,
  CONSTRAINT "SettlementBatchItem_exactly_one_wallet"
    CHECK (("walletId" IS NOT NULL) <> ("buyerWalletId" IS NOT NULL)),
  CONSTRAINT "SettlementBatchItem_amounts_sane"
    CHECK ("amountGross" >= 0 AND "amountNet" >= 0 AND "amountNet" <= "amountGross"),
  -- The same reason the Payout table has it: an item that reaches execution with
  -- no net is a row the executor would have to guess about.
  CONSTRAINT "SettlementBatchItem_net_required" CHECK ("amountNet" > 0)
);

-- One proposal per payee per batch — a wallet paid twice in the same run is a
-- preparation bug, and the database should refuse to record it.
CREATE UNIQUE INDEX "SettlementBatchItem_batch_wallet_key"
  ON "SettlementBatchItem" ("batchId", "walletId") WHERE "walletId" IS NOT NULL;
CREATE UNIQUE INDEX "SettlementBatchItem_batch_buyerWallet_key"
  ON "SettlementBatchItem" ("batchId", "buyerWalletId") WHERE "buyerWalletId" IS NOT NULL;

-- A payout originates from at most one proposal.
CREATE UNIQUE INDEX "SettlementBatchItem_payoutId_key"
  ON "SettlementBatchItem" ("payoutId") WHERE "payoutId" IS NOT NULL;

CREATE INDEX "SettlementBatch_status_preparedAt_idx"
  ON "SettlementBatch" ("status", "preparedAt" DESC);
CREATE INDEX "SettlementBatchItem_batchId_idx" ON "SettlementBatchItem" ("batchId");
