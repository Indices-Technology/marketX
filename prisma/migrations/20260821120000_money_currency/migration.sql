-- Label every money row with the currency it is denominated in.
--
-- WHY NOW, WHEN EVERYTHING IS NGN
--
-- `currency` exists in this schema only as a display preference —
-- SellerProfile.default_currency and UserSettings.currency. No amount anywhere
-- in the ledger says what it is: Orders.totalAmount, SellerWallet.balance,
-- Transaction.amount, Payout.amountNet and the Square/Buyer equivalents are all
-- bare numbers that the application happens to treat as kobo.
--
-- Collection is already multi-provider (Paystack live, OPay/PayPal/M-Pesa
-- planned), and M-Pesa in particular means KES collected in Kenya, settled in
-- Kenya. At that point a wallet balance without a currency is not merely
-- untidy — it is ambiguous about how much money someone is owed.
--
-- Adding the column now is a defaulted backfill on rows that are all genuinely
-- NGN. Adding it after a second corridor exists means deciding, per historical
-- row, which currency it was — from context that may no longer exist. The cost
-- of doing this early is one migration; the cost of doing it late is a
-- reconciliation exercise against real balances.
--
-- WHAT THIS DELIBERATELY DOES NOT DO
--
-- No behaviour changes. Nothing reads these columns yet; no FX, no per-currency
-- wallet routing, no currency-aware formatting. `SellerWallet.sellerId` also
-- keeps its plain UNIQUE rather than becoming UNIQUE (sellerId, currency) — a
-- seller still has exactly one wallet. That change is cheap to make later
-- precisely because every row this migration writes is NGN, so it is left until
-- a second corridor actually needs it.

ALTER TABLE "Orders"           ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "SellerWallet"     ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "Transaction"      ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "Payout"           ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "BuyerWallet"      ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "BuyerTransaction" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "SquareWallet"     ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "SquareTransaction" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "SquarePayout"     ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';

-- ISO 4217 shape. Cheap, and it stops 'naira', 'ngn' or '' entering a money
-- column — values that would silently split one currency into several buckets
-- in any later grouping or reconciliation query.
ALTER TABLE "Orders"            ADD CONSTRAINT "Orders_currency_iso"            CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "SellerWallet"      ADD CONSTRAINT "SellerWallet_currency_iso"      CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "Transaction"       ADD CONSTRAINT "Transaction_currency_iso"       CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "Payout"            ADD CONSTRAINT "Payout_currency_iso"            CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "BuyerWallet"       ADD CONSTRAINT "BuyerWallet_currency_iso"       CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "BuyerTransaction"  ADD CONSTRAINT "BuyerTransaction_currency_iso"  CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "SquareWallet"      ADD CONSTRAINT "SquareWallet_currency_iso"      CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "SquareTransaction" ADD CONSTRAINT "SquareTransaction_currency_iso" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "SquarePayout"      ADD CONSTRAINT "SquarePayout_currency_iso"      CHECK ("currency" ~ '^[A-Z]{3}$');

-- NOTE: WalletHold deliberately has no currency column. A hold is always
-- denominated in its wallet's currency; giving it an independent one invites the
-- two to drift apart with no way to say which is right.
