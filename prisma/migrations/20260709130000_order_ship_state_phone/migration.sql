-- Destination state + phone on Orders. county is the LGA, NOT the state; carrier
-- station resolution needs the state, so capture it distinctly. Nullable/additive
-- — existing orders keep NULL (they predate carrier booking).
ALTER TABLE "Orders"
  ADD COLUMN "shipState" TEXT,
  ADD COLUMN "shipPhone" TEXT;
