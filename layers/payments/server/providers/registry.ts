/**
 * Payment provider registry. Paystack is live; the rest are registered but gated
 * (enabled: false) so they never get selected until implemented.
 */

import type { IPaymentProvider, PaymentRouteContext } from '../utils/types'
import { paystackProvider } from './paystack'
import { mpesaProvider, momoProvider, flutterwaveProvider } from './stubs'

const ALL: IPaymentProvider[] = [
  paystackProvider,
  mpesaProvider,
  momoProvider,
  flutterwaveProvider,
]

/** Only providers that are switched on. */
export function enabledProviders(): IPaymentProvider[] {
  return ALL.filter((p) => p.enabled)
}

export function getPaymentProviderById(
  id: string,
): IPaymentProvider | undefined {
  return ALL.find((p) => p.id === id)
}

/**
 * Pick the provider for a checkout context. First enabled provider that can
 * handle the currency/country; falls back to Paystack (the default rail).
 */
export function resolvePaymentProvider(
  ctx: PaymentRouteContext,
): IPaymentProvider {
  return enabledProviders().find((p) => p.canHandle(ctx)) ?? paystackProvider
}
