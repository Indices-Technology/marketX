// Pure signal builders (framework §3). Each maps a domain record to one
// provenance-stamped ReputationSignal payload, ready to enqueue. No side effects
// and no DB access → fully unit-testable. The queue worker persists them
// idempotently (one signal per sourceRef + signalKey).

import { signalDefs } from '../reputation.registry'

export type SignalDimension =
  | 'IDENTITY'
  | 'HISTORY'
  | 'COMMERCE'
  | 'FINANCIAL'
  | 'COMMUNITY'
  | 'SOCIAL'

export type SignalTier = 'GOLD' | 'SILVER' | 'BRONZE'

export type SignalSource =
  | 'ESCROW_TRANSACTION'
  | 'MANUAL_ESCROW'
  | 'POD_DELIVERY'
  | 'KYC_PROVIDER'
  | 'CAC_REGISTRY'
  | 'OPEN_BANKING'
  | 'ASSOCIATION_ATTESTATION'
  | 'FIELD_VERIFICATION'
  | 'SOCIAL_IMPORT'
  | 'PLATFORM_OBSERVED'
  | 'SELF_REPORTED'

export interface ReputationSignalInput {
  sellerId: string
  signalKey: string
  dimension: SignalDimension
  tier: SignalTier
  value: Record<string, unknown>
  confidence?: number
  sourceType: SignalSource
  /** Idempotency key with signalKey — one signal per source event. */
  sourceRef: string
  method: string
  verifierId?: string
  /** ISO timestamp of when the observation happened (not when recorded). */
  observedAt: string
}

/** Dimension + tier come from the registry, so they can't drift per call site. */
function base(key: keyof typeof signalDefs): {
  signalKey: string
  dimension: SignalDimension
  tier: SignalTier
} {
  const def = signalDefs[key]
  return { signalKey: key, dimension: def.dimension, tier: def.tier }
}

/**
 * A clean, fee-paid sale settled on the escrow rail — the spine Gold signal.
 * Carries enough to reconstruct the facts without re-reading Orders:
 * `delivered` (carrier-scan confirmed) and `place` (destination) for the
 * "verified delivery" / "last sale to …" lines.
 */
export function orderCompletedSignal(p: {
  sellerId: string
  orderId: number
  delivered?: boolean
  place?: string | null
  observedAt: string
}): ReputationSignalInput {
  return {
    ...base('commerce.order_completed'),
    sellerId: p.sellerId,
    value: {
      orderId: p.orderId,
      delivered: !!p.delivered,
      place: p.place ?? null,
    },
    sourceType: 'ESCROW_TRANSACTION',
    sourceRef: `Orders:${p.orderId}`,
    method: 'ORDER_DELIVERED_PAID',
    observedAt: p.observedAt,
  }
}

/** A verified review (gated on a completed order upstream). */
export function reviewSignal(p: {
  sellerId: string
  reviewId: string
  rating: number
  orderId?: number | null
  observedAt: string
}): ReputationSignalInput {
  return {
    ...base('commerce.review'),
    sellerId: p.sellerId,
    value: { rating: p.rating, orderId: p.orderId ?? null },
    sourceType: 'PLATFORM_OBSERVED',
    sourceRef: `SellerReview:${p.reviewId}`,
    method: 'VERIFIED_REVIEW',
    observedAt: p.observedAt,
  }
}

/** A resolved dispute. The engine weights the outcome (REFUND_BUYER hits hard). */
export function disputeSignal(p: {
  sellerId: string
  ticketId: string
  outcome: string
  observedAt: string
}): ReputationSignalInput {
  return {
    ...base('commerce.dispute_resolved'),
    sellerId: p.sellerId,
    value: { outcome: p.outcome },
    sourceType: 'ESCROW_TRANSACTION',
    sourceRef: `SupportTicket:${p.ticketId}`,
    method: 'DISPUTE_RESOLUTION',
    observedAt: p.observedAt,
  }
}
