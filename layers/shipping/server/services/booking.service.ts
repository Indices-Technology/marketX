/**
 * Carrier booking — turns a paid, confirmed order into a real carrier shipment.
 *
 * Called when the seller marks an order "ready to ship". Books with the carrier
 * the buyer chose at checkout (GIG today), stores the returned waybill on the
 * order, and sets carrierStatus to PRE_TRANSIT.
 *
 * It deliberately does NOT advance the order to SHIPPED. A freshly booked GIG
 * shipment carries only an MCRT ("created by customer") scan — the parcel is not
 * yet in the carrier's hands. The tracking poller flips the order to SHIPPED only
 * once a possession scan (MPIK/CRT/…) proves handover, so a seller cannot fake a
 * shipment by booking a waybill and never dropping the parcel off.
 *
 * Idempotency is two-layered:
 *  - durable: an order that already has a `waybill` is never re-booked (a second
 *    booking = a second real parcel + a second real carrier charge);
 *  - concurrent: `once()` coalesces double-submits within its TTL.
 */
import { getProvider } from '../providers/registry'
import { once } from '~~/server/utils/cache'
import type { ShipmentRequest, SettlementMode } from '../utils/types'

/**
 * Booking weight. Every checkout quote uses a flat 0.5kg parcel (products carry
 * no weight yet — a known gap that under-quotes heavy items globally). Booking
 * must use the SAME basis so the carrier charge matches what the buyer paid.
 * When product weights land, thread the real weight onto the order and use it here.
 */
const BOOKING_PARCEL_WEIGHT_KG = 0.5

export interface BookOrderResult {
  ok: boolean
  waybill: string
  carrierId: string
  /** true when the order was already booked (idempotent no-op). */
  alreadyBooked: boolean
}

/** Which carrier id a stored breakdown/zone refers to. null = not a carrier booking (self-ship). */
function carrierIdFor(order: {
  shippingProvider: string | null
  shippingBreakdown: unknown
  shippingZone: string | null
}): string | null {
  const bd = order.shippingBreakdown as { carrier?: string } | null
  const hay = `${order.shippingProvider ?? ''} ${bd?.carrier ?? ''} ${order.shippingZone ?? ''}`
  if (/gig/i.test(hay)) return 'gig'
  // 'self' / seller-delivered parcels are fulfilled by the seller, not booked.
  return null
}

export const bookingService = {
  /**
   * Book the carrier shipment for an order. Safe to call more than once.
   * `actorProfileId`, when given, must be the selling seller (authorization);
   * omit it for trusted server callers (cron/admin).
   */
  async bookOrder(
    orderId: number,
    actorProfileId?: string,
  ): Promise<BookOrderResult> {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        waybill: true,
        name: true,
        address: true,
        county: true,
        shipState: true,
        shipPhone: true,
        country: true,
        totalAmount: true,
        shippingProvider: true,
        shippingZone: true,
        shippingBreakdown: true,
        orderItem: {
          select: {
            quantity: true,
            variant: {
              select: {
                product: {
                  select: {
                    seller: {
                      select: {
                        profileId: true,
                        store_name: true,
                        shipFromName: true,
                        shipFromAddress: true,
                        shipFromCity: true,
                        shipFromState: true,
                        shipFromCountry: true,
                        shipFromPhone: true,
                        latitude: true,
                        longitude: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

    // Durable idempotency: already booked → return the existing waybill.
    if (order.waybill) {
      return {
        ok: true,
        waybill: order.waybill,
        carrierId: order.shippingProvider ?? 'gig',
        alreadyBooked: true,
      }
    }

    const seller = order.orderItem[0]?.variant?.product?.seller
    if (!seller) {
      throw createError({ statusCode: 422, statusMessage: 'Order has no seller to ship from' })
    }

    // Authorization: only the order's own seller may book it (server callers skip).
    if (actorProfileId && actorProfileId !== seller.profileId) {
      throw createError({ statusCode: 403, statusMessage: 'Not your order to ship' })
    }

    // Must be paid and confirmed. PAID = prepaid card; SHIPPING_PAID = POD shipping leg.
    const paid = order.paymentStatus === 'PAID' || order.paymentStatus === 'SHIPPING_PAID'
    if (!paid) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot ship an unpaid order (payment: ${order.paymentStatus})`,
      })
    }
    if (order.status !== 'CONFIRMED') {
      throw createError({
        statusCode: 409,
        statusMessage: `Order must be CONFIRMED to book shipping (is ${order.status})`,
      })
    }

    const carrierId = carrierIdFor(order)
    if (!carrierId) {
      throw createError({
        statusCode: 422,
        statusMessage: 'This order is seller-delivered — no carrier booking is needed',
      })
    }
    const provider = getProvider(carrierId)
    if (!provider?.book) {
      throw createError({ statusCode: 501, statusMessage: `Carrier ${carrierId} cannot book` })
    }

    // Destination must have a state — carrier station resolution depends on it.
    if (!order.shipState) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Order is missing a destination state — cannot resolve a carrier station',
      })
    }
    if (!seller.shipFromState) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Seller has no ship-from state set — cannot book a pickup',
      })
    }

    const request: ShipmentRequest = {
      origin: {
        name: seller.shipFromName || seller.store_name || 'Seller',
        street1: seller.shipFromAddress || '',
        city: seller.shipFromCity || '',
        state: seller.shipFromState,
        country: seller.shipFromCountry || 'NG',
        phone: seller.shipFromPhone || undefined,
        lat: seller.latitude ?? undefined,
        lng: seller.longitude ?? undefined,
      },
      destination: {
        name: order.name,
        street1: order.address,
        city: order.county || '',
        state: order.shipState,
        country: order.country || 'NG',
        phone: order.shipPhone || undefined,
      },
      items: order.orderItem.map((i) => ({ qty: i.quantity })),
      // Single flat parcel — matches the checkout quote basis (see constant).
      parcel: { weightKg: BOOKING_PARCEL_WEIGHT_KG },
      declaredValueMinor: order.totalAmount,
      currency: 'NGN',
    }

    // Prepaid orders settle via escrow; POD collects on delivery via its own flow.
    const settlementMode: SettlementMode =
      order.paymentMethod === 'pay_on_delivery' ? 'CARRIER_COD' : 'ESCROW_POD'

    // once() coalesces concurrent double-submits; the DB waybill re-check inside
    // guards against a booking that landed in a prior (expired-TTL) request.
    return once(`booking:order:${orderId}`, 300, async () => {
      const fresh = await prisma.orders.findUnique({
        where: { id: orderId },
        select: { waybill: true },
      })
      if (fresh?.waybill) {
        return { ok: true, waybill: fresh.waybill, carrierId, alreadyBooked: true }
      }

      const result = await provider.book!({
        request,
        carrierId,
        serviceLevel: 'standard',
        orderRef: String(orderId),
        settlementMode,
      })

      await prisma.orders.update({
        where: { id: orderId },
        data: {
          waybill: result.trackingNumber,
          trackingNumber: result.trackingNumber,
          shippingProvider: carrierId,
          shipper: provider.name,
          bookingMode: 'PICKUP',
          carrierStatus: 'PRE_TRANSIT',
          carrierStatusAt: new Date(),
          ...(result.labelUrl ? { labelUrl: result.labelUrl } : {}),
        },
      })

      logger.info?.('[booking] carrier shipment booked', {
        orderId,
        carrierId,
        waybill: result.trackingNumber,
      })

      return { ok: true, waybill: result.trackingNumber, carrierId, alreadyBooked: false }
    })
  },
}
