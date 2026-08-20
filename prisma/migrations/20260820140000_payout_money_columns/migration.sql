-- Payout money becomes typed, constrained columns instead of a JSON blob.
--
-- `Payout.amount` has always held the GROSS debited from the seller's wallet.
-- The amount actually owed to the seller — gross minus the percentage platform
-- fee and the flat transfer fee — was written only into the `bank_account` JSON
-- as `netAmount`, sharing a column with the destination account details.
--
-- Nothing is broken today. The admin payouts screen reads that key and shows it
-- as the payable. But it reads it as
--     net ?? p.amount
-- which silently falls back to the GROSS when the key is absent, so any row
-- written before `netAmount` existed renders a payable larger than what is
-- owed. A human transferring the money by hand has the request in front of them
-- and catches it; an automated executor reading the same table would not.
--
-- Automated settlement must take the amount to send from a typed column whose
-- invariants the database itself enforces — not from an untyped blob behind a
-- fallback that fails in the direction of overpaying.
--
-- Non-destructive: `amount` and the JSON both stay, and both continue to be
-- written, so every existing reader keeps working and this step can be stopped
-- after without a follow-up.

ALTER TABLE "Payout"
  ADD COLUMN "amountGross" DOUBLE PRECISION,
  ADD COLUMN "amountNet"   DOUBLE PRECISION,
  ADD COLUMN "platformFee" DOUBLE PRECISION,
  ADD COLUMN "transferFee" DOUBLE PRECISION;

-- 1. Gross is unambiguous: `amount` has held it on every row ever written.
UPDATE "Payout" SET "amountGross" = "amount";

-- 2. Net and the fee split, wherever the JSON actually recorded them. The regex
--    guard keeps a malformed value from aborting the whole migration on a cast;
--    such a row simply falls through to step 3 or stays NULL.
UPDATE "Payout"
SET "amountNet"   = ("bank_account" ->> 'netAmount')::DOUBLE PRECISION,
    "platformFee" = NULLIF("bank_account" ->> 'platformFee', '')::DOUBLE PRECISION,
    "transferFee" = NULLIF("bank_account" ->> 'transferFee', '')::DOUBLE PRECISION
WHERE "bank_account" ->> 'netAmount' ~ '^[0-9]+(\.[0-9]+)?$';

-- 3. PENDING rows that never recorded a net. A pending payout has not been paid,
--    so there is no historical figure to preserve — its net is whatever fee
--    policy says at payment time. Apply the current default schedule (3% +
--    ₦50 flat; see server/utils/fees.ts) so every unpaid row carries an explicit
--    number rather than relying on a reader's fallback.
--
--    If PLATFORM_FEE_PERCENT or PAYSTACK_TRANSFER_FEE_KOBO are overridden in the
--    target environment, adjust the two literals below before applying.
UPDATE "Payout"
SET "platformFee" = round(("amount" * 0.03)::numeric)::DOUBLE PRECISION,
    "transferFee" = 5000,
    "amountNet"   = GREATEST(
                      0,
                      "amount" - round(("amount" * 0.03)::numeric)::DOUBLE PRECISION - 5000
                    )
WHERE "status" = 'PENDING' AND "amountNet" IS NULL;

-- 4. Gross is knowable for every row, so it is mandatory. Net deliberately stays
--    nullable: a historical PAID/REJECTED row whose net was never recorded has
--    no honest value, and inventing one would misstate what was actually sent.
ALTER TABLE "Payout" ALTER COLUMN "amountGross" SET NOT NULL;

ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_amounts_nonnegative"
    CHECK ("amountGross" >= 0 AND ("amountNet" IS NULL OR "amountNet" >= 0)),
  -- Paying out more than was debited from the wallet is unrepresentable.
  ADD CONSTRAINT "Payout_net_not_above_gross"
    CHECK ("amountNet" IS NULL OR "amountNet" <= "amountGross"),
  -- Fail closed: anything still awaiting payment must carry a known net, so the
  -- executor can never be handed a row it would have to guess about.
  ADD CONSTRAINT "Payout_pending_requires_net"
    CHECK ("status" <> 'PENDING' OR "amountNet" IS NOT NULL);
