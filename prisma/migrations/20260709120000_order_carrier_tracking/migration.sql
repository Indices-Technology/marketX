-- Carrier tracking fields on Orders: set at GIG booking and updated by the
-- tracking poller. All nullable/additive — no backfill, no data loss.
ALTER TABLE "Orders"
  ADD COLUMN "waybill"         TEXT,
  ADD COLUMN "bookingMode"     TEXT,
  ADD COLUMN "carrierStatus"   TEXT,
  ADD COLUMN "carrierStatusAt" TIMESTAMPTZ,
  ADD COLUMN "deliveredAt"     TIMESTAMPTZ;

-- Poller batch-fetches in-flight shipments by waybill.
CREATE INDEX "Orders_waybill_idx" ON "Orders" ("waybill");
