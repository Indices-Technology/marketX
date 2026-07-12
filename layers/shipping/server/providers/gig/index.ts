/**
 * GIG Logistics provider — domestic Nigeria.
 *
 * Quoting: when GIG credentials are configured, calls the live `/price` API
 * (resolving sender/receiver stations from state). If GIG is unconfigured or the
 * call fails, falls back to the static Annexure-2 rate card. Booking uses
 * `/capture/preshipment` (returns a Waybill); tracking uses `/track/mobileShipment`.
 * See docs/SHIPPING.md §4, §7, §13.
 */

import type {
  IShippingProvider,
  ShipmentRequest,
  Quote,
  BookRequest,
  ShipmentResult,
  TrackingResult,
  TrackingEvent,
  TrackingStatus,
  TrackingUpdate,
} from '../../utils/types'
import { resolveZone, ZONE_ETA } from '../../services/zone.service'
import { gigRateNGN } from './rates'
import { gigPolicy } from './policy'
import {
  isGigConfigured,
  gigCustomerCode,
  gigCustomerType,
  fetchPrice,
  capturePreshipment,
  trackShipment as gigTrack,
} from './client'
import { resolveStation, locationFor } from './stations'

const NGN = (naira: number) => Math.round(naira * 100) // → kobo (minor units)

function totalWeightKg(req: ShipmentRequest): number {
  if (req.parcel?.weightKg) return req.parcel.weightKg
  const sum = req.items.reduce(
    (acc, it) => acc + (it.unitWeightKg ?? 0.5) * Math.max(1, it.qty),
    0,
  )
  return sum > 0 ? sum : 0.5
}

/**
 * GIG scan-status codes → our normalized status, from GIG's published code list.
 *
 * DELIVERED gates the seller payout (walletService.releaseFundsOnDelivery), so
 * only codes that mean the parcel reached the buyer appear there. Delay and
 * failed-attempt scans (DLP/DLD/DUBC/ATD) keep the shipment IN_TRANSIT — the
 * parcel is still live and a later scan will resolve it. Note DLP is "delayed
 * PICKUP", not "delivered": mapping it to DELIVERED would pay the seller for a
 * parcel still sitting at a terminal.
 */
const GIG_STATUS: Record<string, TrackingStatus> = {
  // Created / awaiting collection — not yet moving through the network.
  CRT: 'PRE_TRANSIT',
  MCRT: 'PRE_TRANSIT',
  CRH: 'PRE_TRANSIT',
  CRTUK: 'PRE_TRANSIT',
  CRTGH: 'PRE_TRANSIT',
  CRTGF: 'PRE_TRANSIT',
  MAPT: 'PRE_TRANSIT',
  MENP: 'PRE_TRANSIT',

  // With the delivery courier / en route to the buyer.
  OFDU: 'OUT_FOR_DELIVERY',
  WC: 'OUT_FOR_DELIVERY',
  MSHC: 'OUT_FOR_DELIVERY',

  // Reached the buyer (incl. terminal collection).
  SHD: 'DELIVERED',
  MAHD: 'DELIVERED',
  OKC: 'DELIVERED',
  OKT: 'DELIVERED',

  // Coming back to us.
  MRTE: 'RETURNED',
  SRHUB: 'RETURNED',
  SSR: 'RETURNED',
  SRC: 'RETURNED',
  RSR: 'RETURNED',
  VFSSRR: 'RETURNED',

  // Terminal failures only — an order that can no longer be fulfilled.
  DFA: 'FAILURE',
  FID: 'FAILURE',
  MSCC: 'FAILURE',
  MSCP: 'FAILURE',
  SSC: 'FAILURE',
  SDR: 'FAILURE',
  DASH: 'FAILURE',
  CLS: 'FAILURE',
  SMIM: 'FAILURE',
}

/** Any other scan means the parcel moved — treat it as in transit. */
function mapStatus(code: string): TrackingStatus {
  const c = (code || '').trim().toUpperCase()
  if (!c) return 'UNKNOWN'
  return GIG_STATUS[c] ?? 'IN_TRANSIT'
}

