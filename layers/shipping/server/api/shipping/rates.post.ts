/**
 * POST /api/shipping/rates
 * Shipping options for checkout — merges the seller's bring-your-own-shipping
 * (BYOS) options with live carrier rates.
 *
 * Accepts:
 *   { storeSlug, to, parcel, subtotalMinor? }  – resolves the seller's ship-from + BYOS config
 *   { from, to, parcel }                        – explicit origin (admin/fallback)
 *
 * Returns a single ranked list of IShipmentRate (self options first, then carriers).
 */

import { getShippingProvider } from '~~/layers/shipping/server/legacy/router'
import type {
  IGetRatesPayload,
  IAddress,
  IShipmentRate,
} from '~~/layers/shipping/server/legacy/types'
import { getQuotes } from '~~/layers/shipping/server/services/orchestrator.service'
import { isGigConfigured } from '~~/layers/shipping/server/providers/gig/client'
import type {
  ShipmentRequest,
  SellerShippingConfig,
} from '~~/layers/shipping/server/utils/types'

interface IRatesBody {
  storeSlug?: string
  from?: IAddress
  to: IAddress
  parcel: IGetRatesPayload['parcel']
  /** Order subtotal in minor units (kobo) — drives BYOS free-over thresholds. */
  subtotalMinor?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<IRatesBody>(event)

  if (!body?.to || !body?.parcel) {
    throw createError({ statusCode: 400, message: 'to and parcel are required' })
  }

  let from: IAddress | undefined = body.from
  let sellerShipping: SellerShippingConfig | undefined
  let sellerState = ''
  let sellerLat: number | undefined
  let sellerLng: number | undefined

  // Resolve seller ship-from address + BYOS config when storeSlug is provided
  if (body.storeSlug) {
    const seller = await prisma.sellerProfile.findUnique({
      where: { store_slug: body.storeSlug },
      select: {
        store_name: true,
        shipFromName: true,
        shipFromAddress: true,
        shipFromCity: true,
        shipFromState: true,
        shipFromZip: true,
        shipFromCountry: true,
        shipFromPhone: true,
        state: true,
        latitude: true,
        longitude: true,
        shippingConfig: true,
      },
    })

    sellerState = seller?.shipFromState || seller?.state || ''
    sellerLat = seller?.latitude ?? undefined
    sellerLng = seller?.longitude ?? undefined
    const cfg = seller?.shippingConfig as SellerShippingConfig | null
    if (cfg?.selfEnabled) sellerShipping = cfg

    if (seller?.shipFromAddress && seller?.shipFromCity) {
      from = {
        name: seller.shipFromName || seller.store_name || 'Seller',
        street1: seller.shipFromAddress,
        city: seller.shipFromCity,
        state: seller.shipFromState || seller.shipFromCity,
        zip: seller.shipFromZip || '100001',
        country: seller.shipFromCountry || 'NG',
        phone: seller.shipFromPhone || undefined,
      }
    }
  }

  const out: IShipmentRate[] = []
  const toCountry = (body.to.country || 'NG').toUpperCase()

  // ── 1. Orchestrated options: self-shipping (BYOS) + GIG (when configured) ──
  // 'self' is gated by the seller's config; 'gig' only when credentials are set
  // (otherwise GIG stays out of checkout until its API access is live).
  const hasOrigin = Boolean(from?.state || sellerState) // GIG needs a ship-from to quote
  const allowed: string[] = []
  if (sellerShipping) allowed.push('self')
  if (isGigConfigured() && toCountry === 'NG' && hasOrigin) allowed.push('gig')

  if (allowed.length) {
    try {
      const dest = body.to as IAddress & { lat?: number; lng?: number }
      const req: ShipmentRequest = {
        origin: {
          name: from?.name || 'Seller',
          street1: from?.street1 || '',
          city: from?.city || '',
          state: from?.state || sellerState,
          country: from?.country || 'NG',
          phone: from?.phone,
          lat: sellerLat,
          lng: sellerLng,
        },
        destination: {
          name: dest.name || 'Customer',
          street1: dest.street1 || '',
          city: dest.city || '',
          state: dest.state || dest.city || '',
          country: dest.country || 'NG',
          phone: dest.phone,
          lat: dest.lat,
          lng: dest.lng,
        },
        items: [{ qty: 1, unitWeightKg: body.parcel?.weightKg }],
        declaredValueMinor: body.subtotalMinor ?? 0,
        subtotalMinor: body.subtotalMinor ?? 0,
        currency: 'NGN',
        sellerShipping,
      }
      const quotes = await getQuotes(req, { only: allowed })
      for (const q of quotes) {
        out.push({
          rateId: q.rateRef
            ? `${q.carrierId}-${q.rateRef}`
            : `${q.carrierId}-${q.serviceLevel}`,
          carrier: q.carrierName,
          service:
            q.serviceLevel === 'economy'
              ? 'Pickup'
              : q.serviceLevel === 'express'
                ? 'Express'
                : 'Delivery',
          amountNGN: q.buyerPriceMinor / 100, // major NGN
          estimatedDays: q.etaText,
          provider: q.carrierId as IShipmentRate['provider'],
        })
      }
    } catch (err) {
      logger.warn(`[shipping/rates] orchestrated quote failed: ${String(err)}`)
    }
  }

  // ── 2. Live carrier rates (Sendbox / Shippo) ───────────────────────────────
  if (from) {
    const payload: IGetRatesPayload = { from, to: body.to, parcel: body.parcel }
    const provider = getShippingProvider(body.to.country)
    try {
      const rates = await provider.getRates(payload)
      out.push(...rates)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn(
        `[shipping/rates] ${provider.name} failed (${msg}), carrier rates skipped`,
      )
    }
  }

  // If nothing resolved, let the client fall back to the GlobalShippingZone flat rate.
  if (out.length === 0) {
    return { success: true, data: [], fallback: true }
  }

  return { success: true, data: out }
})
