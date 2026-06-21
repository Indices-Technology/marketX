/**
 * Provider registry — the single place carriers are registered.
 *
 * Add a carrier: implement IShippingProvider under providers/<name>/ and add it
 * to PROVIDERS below. The orchestrator discovers everything from here.
 * See docs/SHIPPING.md §4.
 */

import type { IShippingProvider, ShipmentRequest } from '../utils/types'
import { gigProvider } from './gig'
import { selfProvider } from './self'

// Sendbox + Shippo will be lifted into this layer and registered here next.
const PROVIDERS: IShippingProvider[] = [selfProvider, gigProvider]

export function getProviders(): IShippingProvider[] {
  return PROVIDERS
}

export function getProvider(id: string): IShippingProvider | undefined {
  return PROVIDERS.find((p) => p.id === id)
}

/**
 * Providers whose coverage/capabilities accept this shipment.
 * `only` restricts to specific carrier ids (e.g. checkout surfaces self-shipping
 * and live carriers but holds GIG back until its API access lands).
 */
export function eligibleProviders(
  req: ShipmentRequest,
  only?: string[],
): IShippingProvider[] {
  return PROVIDERS.filter((p) => {
    if (only && !only.includes(p.id)) return false
    try {
      return p.canHandle(req)
    } catch {
      return false
    }
  })
}