async function liveQuote(req: ShipmentRequest): Promise<Quote[] | null> {
  const [sender, receiver] = await Promise.all([
    resolveStation(req.origin.state),
    resolveStation(req.destination.state),
  ])
  if (!sender || !receiver) return null // can't price without stations → fall back

  const weight = totalWeightKg(req)
  const valueMajor = (req.declaredValueMinor || 0) / 100
  const result = await fetchPrice({
    SenderStationId: sender.StationId,
    ReceiverStationId: receiver.StationId,
    SenderLocation: locationFor(req.origin),
    ReceiverLocation: locationFor(req.destination),
    CustomerCode: gigCustomerCode(),
    CustomerType: gigCustomerType(),
    PickUpOptions: 0, // 0 = HomeDelivery
    // Weight-priced regular item. ShipmentType 0 = "special package" — a
    // predefined GIG package whose FIXED weight overrides ours (id 1 = 12.5kg),
    // which made every quote come back as 12.5kg. ShipmentType 1 prices by the
    // actual Weight and requires ItemName + IsVolumetric.
    ShipmentItems: [
      {
        Quantity: 1,
        ShipmentType: 1,
        ItemName: 'Merchandise',
        IsVolumetric: false,
        Weight: weight,
        Value: valueMajor,
      },
    ],
  })

  const grand = Number(result.GrandTotal ?? result.DeliverPrice ?? 0)
  if (!grand) return null

  const zone = resolveZone(req.origin.state, req.destination.state)
  const eta = ZONE_ETA[zone]
  // GIG returns a single price for our ecommerce account (Discount: 0) — this IS
  // our cost. The buyer-facing markup is applied centrally by the orchestrator
  // (SHIPPING_MARKUP_PCT), so we no longer fabricate a "Basic" retail here.
  // InsuranceValue (1% of declared value) is part of GrandTotal — surface it so
  // pricing passes it through at cost and checkout can show it separately.
  const costMinor = NGN(grand)
  const insuranceMinor = NGN(Number(result.InsuranceValue ?? 0))

  return [
    {
      carrierId: 'gig',
      carrierName: 'GIG Logistics',
      serviceLevel: 'standard',
      zoneCode: zone,
      costMinor,
      insuranceMinor,
      listMinor: costMinor,
      buyerPriceMinor: costMinor, // orchestrator applies markup + discount dial
      currency: req.currency ?? 'NGN',
      etaText: eta.text,
      etaMinHours: eta.minHours,
      etaMaxHours: eta.maxHours,
      codEligible: true,
    },
  ]
}

function fallbackQuote(req: ShipmentRequest): Quote[] {
  const weight = totalWeightKg(req)
  const zone = resolveZone(req.origin.state, req.destination.state)
  const eta = ZONE_ETA[zone]
  // Offline estimate when the live API is down: use the Class rate card as cost;
  // the orchestrator applies the same central markup as the live path.
  const costMinor = NGN(gigRateNGN('CLASS', zone, weight))
  return [
    {
      carrierId: 'gig',
      carrierName: 'GIG Logistics',
      serviceLevel: 'standard',
      zoneCode: zone,
      costMinor,
      listMinor: costMinor,
      buyerPriceMinor: costMinor,
      currency: req.currency ?? 'NGN',
      etaText: eta.text,
      etaMinHours: eta.minHours,
      etaMaxHours: eta.maxHours,
      codEligible: true,
    },
  ]
}

