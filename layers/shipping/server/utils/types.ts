/**
 * Shipping layer — domain model & provider contract.
 *
 * These are pure value objects. They MUST NOT reference Order, Product, Seller,
 * or any commerce model — that boundary keeps the shipping layer independently
 * extractable (see docs/SHIPPING.md §1, §3).
 *
 * Money is always stored in integer **minor units** (kobo for NGN) to avoid
 * floating-point drift. `currency` is ISO-4217 (default 'NGN').
 */

// ─── Value objects ──────────────────────────────────────────────────────────

export interface Address {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  country: string // ISO 3166-1 alpha-2, e.g. 'NG', 'US'
  zip?: string
  phone?: string
  email?: string
  /** Optional precise coordinates — used by carriers that price on location
   *  (e.g. GIG). Never required; falls back to a state centroid. */
  lat?: number
  lng?: number
}

export interface Parcel {
  weightKg: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
}

export interface ShipmentItem {
  /** Opaque category id — used to look up a default weight. Never the Category model. */
  categoryId?: string
  qty: number
  /** Per-unit weight if known; otherwise resolved from the category default. */
  unitWeightKg?: number
  /** Per-unit declared value in minor units (for liability/claims). */
  unitValueMinor?: number
}

/** International customs info — reserved; populated only for cross-border. */
export interface CustomsInfo {
  contentsDescription: string
  hsCodes?: string[]
  dutiesPaidBy?: 'sender' | 'recipient'
}

export type SettlementMode = 'ESCROW_POD' | 'CARRIER_COD'

/**
 * Bring-your-own-shipping config — the seller's own delivery terms. Travels in
 * the request so the shipping layer stays decoupled from the seller model
 * (the caller resolves it). See docs/SHIPPING.md (self-shipping as a provider).
 */
export interface SellerShippingConfig {
  /** Seller handles delivery themselves (offer self-shipping options). */
  selfEnabled: boolean
  /**
   * Offer GIG Logistics as a carrier option at checkout. Defaults to ENABLED:
   * only an explicit `false` removes GIG, so existing sellers (no flag set) keep
   * getting GIG quotes. Read via gigOptedOut() so the default lives in one place.
   */
  gigEnabled?: boolean
  /** Flat delivery fee in minor units (default when no zone match). */
  flatRateMinor?: number
  /** Free delivery when the order subtotal ≥ this (minor units). */
  freeOverMinor?: number
  /** Offer in-person pickup (free). */
  pickupEnabled?: boolean
  pickupNote?: string
  /** Delivery ETA copy, e.g. "2–4 days (seller delivered)". */
  etaText?: string
  /** Optional per-zone flat rates keyed by zone code ('Z1'..'Z4'), minor units. */
  zoneRates?: Record<string, number>
}

export interface ShipmentRequest {
  origin: Address
  destination: Address
  items: ShipmentItem[]
  /** Derived from items when absent. */
  parcel?: Parcel
  /** Total declared value in minor units (liability/claims). */
  declaredValueMinor: number
  /** Order subtotal in minor units — used for free-shipping thresholds. */
  subtotalMinor?: number
  /** ISO-4217; default 'NGN'. */
  currency?: string
  options?: {
    codRequested?: boolean
    expressOnly?: boolean
    insured?: boolean
  }
  /** Seller's bring-your-own-shipping config (when the seller self-delivers). */
  sellerShipping?: SellerShippingConfig
  /** Reserved — international only. */
  customs?: CustomsInfo
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export type ServiceLevel = 'standard' | 'express' | 'economy'

export interface CarrierCapabilities {
  cod: boolean
  tracking: boolean
  labelGeneration: boolean
  insurance: boolean
  international: boolean
}

export interface Quote {
  carrierId: string
  carrierName: string
  serviceLevel: ServiceLevel
  /** Carrier-specific service identifier, used to book the exact rate. */
  rateRef?: string
  /** Domestic zone code (e.g. 'Z1'..'Z4') when applicable. */
  zoneCode?: string
  /** What we pay the carrier. */
  costMinor: number
  /** Declared-value insurance premium (minor) included in costMinor, if any.
   *  Passed through to the buyer at cost (not marked up) and shown separately. */
  insuranceMinor?: number
  /** Reference/retail price (GIG Basic; single-rate carriers: cost × markup). */
  listMinor: number
  /** What the buyer pays after the platform discount dial is applied. */
  buyerPriceMinor: number
  currency: string
  etaText: string
  etaMinHours?: number
  etaMaxHours?: number
  codEligible: boolean
  expiresAt?: string // ISO 8601
}

// ─── Booking ────────────────────────────────────────────────────────────────

export interface BookRequest {
  request: ShipmentRequest
  carrierId: string
  serviceLevel: ServiceLevel
  rateRef?: string
  /** Opaque caller reference (e.g. an order id) — never interpreted by shipping. */
  orderRef: string
  settlementMode: SettlementMode
}

export interface ShipmentResult {
  carrierId: string
  trackingNumber: string
  labelUrl?: string
  costMinor: number
  buyerPriceMinor: number
  currency: string
  etaText: string
}

// ─── Tracking ─────────────────────────────────────────────────────────────────

export type TrackingStatus =
  | 'UNKNOWN'
  | 'PRE_TRANSIT'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'FAILURE'

export interface TrackingEvent {
  timestamp: string // ISO 8601
  status: TrackingStatus
  description: string
  location?: string
}

export interface TrackingResult {
  carrierId: string
  trackingNumber: string
  currentStatus: TrackingStatus
  estimatedDelivery?: string
  events: TrackingEvent[]
}

export interface TrackingUpdate {
  trackingNumber: string
  status: TrackingStatus
  description?: string
  occurredAt?: string
}

// ─── Carrier policy ───────────────────────────────────────────────────────────

export interface CarrierPolicy {
  /** Hours within which loss/damage claims must be filed (GIG: 24). */
  claimsWindowHours: number
  /** 'declared' = liability capped at declared value (GIG §10.2). */
  liabilityCap: 'declared' | number
  /** Whether a return tariff applies on failed/refused/redirected delivery. */
  returnTariffApplies: boolean
  /** Settlement models this carrier supports. */
  settlementModels: SettlementMode[]
  prohibitedItems: string[]
  maxWeightKg: number
  /** Carrier remittance cadence for CARRIER_COD, in days (GIG: 7). */
  codRemittanceDays?: number
}

// ─── Provider contract (Strategy) ─────────────────────────────────────────────
// Add a carrier: implement this, register it in providers/registry.ts. See §4.

export interface IShippingProvider {
  readonly id: string // 'gig' | 'sendbox' | 'shippo' | …
  readonly name: string
  readonly capabilities: CarrierCapabilities
  readonly policy: CarrierPolicy

  /** Coverage/eligibility gate — orchestrator filters on this. */
  canHandle(req: ShipmentRequest): boolean

  /** Returns normalized quotes with `costMinor`; platform applies retail/discount. */
  quote(req: ShipmentRequest): Promise<Quote[]>

  /** Book a chosen quote → tracking + label. */
  book(req: BookRequest): Promise<ShipmentResult>

  /** Real-time tracking for an existing shipment. */
  track(trackingNumber: string): Promise<TrackingResult>

  /** Parse a carrier webhook payload into a normalized update (or null). */
  parseWebhook(payload: unknown): TrackingUpdate | null

  /** Optional cancellation. */
  cancel?(trackingNumber: string): Promise<void>
}
