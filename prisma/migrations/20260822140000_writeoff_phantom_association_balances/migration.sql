-- Write off association balances credited at nobody's expense.
--
-- WHAT WENT WRONG
--
-- Until the association cut moved into the seller's share, `creditAssociation`
-- credited a Square wallet on every paid order WITHOUT debiting the seller and
-- without reducing the seller's own credit. The money was invented: the sum of
-- all wallet balances exceeded what the platform had actually collected, by
-- exactly the total of those cuts.
--
-- WHY A FULL WRITE-OFF IS THE RIGHT ANSWER
--
-- Verified against the data before writing this:
--   * exactly one code path has ever credited SquareWallet.balance
--   * for every wallet, balance = totalEarned = SUM(SquareTransaction.cutAmount)
--   * SquarePayout has zero rows — no association money has ever been paid out
--
-- So every kobo of these balances came from the broken path, and none of it has
-- left the platform. There is no legitimate portion to preserve and no recipient
-- to make whole. Zeroing them removes a liability that was never real.
--
-- HOW, AND WHY NOT JUST `SET balance = 0`
--
-- Each phantom credit gets an explicit reversing SquareTransaction rather than
-- the balances being silently reset. The original rows stay exactly as written —
-- they are the record of what happened, and deleting them would destroy the
-- evidence for this correction. After this runs, SUM(cutAmount) per wallet is 0
-- and matches the zeroed balance, so the ledger explains itself to anyone who
-- looks later.
--
-- Balances are adjusted by the computed reversal total, not assigned 0, so any
-- legitimate credit written by the NEW path (cut taken out of the seller's share
-- at release) survives untouched.

-- 1. One reversing entry per phantom credit. Restricted to rows that exist now,
--    so a credit written by the new path during deploy is not swept up.
INSERT INTO "SquareTransaction"
  ("squareId", "walletId", "orderId", "sellerAmount", "cutPercent", "cutAmount", "created_at")
SELECT
  t."squareId",
  t."walletId",
  t."orderId",
  t."sellerAmount",
  t."cutPercent",
  -t."cutAmount",
  now()
FROM "SquareTransaction" t
WHERE t."cutAmount" > 0
  AND t."created_at" < now();

-- 2. Reduce each wallet by exactly what was reversed for it.
WITH reversed AS (
  SELECT "walletId", SUM("cutAmount") AS amount
  FROM "SquareTransaction"
  WHERE "cutAmount" < 0
  GROUP BY "walletId"
)
UPDATE "SquareWallet" w
SET balance      = GREATEST(0, w.balance      + r.amount),
    "totalEarned" = GREATEST(0, w."totalEarned" + r.amount)
FROM reversed r
WHERE w.id = r."walletId";
