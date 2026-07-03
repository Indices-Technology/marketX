/**
 * Payment provider abstraction — carrier-agnostic like the shipping layer.
 *
 * A provider (Paystack today; M-Pesa / MoMo / Flutterwave next) implements this
 * interface. The orchestrator (payment.service) routes by country/currency and
 * enforces the ONE money-gate every flow must pass: confirmPayment, which
 * asserts the amount actually collected equals what the order says it owes.
 *
 * All amounts are MINOR units (kobo for NGN, cents, pesewas, …).
 */

export type PaymentStatus = 'success' | 'failed' | 'pending'

export interface PaymentInitInput {
  amountMinor: number
  currency: string
  reference: string
  email: string
  metadata?: Record<string, unknown>
  callbackUrl?: string
}

export interface PaymentInitResult {
  reference: string
  redirectUrl?: string
  accessCode?: string
  providerId: string
}

export interface PaymentVerifyResult {
  status: PaymentStatus
  /** Amount the provider actually collected (minor units). The airtight value. */
  amountMinor: number
  currency: string
  reference: string
  providerId: string
  raw?: unknown
}

export interface PaymentWebhookResult {
  reference: string
  status: PaymentStatus
  amountMinor: number
  currency: string
  eventType: string
  providerId: string
}

export interface PaymentProviderCapabilities {
  /** ISO currency codes this provider settles. */
  currencies: string[]
  /** ISO country codes this provider serves. */
  countries: string[]
  webhook: boolean
}

export interface PaymentRouteContext {
  currency: string
  country?: string
}

export interface IPaymentProvider {
  id: string
  name: string
  /** When false the provider is registered (for typing/scaffolding) but never selected. */
  enabled: boolean
  capabilities: PaymentProviderCapabilities
  canHandle(ctx: PaymentRouteContext): boolean
  initialize(input: PaymentInitInput): Promise<PaymentInitResult>
  verify(reference: string): Promise<PaymentVerifyResult>
  /**
   * Verify the signature and parse a provider webhook. Returns null for events we
   * ignore; MUST throw on an invalid signature so the endpoint can reject it.
   */
  parseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<PaymentWebhookResult | null>
}