export const gigProvider: IShippingProvider = {
  id: 'gig',
  name: 'GIG Logistics',
  capabilities: {
    cod: true,
    tracking: true,
    labelGeneration: true,
    insurance: true,
    international: false,
  },
  policy: gigPolicy,

  canHandle(req: ShipmentRequest): boolean {
    const domestic =
      req.origin.country?.toUpperCase() === 'NG' &&
      req.destination.country?.toUpperCase() === 'NG'
    return domestic && totalWeightKg(req) <= gigPolicy.maxWeightKg
  },

  async quote(req: ShipmentRequest): Promise<Quote[]> {
    if (isGigConfigured()) {
      try {
        const live = await liveQuote(req)
        if (live) return live
      } catch (err) {
        logger.warn(`[gig] live price failed, using rate card: ${String(err)}`)
      }
    }
    return fallbackQuote(req)
  },

  /**
   * Book a collection shipment. `/capture/preshipment` takes a NESTED body —
   * Sender/Receiver/Shipment details grouped, `ShipmentItems` at the top level.
   * A flat body is rejected with `"SenderName" is not allowed`. This exact shape
   * was accepted by the sandbox (returns a Waybill); do not flatten it.
   *
   * The Waybill exists the moment this returns, BEFORE GIG holds the parcel — the
   * only scan present is MCRT ("created by customer"). Callers must not treat a
   * successful booking as proof of handover; wait for a possession scan.
   */
  async book(req: BookRequest): Promise<ShipmentResult> {
    if (!isGigConfigured()) {
      throw createError({
        statusCode: 501,
        statusMessage: 'GIG not configured',
      })
    }
    const { origin, destination } = req.request
    const weight = totalWeightKg(req.request)
    const cod = req.settlementMode === 'CARRIER_COD'

    // /price resolves stations from state; booking must use the same pair, or the
    // booked shipment can be routed (and priced) differently from what we quoted.
    const [sender, receiver] = await Promise.all([
      resolveStation(origin.state),
      resolveStation(destination.state),
    ])
    if (!sender || !receiver) {
      throw createError({
        statusCode: 422,
        statusMessage: `GIG has no station for ${!sender ? origin.state : destination.state}`,
      })
    }

    const res = await capturePreshipment({
      SenderDetails: {
        SenderName: origin.name,
        SenderPhoneNumber: origin.phone || '',
        SenderStationId: sender.StationId,
        SenderAddress: origin.street1,
        InputtedSenderAddress: origin.street1,
        SenderLocality: origin.city,
        SenderLocation: locationFor(origin),
      },
      ReceiverDetails: {
        ReceiverName: destination.name,
        ReceiverPhoneNumber: destination.phone || '',
        ReceiverStationId: receiver.StationId,
        ReceiverAddress: destination.street1,
        InputtedReceiverAddress: destination.street1,
        ReceiverLocation: locationFor(destination),
      },
      ShipmentDetails: {
        VehicleType: 0,
        IsCashOnDelivery: cod,
        CashOnDeliveryAmount: cod
          ? (req.request.declaredValueMinor || 0) / 100
          : 0,
      },
      // Must mirror the quote's item shape (regular, weight-priced) so the booked
      // shipment matches the quoted price — see quote()'s note on ShipmentType.
      ShipmentItems: [
        {
          Quantity: 1,
          ShipmentType: 1,
          ItemName: 'Merchandise',
          IsVolumetric: false,
          Weight: weight,
          Value: (req.request.declaredValueMinor || 0) / 100,
        },
      ],
    })
    if (!res.Waybill) throw new Error('GIG capture returned no Waybill')
    return {
      carrierId: 'gig',
      trackingNumber: res.Waybill,
      costMinor: 0, // priced at quote time; capture does not re-return the amount
      buyerPriceMinor: 0,
      currency: req.request.currency ?? 'NGN',
      etaText: ZONE_ETA[resolveZone(origin.state, destination.state)].text,
    }
  },

  async track(trackingNumber: string): Promise<TrackingResult> {
    const data = await gigTrack(trackingNumber)
    const shipment = Array.isArray(data) ? data[0] : null
    const raw: any[] = shipment?.MobileShipmentTrackings ?? []
    const mapped: TrackingEvent[] = raw.map((e) => ({
      timestamp: e.DateTimeUtc || e.DateTime || new Date().toISOString(),
      status: mapStatus(e.Status),
      description: e.ScanStatusComment || e.ScanStatusReason || e.Status || '',
      location: e.Location || undefined,
    }))
    // GIG repeats scans (e.g. MCRT twice at creation) — collapse consecutive
    // duplicates so the buyer timeline shows each step once.
    const events: TrackingEvent[] = mapped.filter(
      (e, i) =>
        i === 0 ||
        e.status !== mapped[i - 1].status ||
        e.description !== mapped[i - 1].description,
    )
    const current = events.length ? events[events.length - 1].status : 'UNKNOWN'
    return {
      carrierId: 'gig',
      trackingNumber,
      currentStatus: current,
      events,
    }
  },

  parseWebhook(_payload: unknown): TrackingUpdate | null {
    return null // GIG tracking is pull-based (no webhook in the current API)
  },
}
