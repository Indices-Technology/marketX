-- Association cut: default drops to 0.2%, and the value is bounded.
--
-- The cut now comes OUT OF THE SELLER'S SHARE rather than being credited on top
-- of it (see walletService.releaseFundsOnDelivery), so the percentage is real
-- money taken from a seller rather than a number invented at the platform's
-- expense. 0.5% of every sale is a large deduction under those terms; 0.2% is
-- the new default.
--
-- EXISTING SQUARES ARE DELIBERATELY LEFT ALONE. Current values are 0.5 (x4),
-- 0.75 (x2) and 1.0 (x1) — the last three cannot be the untouched default, so
-- somebody chose them. Rewriting a rate an association agreed to is not a
-- migration's decision to make. Change them individually if intended:
--
--   UPDATE "Square" SET "associationCutPercent" = 0.2 WHERE id = '...';

ALTER TABLE "Square" ALTER COLUMN "associationCutPercent" SET DEFAULT 0.2;

-- Bound the rate. The application clamps the computed cut to the seller's
-- released amount, but a rate above 100 (or below zero) is a data error that
-- should be impossible to store rather than merely survivable at read time.
ALTER TABLE "Square"
  ADD CONSTRAINT "Square_association_cut_range"
    CHECK ("associationCutPercent" >= 0 AND "associationCutPercent" <= 100);
