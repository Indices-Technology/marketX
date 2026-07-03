-- Pay-on-Delivery lifecycle table (one per POD order). See docs/POD.md.
CREATE TABLE "PodDelivery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'INITIATED',
    "freightDepositMinor" INTEGER NOT NULL,
    "freightTaxMinor" INTEGER NOT NULL DEFAULT 0,
    "codAmountMinor" INTEGER NOT NULL,
    "trackingRef" TEXT,
    "attemptOutcome" TEXT,
    "attemptProof" JSONB,
    "attemptedAt" TIMESTAMPTZ(6),
    "disputeWindowEndsAt" TIMESTAMPTZ(6),
    "remittedAmountMinor" INTEGER,
    "remittedAt" TIMESTAMPTZ(6),
    "reconciledAt" TIMESTAMPTZ(6),
    "settledAt" TIMESTAMPTZ(6),
    "freightRefundedAt" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PodDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PodDelivery_orderId_key" ON "PodDelivery"("orderId");
CREATE INDEX "PodDelivery_state_idx" ON "PodDelivery"("state");
CREATE INDEX "PodDelivery_provider_state_idx" ON "PodDelivery"("provider", "state");

ALTER TABLE "PodDelivery" ADD CONSTRAINT "PodDelivery_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
