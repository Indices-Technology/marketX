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
/** GIGL Class = 20% off the public (Basic) rate → Basic = Class / 0.8. */
const CLASS_OFF = 0.2

function totalWeightKg(req: ShipmentRequest): number {
  if (req.parcel?.weightKg) return req.parcel.weightKg
  const sum = req.items.reduce(
    (acc, it) => acc + (it.unitWeightKg ?? 0.5) * Math.max(1, it.qty),
    0,
  )
  return sum > 0 ? sum : 0.5
}

/** Map GIG scan-status codes → our normalized status. Best-effort; tune vs sandbox. */
function mapStatus(code: string): TrackingStatus {
  const c = (code || '').toUpperCase()
  if (['CRT', 'MCRT'].includes(c)) return 'PRE_TRANSIT'
  if (['OFD', 'MOFD'].includes(c)) return 'OUT_FOR_DELIVERY'
  if (['DLP', 'DLV', 'MDLV', 'DLVD'].includes(c)) return 'DELIVERED'
  if (['RTS', 'RTN', 'RTND'].includes(c)) return 'RETURNED'
  if (['FAILED', 'CNCL'].includes(c)) return 'FAILURE'
  return 'IN_TRANSIT'
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
    ShipmentItems: [
      {
        Quantity: 1,
        ShipmentType: 0,
        SpecialPackageId: 1,
        Weight: weight,
        Value: valueMajor,
      },
    ],
  })

  const grand = Number(result.GrandTotal ?? result.DeliverPrice ?? 0)
  if (!grand) return null

  const zone = resolveZone(req.origin.state, req.destination.state)
  const eta = ZONE_ETA[zone]
  const costMinor = NGN(grand)
  const listMinor = Math.round(costMinor / (1 - CLASS_OFF))

  return [
    {
      carrierId: 'gig',
      carrierName: 'GIG Logistics',
      serviceLevel: 'standard',
      zoneCode: zone,
      costMinor,
      listMinor,
      buyerPriceMinor: listMinor, // orchestrator applies the discount dial
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
  return [
    {
      carrierId: 'gig',
      carrierName: 'GIG Logistics',
      serviceLevel: 'standard',
      zoneCode: zone,
      costMinor: NGN(gigRateNGN('CLASS', zone, weight)),
      listMinor: NGN(gigRateNGN('BASIC', zone, weight)),
      buyerPriceMinor: NGN(gigRateNGN('BASIC', zone, weight)),
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
    const res = await capturePreshipment({
      SenderName: origin.name,
      SenderPhoneNumber: origin.phone || '',
      SenderAddress: origin.street1,
      InputtedSenderAddress: origin.street1,
      SenderLocality: origin.city,
      SenderLocation: locationFor(origin),
      ReceiverName: destination.name,
      ReceiverPhoneNumber: destination.phone || '',
      ReceiverAddress: destination.street1,
      InputtedReceiverAddress: destination.street1,
      ReceiverLocation: locationFor(destination),
      CustomerCode: gigCustomerCode(),
      VehicleType: 0,
      IsCashOnDelivery: cod,
      CashOnDeliveryAmount: cod
        ? (req.request.declaredValueMinor || 0) / 100
        : 0,
      ShipmentItems: [
        {
          Quantity: 1,
          ShipmentType: 0,
          SpecialPackageId: 1,
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
    const events: TrackingEvent[] = raw.map((e) => ({
      timestamp: e.DateTimeUtc || e.DateTime || new Date().toISOString(),
      status: mapStatus(e.Status),
      description: e.ScanStatusComment || e.ScanStatusReason || e.Status || '',
      location: e.Location || undefined,
    }))
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
