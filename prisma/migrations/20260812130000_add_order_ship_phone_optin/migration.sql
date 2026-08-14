-- Per-order WhatsApp opt-in for the delivery contact number (Orders.shipPhone).
--
-- Defaults to false on purpose: existing orders were placed without ever being
-- asked, and consent to message a number cannot be backfilled. Only rows written
-- after the checkout checkbox ships will carry true.

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "shipPhoneOptIn" BOOLEAN NOT NULL DEFAULT false;
