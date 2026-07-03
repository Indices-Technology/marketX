/**
 * Paystack payment provider — the first IPaymentProvider.
 * Wraps the existing low-level `paystack` REST helper; adds signature-verified
 * webhook parsing. All amounts are minor units (kobo).
 */

import crypto from 'crypto'
import { paystack } from '~~/server/utils/paystack'
import type {
  IPaymentProvider,
  PaymentInitInput,
  PaymentInitResult,
  PaymentProviderCapabilities,
  PaymentRouteContext,
  PaymentStatus,
  PaymentVerifyResult,
  PaymentWebhookResult,
} from '../utils/types'

const ID = 'paystack'

const capabilities: PaymentProviderCapabilities = {
  currencies: ['NGN', 'GHS', 'ZAR', 'KES', 'USD'],
  countries: ['NG', 'GH', 'ZA', 'KE'],
  webhook: true,
}

const mapStatus = (s: string): PaymentStatus =>
  s === 'success' ? 'success' : s === 'abandoned' ? 'pending' : 'failed'

function webhookSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return secret
}

export const paystackProvider: IPaymentProvider = {
  id: ID,
  name: 'Paystack',
  enabled: true,
  capabilities,

  canHandle(ctx: PaymentRouteContext): boolean {
    return capabilities.currencies.includes((ctx.currency || '').toUpperCase())
  },

  async initialize(input: PaymentInitInput): Promise<PaymentInitResult> {
    const res = await paystack.initializeTransaction({
      email: input.email,
      amount: input.amountMinor,
      reference: input.reference,
      currency: input.currency,
      metadata: input.metadata,
      callback_url: input.callbackUrl,
    })
    return {
      reference: res.data.reference,
      redirectUrl: res.data.authorization_url,
      accessCode: res.data.access_code,
      providerId: ID,
    }
  },

  async verify(reference: string): Promise<PaymentVerifyResult> {
    const res = await paystack.verifyTransaction(reference)
    return {
      status: mapStatus(res.data.status),
      amountMinor: res.data.amount,
      currency: res.data.currency,
      reference: res.data.reference,
      providerId: ID,
      raw: res.data,
    }
  },

  async parseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<PaymentWebhookResult | null> {
    const signature = headers['x-paystack-signature']
    if (!signature) throw new Error('Missing Paystack signature')
    const hash = crypto
      .createHmac('sha512', webhookSecret())
      .update(rawBody)
      .digest('hex')
    if (hash !== signature) throw new Error('Invalid Paystack signature')

    const payload = JSON.parse(rawBody)
    if (payload?.event !== 'charge.success') return null
    const data = payload.data ?? {}
    if (!data.reference) return null
    return {
      reference: data.reference,
      status: mapStatus(data.status ?? 'success'),
      amountMinor: Number(data.amount ?? 0),
      currency: data.currency ?? 'NGN',
      eventType: payload.event,
      providerId: ID,
    }
  },
}
