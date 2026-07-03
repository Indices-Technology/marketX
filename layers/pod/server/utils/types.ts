/**
 * Pay-on-Delivery provider abstraction. Mirrors IShippingProvider / IPaymentProvider.
 * See docs/POD.md for the model. All amounts are MINOR units (kobo).
 */

export type PodProviderId = 'gig' | 'byop'

export type PodState =
  | 'INITIATED'
  | 'DEPOSIT_PENDING'
  | 'DEPOSIT_PAID'
  | 'COD_BOOKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED_COLLECTED'
  | 'REMITTED'
  | 'RECONCILED'
  | 'SETTLED'
  | 'ATTEMPT_FAILED'
  | 'FREIGHT_REFUNDED'
  | 'RETURNED'
  | 'CANCELLED'

export const POD_TERMINAL: readonly PodState[] = ['SETTLED', 'RETURNED', 'CANCELLED']

/** Allowed transitions — the state machine. Anything not listed is rejected. */
export const POD_TRANSITIONS: Record<PodState, readonly PodState[]> = {
  INITIATED: ['DEPOSIT_PENDING', 'CANCELLED'],
  DEPOSIT_PENDING: ['DEPOSIT_PAID', 'CANCELLED'],
  DEPOSIT_PAID: ['COD_BOOKED', 'CANCELLED'],
  COD_BOOKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'ATTEMPT_FAILED', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED_COLLECTED', 'ATTEMPT_FAILED'],
  DELIVERED_COLLECTED: ['REMITTED'],
  REMITTED: ['RECONCILED'],
  RECONCILED: ['SETTLED'],
  SETTLED: [],
  ATTEMPT_FAILED: ['FREIGHT_REFUNDED', 'OUT_FOR_DELIVERY'], // retry a delivery, or refund freight
  FREIGHT_REFUNDED: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
}

export function canPodTransition(from: PodState, to: PodState): boolean {
  return POD_TRANSITIONS[from]?.includes(to) ?? false
}

// ── Provider I/O ──────────────────────────────────────────────────────────────

export interface PodBookingRequest {
  orderId: number
  origin: { name?: string; street1?: string; city?: string; state: string; country?: string; phone?: string }
  destination: { name?: string; street1?: string; city?: string; state: string; country?: string; phone?: string }
  /** Product cash the courier must collect on delivery. */
  codAmountMinor: number
  parcel?: { weightKg?: number }
}

export interface PodBookingResult {
  trackingRef: string
  codRegisteredMinor: number
}

export type PodDeliveryOutcome =
  | 'DELIVERED_COLLECTED'
  | 'ATTEMPT_FAILED'
  | 'RETURNED'

export interface PodOutcomeReport {
  orderRef: string
  outcome: PodDeliveryOutcome
  /** Provider-attested proof payload (courier scan codes, signatures, etc.). */
  proof?: Record<string, unknown>
  at: string
}

export interface PodRemittance {
  reference: string
  amountMinor: number
  at: string
}

export interface PodProviderCapabilities {
  collectsCash: boolean
  remits: boolean
  /** True when the provider's failed-attempt report is trusted (courier) vs
   *  self-reported (BYOP → needs buyer confirmation / dispute window). */
  trustedAttestation: boolean
}

export interface PodRouteContext {
  destinationState: string
  country?: string
  sellerOptIn: boolean
}

export interface IPodProvider {
  id: PodProviderId
  name: string
  /** When false the provider is registered (typing/scaffolding) but never selected. */
  enabled: boolean
  capabilities: PodProviderCapabilities
  canHandle(ctx: PodRouteContext): boolean
  /** Register the COD delivery with the provider (courier) or acknowledge (BYOP). */
  book(req: PodBookingRequest): Promise<PodBookingResult>
  /** Parse a provider delivery-outcome webhook/poll. Null for irrelevant events. */
  parseOutcome(payload: unknown): PodOutcomeReport | null
  /** Parse a provider cash-remittance event. Null when not a remittance. */
  parseRemittance(payload: unknown): PodRemittance | null
}
