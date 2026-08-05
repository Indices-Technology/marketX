-- Buyer's delivery/handling note captured at checkout. Immutable snapshot for the
-- packer/courier, content-guard masked, per-seller, ≤280 chars. NOT a channel to
-- renegotiate the order — kept separate from structured price/terms/address fields.
ALTER TABLE "Orders" ADD COLUMN "buyerNote" VARCHAR(280);
