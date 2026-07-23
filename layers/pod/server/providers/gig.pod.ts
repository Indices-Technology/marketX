/**
 * GIG courier-COD POD provider. Delegates the actual COD booking to the shipping
 * layer's GIG provider (settlementMode CARRIER_COD), so we don't duplicate the
 * carrier integration. Outcome + remittance parsing are stubbed until we capture
 * a real GIG COD webhook/remittance payload (same approach we used for pricing).
 */

import { gigProvider } from '~~/layers/shipping/server/providers/gig'
import type {
  Address,
  BookRequest,
  ShipmentRequest,
} from '~~/layers/shipping/server/utils/types'
import type {
  IPodProvider,
  PodBookingRequest,
  PodBookingResult,
  PodOutcomeReport,
  PodRemittance,
  PodRouteContext,
} from '../utils/types'

const toAddress = (a: PodBookingRequest['origin']): Address => ({
  name: a.name ?? 'MarketX',
  street1: a.street1 ?? '',
  city: a.city ?? '',
  state: a.state,
  country: a.country ?? 'NG',
  phone: a.phone,
})

export const gigPodProvider: IPodProvider = {
  id: 'gig',
  name: 'GIG Logistics (COD)',
  /**
   * COD is NOT missing from GIG's API — GIGL confirmed it is registered via
   * `IsCashOnDelivery`/`CashOnDeliveryAmount` on the create endpoints. It is gated
   * on GIG's **Class plan** (₦4,500/month); a Basic account cannot facilitate COD.
   *
   * Off by default. Set `GIG_COD_ENABLED=true` once the Class plan is active on
   * the live account — no code change needed. Read per-call (registry filters on
   * `.enabled`), so it can be flipped without a redeploy of this module.
   */
  get enabled(): boolean {
    return process.env.GIG_COD_ENABLED === 'true'
  },
  capabilities: { collectsCash: true, remits: true, trustedAttestation: true },

  canHandle(ctx: PodRouteContext): boolean {
    return ctx.sellerOptIn && (ctx.country ?? 'NG').toUpperCase() === 'NG'
  },

  async book(req: PodBookingRequest): Promise<PodBookingResult> {
    const request: ShipmentRequest = {
      origin: toAddress(req.origin),
      destination: toAddress(req.destination),
      items: [{ qty: 1, unitWeightKg: req.parcel?.weightKg }],
      // The COD amount the courier must collect = the product cash.
      declaredValueMinor: req.codAmountMinor,
      currency: 'NGN',
      options: { codRequested: true },
    }
    const booking: BookRequest = {
      request,
      carrierId: 'gig',
      serviceLevel: 'standard',
      orderRef: String(req.orderId),
      settlementMode: 'CARRIER_COD',
    }
    const res = await gigProvider.book(booking)
    return {
      trackingRef: res.trackingNumber,
      codRegisteredMinor: req.codAmountMinor,
    }
  },

  parseOutcome(): PodOutcomeReport | null {
    // TODO: map GIG scan-status/delivery webhook → outcome + attestation proof.
    // Needs a real GIG COD outcome payload captured before we trust it.
    return null
  },

  parseRemittance(): PodRemittance | null {
    // TODO: map GIG's COD remittance feed. GIGL: collections are reconciled daily
    // and paid at least twice weekly (see gigPolicy.codRemittanceDays). Needs a
    // real remittance payload captured on a Class-plan account before we trust it.
    return null
  },
}
