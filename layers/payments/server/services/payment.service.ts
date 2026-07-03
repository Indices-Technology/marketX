/**
 * Payment orchestrator — the carrier-agnostic brain (mirrors shipping's).
 *
 * Its whole reason to exist is `confirmPayment`: the single money-gate every
 * confirmation path (verify, pod-verify, webhook) MUST pass. It asserts the
 * amount the provider actually collected covers what the order owes, in the
 * right currency, before anything is marked paid. No caller should flip an
 * order to PAID without an `ok: true` from here.
 */

import type {
  IPaymentProvider,
  PaymentInitInput,
  PaymentInitResult,
  PaymentRouteContext,
  PaymentStatus,
  PaymentWebhookResult,
} from '../utils/types'
import {
  getPaymentProviderById,
  resolvePaymentProvider,
} from '../providers/registry'

export interface ConfirmPaymentInput {
  reference: string
  /** What the order owes, recomputed from the DB (minor units). */
  expectedMinor: number
  /** Expected settlement currency; when set, a mismatch fails the gate. */
  expectedCurrency?: string
  /** Force a specific provider (e.g. the one that initialized). */
  providerId?: string
}

export type ConfirmStatus =
  | PaymentStatus
  | 'amount_mismatch'
  | 'currency_mismatch'

export interface ConfirmPaymentResult {
  ok: boolean
  status: ConfirmStatus
  expectedMinor: number
  actualMinor: number
  actualCurrency: string
  reference: string
  providerId: string
  reason?: string
}

export const paymentService = {
  resolveProvider(ctx: PaymentRouteContext): IPaymentProvider {
    return resolvePaymentProvider(ctx)
  },

  async initialize(
    input: PaymentInitInput,
    ctx?: PaymentRouteContext,
  ): Promise<PaymentInitResult> {
    const provider = this.resolveProvider(ctx ?? { currency: input.currency })
    if (
      !provider.canHandle({ currency: input.currency, country: ctx?.country })
    )
      throw new Error(`No payment provider supports currency ${input.currency}`)
    return provider.initialize(input)
  },

  /** True when the collected amount covers what's owed (overpay tolerated). */
  amountCovers(expectedMinor: number, actualMinor: number): boolean {
    return Number.isFinite(actualMinor) && actualMinor >= expectedMinor
  },

  /**
   * THE money-gate. Verifies the transaction with the provider and asserts
   * success + amount-covers + currency. Does NOT touch the DB — the caller owns
   * the order-state flip and passes the expected amount recomputed from the DB.
   */
  async confirmPayment(
    input: ConfirmPaymentInput,
  ): Promise<ConfirmPaymentResult> {
    const provider = input.providerId
      ? getPaymentProviderById(input.providerId) ??
        this.resolveProvider({ currency: input.expectedCurrency ?? 'NGN' })
      : this.resolveProvider({ currency: input.expectedCurrency ?? 'NGN' })

    const v = await provider.verify(input.reference)
    const base = {
      expectedMinor: input.expectedMinor,
      actualMinor: v.amountMinor,
      actualCurrency: v.currency,
      reference: v.reference,
      providerId: v.providerId,
    }

    if (v.status !== 'success') {
      return { ok: false, status: v.status, ...base }
    }
    if (
      input.expectedCurrency &&
      v.currency.toUpperCase() !== input.expectedCurrency.toUpperCase()
    ) {
      return {
        ok: false,
        status: 'currency_mismatch',
        reason: `expected ${input.expectedCurrency}, collected ${v.currency}`,
        ...base,
      }
    }
    if (!this.amountCovers(input.expectedMinor, v.amountMinor)) {
      return {
        ok: false,
        status: 'amount_mismatch',
        reason: `expected ≥ ${input.expectedMinor} minor, collected ${v.amountMinor}`,
        ...base,
      }
    }
    return { ok: true, status: 'success', ...base }
  },

  /** Signature-verify + parse a provider webhook. Throws on bad signature. */
  async parseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
    providerId = 'paystack',
  ): Promise<PaymentWebhookResult | null> {
    const provider = getPaymentProviderById(providerId)
    if (!provider) throw new Error(`Unknown payment provider ${providerId}`)
    return provider.parseWebhook(rawBody, headers)
  },
}
