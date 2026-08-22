/**
 * Disbursement provider registry — money OUT.
 *
 * Mirrors the collection registry's shape, with one deliberate difference:
 * there is NO fallback provider. `resolvePaymentProvider` falls back to Paystack
 * when nothing matches, which is right for collection — the worst case is a
 * checkout that routes oddly. Doing the same here would mean money leaving
 * through a rail nobody chose. When no provider matches, the answer is null and
 * the caller must stop.
 *
 * Every provider is currently gated, so `enabledDisbursementProviders()` returns
 * an empty array and `resolveDisbursementProvider()` returns null for every
 * input. Settlement is manual by decision.
 */

import type { IDisbursementProvider } from '../utils/disbursement.types'
import { moniepointProvider } from './moniepoint'

const ALL: IDisbursementProvider[] = [moniepointProvider]

/** Only providers that are switched on. Empty while settlement is manual. */
export function enabledDisbursementProviders(): IDisbursementProvider[] {
  return ALL.filter((p) => p.enabled)
}

export function getDisbursementProviderById(
  id: string,
): IDisbursementProvider | undefined {
  return ALL.find((p) => p.id === id)
}

/**
 * Pick the rail for a payout's currency/country.
 *
 * Returns null when nothing can handle it — including the current state, where
 * nothing is enabled at all. Callers MUST treat null as "cannot pay out
 * automatically", never as "use the default".
 */
export function resolveDisbursementProvider(ctx: {
  currency: string
  country?: string
}): IDisbursementProvider | null {
  return enabledDisbursementProviders().find((p) => p.canHandle(ctx)) ?? null
}

/**
 * Whether ANY automated disbursement is currently possible.
 *
 * Exists so the settlement engine and admin UI can state plainly that payouts
 * are manual, rather than inferring it from an empty provider list.
 */
export function isAutomatedSettlementAvailable(): boolean {
  return enabledDisbursementProviders().length > 0
}
