/**
 * Apply a carrier tracking status to one order — the single place that turns a
 * scan (real, from the poller; or simulated, from the admin test endpoint) into
 * order-status transitions, buyer/seller notifications and fund release.
 *
 * Keeping this shared means the test simulator exercises the EXACT path a real
 * GIG scan takes — they can never drift.
 */
import { prisma } from '~~/server/utils/db'
import { walletService } from '~~/layers/commerce/server/services/wallet.service'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'
import type { TrackingStatus } from '~~/layers/shipping/server/utils/types'
import { planCarrierTransition } from '~~/layers/shipping/server/utils/trackingTransition'

/** Is there an unresolved dispute on this order? Blocks auto fund-release. */
async function hasOpenDispute(orderId: number): Promise<boolean> {
  const n = await prisma.supportTicket.count({
    where: {
      orderId,
      type: 'DISPUTE',
      status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING_USER'] },
    },
  })
  return n > 0
}

function notifyBuyerShipped(
  orderId: number,
  buyerUserId: string,
  waybill: string | null,
  shipper: string | null,
) {
  notificationQueue.enqueue(
    {
      userId: buyerUserId,
      type: 'ORDER',
      orderId,
      message: `Your order #${orderId} has shipped${waybill ? ` · Tracking: ${waybill}` : ''}. Track it from your orders page.`,
    },
    { dedupeKey: `ship:${orderId}:SHIPPED` },
  )
  // Rich shipped email (line items + totals + ship-to + track button).
  prisma.orders
    .findUnique({
      where: { id: orderId },
      select: {
        totalAmount: true,
        shippingCost: true,
        name: true,
        address: true,
        county: true,
        shipState: true,
        country: true,
        shipPhone: true,
        user: { select: { email: true } },
        orderItem: {
          select: {
            quantity: true,
            price: true,
            variant: {
              select: {
                product: {
                  select: {
                    title: true,
                    media: {
                      take: 1,
                      where: { isBgMusic: false },
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    .then((order) => {
      const email = order?.user?.email
      if (!order || !email) return
      const { subject, html, text } = buildOrderStatusEmail(orderId, 'SHIPPED', {
        trackingNumber: waybill ?? undefined,
        shipper: shipper ?? undefined,
        orderUrl: `${useRuntimeConfig().public.baseURL}/buyer/orders/${orderId}`,
        items: order.orderItem.map((oi) => ({
          title: oi.variant?.product?.title ?? 'Item',
          quantity: oi.quantity,
          priceKobo: oi.price,
          image: oi.variant?.product?.media?.[0]?.url,
        })),
        itemsTotalKobo: order.totalAmount,
        shippingKobo: order.shippingCost,
        shipTo: {
          name: order.name,
          address: [order.address, order.county, order.shipState, order.country]
            .filter(Boolean)
            .join(', '),
          phone: order.shipPhone ?? undefined,
        },
      })
      emailQueue.enqueue(
        { to: email, subject, html, text, type: 'GENERAL' },
        { dedupeKey: `ship-email:${orderId}:SHIPPED` },
      )
    })
    .catch((e) => logger.logError('[carrierProgress] shipped email', e, { orderId }))
}

export interface ApplyResult {
  orderId: number
  from: TrackingStatus
  to: TrackingStatus
  changed: boolean
  toShipped: boolean
  toDelivered: boolean
  failed: boolean
  fundsReleased: boolean
}

/**
 * Transition one order for a newly observed carrier `nextStatus`. Idempotent and
 * monotonic (planCarrierTransition ignores out-of-order/duplicate scans), so
 * calling it repeatedly with the same or an earlier status is a safe no-op.
 */
export async function applyCarrierStatus(
  orderId: number,
  nextStatus: TrackingStatus,
): Promise<ApplyResult> {
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      waybill: true,
      shipper: true,
      status: true,
      paymentStatus: true,
      carrierStatus: true,
      orderItem: {
        select: {
          variant: {
            select: { product: { select: { seller: { select: { profileId: true } } } } },
          },
        },
      },
    },
  })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  const from = (order.carrierStatus as TrackingStatus | null) ?? 'UNKNOWN'
  const plan = planCarrierTransition(from, nextStatus, order.status)
  const base: ApplyResult = {
    orderId,
    from,
    to: nextStatus,
    changed: plan.changed,
    toShipped: plan.toShipped,
    toDelivered: plan.toDelivered,
    failed: plan.failed,
    fundsReleased: false,
  }
  if (!plan.changed) return base

  await prisma.orders.update({
    where: { id: orderId },
    data: { carrierStatus: nextStatus, carrierStatusAt: new Date() },
  })

  // CONFIRMED → SHIPPED once the carrier physically has the parcel.
  if (plan.toShipped) {
    await prisma.orders.update({
      where: { id: orderId },
      data: { status: 'SHIPPED', shippedAt: new Date() },
    })
    notifyBuyerShipped(orderId, order.userId, order.waybill, order.shipper)
  }

  if (plan.toDelivered) {
    await prisma.orders.update({
      where: { id: orderId },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    })
    const disputed = await hasOpenDispute(orderId)
    if (!disputed && order.paymentStatus === 'PAID') {
      await walletService
        .releaseFundsOnDelivery(orderId)
        .then(() => {
          base.fundsReleased = true
        })
        .catch((e) => logger.logError('[carrierProgress] release on delivery', e, { orderId }))
    }
    notificationQueue.enqueue(
      {
        userId: order.userId,
        type: 'ORDER',
        orderId,
        message: disputed
          ? `Order #${orderId} was delivered. Payment is on hold while your dispute is reviewed.`
          : `Order #${orderId} has been delivered. Thank you for shopping on MarketX!`,
      },
      { dedupeKey: `ship:${orderId}:DELIVERED` },
    )
  }

  // Returned / failed delivery — money must NOT release; alert the seller(s).
  if (plan.failed) {
    const sellerIds = new Set<string>()
    for (const it of order.orderItem) {
      const sid = it.variant?.product?.seller?.profileId
      if (sid) sellerIds.add(sid)
    }
    for (const sid of sellerIds) {
      notificationQueue.enqueue(
        {
          userId: sid,
          type: 'ORDER',
          orderId,
          message: `Delivery of order #${orderId} ${nextStatus === 'RETURNED' ? 'was returned' : 'failed'} (${order.waybill}). Please follow up with the carrier.`,
        },
        { dedupeKey: `ship:${orderId}:${nextStatus}` },
      )
    }
  }

  return base
}
