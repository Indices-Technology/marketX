/**
 * Paystack API helper
 * Wraps the Paystack REST API for transaction initialization and verification.
 * Extend this file to add other Paystack features (transfers, subscriptions, etc.)
 */

const PAYSTACK_BASE = 'https://api.paystack.co'

function getSecret(): string {
  const key = useRuntimeConfig().paystackSecretKey
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return key
}

function paystackHeaders() {
  return {
    Authorization: `Bearer ${getSecret()}`,
    'Content-Type': 'application/json',
    'User-Agent': 'MarketX/1.0 (server)',
  }
}

export interface PaystackInitResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number // in kobo
    currency: string
    customer: { email: string }
    metadata: Record<string, any>
  }
}

export const paystack = {
  /**
   * Initialize a transaction. Returns the hosted payment page URL.
   * amount is in CENTS (kobo for NGN, pesewas for GHS, etc.)
   */
  async initializeTransaction(params: {
    email: string
    amount: number // in kobo
    reference: string
    currency?: string
    metadata?: Record<string, any>
    callback_url?: string
  }): Promise<PaystackInitResponse> {
    if (!params.amount || params.amount < 100) {
      throw new Error(`Paystack: amount must be at least 100 kobo (got ${params.amount})`)
    }
    const body: Record<string, unknown> = {
      email:     params.email,
      amount:    params.amount,
      reference: params.reference,
      currency:  params.currency || 'NGN',
      metadata:  params.metadata || {},
    }
    if (params.callback_url) body.callback_url = params.callback_url

    try {
      const res = await $fetch<PaystackInitResponse>(
        `${PAYSTACK_BASE}/transaction/initialize`,
        { method: 'POST', headers: paystackHeaders(), body },
      )
      if (!res.status) throw new Error(res.message || 'Paystack initialization failed')
      return res
    } catch (err: any) {
      // Surface the actual Paystack error message from the response body
      const msg = err?.data?.message || err?.message || 'Paystack initialization failed'
      throw new Error(`Paystack: ${msg}`)
    }
  },

  /**
   * Verify a transaction by reference.
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const res = await $fetch<PaystackVerifyResponse>(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { method: 'GET', headers: paystackHeaders() },
    )
    if (!res.status)
      throw new Error(res.message || 'Paystack verification failed')
    return res
  },
}
