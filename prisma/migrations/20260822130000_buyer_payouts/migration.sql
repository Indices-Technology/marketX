-- Affiliates who are not sellers can finally be paid.
--
-- THE PROBLEM
--
-- A referrer without a seller profile has their commission credited to a
-- BuyerWallet. There has never been a way to withdraw from one — only balance
-- and transaction listing endpoints exist. Those people have earned real money,
-- can see it, and cannot get it. Every order through their link grows an
-- obligation the platform has no mechanism to discharge.
--
-- THE SHAPE
--
-- `Payout` becomes polymorphic instead of gaining a parallel BuyerPayout table:
-- one queue, one approval path, one executor, one status machine. A second table
-- would mean every later settlement feature had to be built twice and kept in
-- step.
--
-- Exactly one of walletId / buyerWalletId is set, enforced by CHECK rather than
-- by convention — a payout belonging to both wallets, or to neither, is not a
-- state the system should be able to represent.
--
-- THE TALLY THIS PRESERVES
--
--   goods line total = affiliate commission + association cut + seller amount
--
-- The affiliate side already holds by construction: orderItem.affiliateCut is
-- clamped at order time to never exceed the line total the buyer paid, and
-- Orders.affiliateCut is the exact sum of its items' cuts. A buyer wallet is
-- credited that same figure and nothing else, so what an affiliate can withdraw
-- can never exceed what was actually deducted from goods.

ALTER TABLE "Payout" ALTER COLUMN "walletId" DROP NOT NULL;

ALTER TABLE "Payout" ADD COLUMN "buyerWalletId" UUID;

ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_buyerWalletId_fkey"
    FOREIGN KEY ("buyerWalletId") REFERENCES "BuyerWallet"("id") ON DELETE CASCADE;

-- Exactly one owner. Not zero, not both.
ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_exactly_one_wallet"
    CHECK (("walletId" IS NOT NULL) <> ("buyerWalletId" IS NOT NULL));

CREATE INDEX "Payout_buyerWalletId_idx" ON "Payout" ("buyerWalletId");
