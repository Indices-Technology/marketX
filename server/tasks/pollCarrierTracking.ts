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
import { getProvider } from '~~/layers/shipping/server/providers/registry'
import { TERMINAL_STATUSES } from '~~/layers/shipping/server/utils/trackingTransition'
import { applyCarrierStatus } from '~~/server/services/carrierProgress'

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
      select: { id: true, waybill: true, shippingProvider: true },
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
        // Real scan → same transition path the test simulator uses.
        const r = await applyCarrierStatus(order.id, tracking.currentStatus)
        if (r.toShipped) advanced++
        if (r.toDelivered) delivered++
      } catch (e) {
        logger.logError('[poll] tracking update failed', e, { orderId: order.id })
      }
    }

    return {
      result: `polled ${inFlight.length}; shipped ${advanced}; delivered ${delivered}`,
    }
  },
})
