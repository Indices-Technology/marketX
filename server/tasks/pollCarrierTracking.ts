/**
 * Scheduled task: poll carrier tracking and advance shipped orders.
 *
 * GIG has no delivery webhook — tracking is pull-only — so this is the ONLY thing
 * that moves a booked order forward. For every in-flight carrier shipment it reads
 * the latest scans and, on a state change:
 *   • possession scan (IN_TRANSIT+) while CONFIRMED → SHIPPED + notify buyer w/ tracking
 *   • DELIVERED scan → DELIVERED + release funds (unless a dispute is open) + notify
 *   • RETURNED / FAILURE → hold funds, alert the seller
 *
 * A freshly booked shipment sits at PRE_TRANSIT (MCRT, "created by customer") until
 * the seller actually hands the parcel over — so a seller who books a waybill but
 * never ships never triggers SHIPPED, and never gets paid. That is the guard.
 *
 * Register in nuxt.config.ts scheduledTasks, e.g. every 30 min:
 *   '*\/30 * * * *': ['pollCarrierTracking']
 */
import { prisma } from '../utils/db'
import { walletService } from '~~/layers/commerce/server/services/wallet.service'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'
import { getProvider } from '~~/layers/shipping/server/providers/registry'
import type { TrackingStatus } from '~~/layers/shipping/server/utils/types'
import {
  planCarrierTransition,
  TERMINAL_STATUSES,
} from '~~/layers/shipping/server/utils/trackingTransition'

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
  prisma.profile
    .findUnique({ where: { id: buyerUserId }, select: { email: true } })
    .then((b) => {
      if (!b?.email) return
      const { subject, html, text } = buildOrderStatusEmail(orderId, 'SHIPPED', {
        trackingNumber: waybill ?? undefined,
        shipper: shipper ?? undefined,
      })
      emailQueue.enqueue(
        { to: b.email, subject, html, text, type: 'GENERAL' },
        { dedupeKey: `ship-email:${orderId}:SHIPPED` },
      )
    })
    .catch((e) => logger.logError('[poll] shipped email', e, { orderId }))
}

export default defineTask({
  meta: {
    name: 'pollCarrierTracking',
    description: 'Poll carrier tracking; advance orders to SHIPPED/DELIVERED and release funds',
  },
  async run() {
    logger.info('[task:pollCarrierTracking] fired', { at: new Date().toISOString() })

    const inFlight = await prisma.orders.findMany({
      where: {
        waybill: { not: null },
        shippingProvider: { not: null },
        status: { in: ['CONFIRMED', 'SHIPPED'] },
        OR: [{ carrierStatus: null }, { carrierStatus: { notIn: TERMINAL_STATUSES } }],
      },
      select: {
        id: true,
        userId: true,
        waybill: true,
        shipper: true,
        status: true,
        paymentStatus: true,
        carrierStatus: true,
        shippingProvider: true,
        orderItem: {
          select: {
            variant: {
              select: {
                product: { select: { seller: { select: { profileId: true } } } },
              },
            },
          },
        },
      },
      take: 200,
    })

    if (!inFlight.length) return { result: 'no in-flight shipments' }

    let advanced = 0
    let delivered = 0
    for (const order of inFlight) {
      try {
        const provider = getProvider(order.shippingProvider!)
        if (!provider?.track || !order.waybill) continue

        const tracking = await provider.track(order.waybill)
        const next = tracking.currentStatus
        const prev = (order.carrierStatus as TrackingStatus | null) ?? 'UNKNOWN'
        const plan = planCarrierTransition(prev, next, order.status)
        if (!plan.changed) continue

        await prisma.orders.update({
          where: { id: order.id },
          data: { carrierStatus: next, carrierStatusAt: new Date() },
        })

        // CONFIRMED → SHIPPED once the carrier physically has the parcel.
        if (plan.toShipped) {
          await prisma.orders.update({
            where: { id: order.id },
            data: { status: 'SHIPPED', shippedAt: new Date() },
          })
          notifyBuyerShipped(order.id, order.userId, order.waybill, order.shipper)
          advanced++
        }

        if (plan.toDelivered) {
          await prisma.orders.update({
            where: { id: order.id },
            data: { status: 'DELIVERED', deliveredAt: new Date() },
          })
          const disputed = await hasOpenDispute(order.id)
          if (!disputed && order.paymentStatus === 'PAID') {
            await walletService
              .releaseFundsOnDelivery(order.id)
              .catch((e) => logger.logError('[poll] release on delivery', e, { orderId: order.id }))
          }
          notificationQueue.enqueue(
            {
              userId: order.userId,
              type: 'ORDER',
              orderId: order.id,
              message: disputed
                ? `Order #${order.id} was delivered. Payment is on hold while your dispute is reviewed.`
                : `Order #${order.id} has been delivered. Thank you for shopping on MarketX!`,
            },
            { dedupeKey: `ship:${order.id}:DELIVERED` },
          )
          delivered++
        }

        // Returned / failed delivery — money must NOT release; alert the seller.
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
                orderId: order.id,
                message: `Delivery of order #${order.id} ${next === 'RETURNED' ? 'was returned' : 'failed'} (${order.waybill}). Please follow up with the carrier.`,
              },
              { dedupeKey: `ship:${order.id}:${next}` },
            )
          }
        }
      } catch (e) {
        logger.logError('[poll] tracking update failed', e, { orderId: order.id })
      }
    }

    return {
      result: `polled ${inFlight.length}; shipped ${advanced}; delivered ${delivered}`,
    }
  },
})
