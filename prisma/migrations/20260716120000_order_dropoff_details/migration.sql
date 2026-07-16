-- Drop-off booking details for GIG "drop off at a service centre" flow.
-- Holds { tempCode, centre: { id, name, code, address } }; nullable/additive.
ALTER TABLE "Orders" ADD COLUMN "dropoffDetails" JSONB;
