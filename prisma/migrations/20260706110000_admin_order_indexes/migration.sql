-- Admin finance/orders: index the columns admin-wide order queries filter/order on.
CREATE INDEX IF NOT EXISTS "Orders_paymentStatus_created_at_idx" ON "Orders" ("paymentStatus", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "Orders_created_at_idx" ON "Orders" ("created_at" DESC);
