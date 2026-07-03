/**
 * Scaffolded, GATED payment providers — registered so the abstraction is typed
 * and routing is exercised, but `enabled: false` so the orchestrator never
 * selects them. Fill in initialize/verify/parseWebhook when integrating, then
 * flip `enabled` to true.
 */

import type {
  IPaymentProvider,
  PaymentProviderCapabilities,
} from '../utils/types'

function gatedProvider(
  id: string,
  name: string,
  capabilities: PaymentProviderCapabilities,
): IPaymentProvider {
  const notReady = () => {
    throw new Error(`${name} payment provider is not yet enabled`)
  }
  return {
    id,
    name,
    enabled: false,
    capabilities,
    canHandle: () => false, // gated — never selected until enabled + implemented
    initialize: notReady,
    verify: notReady,
    parseWebhook: async () => null,
  }
}

/** Safaricom M-Pesa (Kenya). */
export const mpesaProvider = gatedProvider('mpesa', 'M-Pesa', {
  currencies: ['KES'],
  countries: ['KE'],
  webhook: true,
})

/** MTN / Airtel Mobile Money (Ghana, Uganda, …). */
export const momoProvider = gatedProvider('momo', 'Mobile Money', {
  currencies: ['GHS', 'UGX', 'XOF'],
  countries: ['GH', 'UG', 'CI'],
  webhook: true,
})

/** Flutterwave (multi-country card + bank + mobile money). */
export const flutterwaveProvider = gatedProvider('flutterwave', 'Flutterwave', {
  currencies: ['NGN', 'GHS', 'KES', 'ZAR', 'USD'],
  countries: ['NG', 'GH', 'KE', 'ZA'],
  webhook: true,
})
