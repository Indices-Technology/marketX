/**
 * Scheduled task: auto-release seller funds for orders that have been
 * in SHIPPED or READY_FOR_PICKUP status for 7+ days with no buyer confirmation.
 *
 * Runs every 6 hours via Nitro scheduled tasks.
 * Register in nuxt.config.ts:
 *   nitro.scheduledTasks: { '0 *\/6 * * *': ['releaseShippedOrders'] }
 */
import { notificationService } from '~~/layers/profile/server/services/notification.service'
import { prisma } from '../utils/db'
import { walletService } from '~~/layers/commerce/server/services/wallet.service'
import { emitOrderCompleted } from '~~/layers/reputation/server/utils/emitOrderSignal'

const AUTO_RELEASE_DAYS = 7

export default defineTask({
  meta: {
    name: 'releaseShippedOrders',
    description:
      'Auto-release seller funds for orders shipped 7+ days ago with no buyer confirmation',
  },
  async run() {
    logger.info('[task:releaseShippedOrders] fired', { at: new Date().toISOString() })
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - AUTO_RELEASE_DAYS)

    // Find all SHIPPED/READY_FOR_PICKUP, PAID orders where shippedAt is older
    // than 7 days (shippedAt doubles as "ready since" for pickup orders).
    const overdueOrders = await prisma.orders.findMany({
      where: {
        status: { in: ['SHIPPED', 'READY_FOR_PICKUP'] },
        paymentStatus: 'PAID',
        shippedAt: { lte: cutoff },
      },
      select: {
        id: true,
        userId: true,
        isPickup: true,
        orderItem: {
          select: {
            variant: {
              select: {
                product: {
                  select: {
                    seller: { select: { profileId: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!overdueOrders.length) {
      return { result: 'No overdue orders found' }
    }

    let released = 0
    for (const order of overdueOrders) {
      try {
        // Mark as DELIVERED
        await prisma.orders.update({
          where: { id: order.id },
          data: { status: 'DELIVERED' },
        })

        // Release funds
        await walletService.releaseFundsOnDelivery(order.id)

        // Reputation ledger — auto-released delivery is a completed sale.
        emitOrderCompleted(order.id)

        // Notify buyer
        notificationService
          .createNotification({
            userId: order.userId,
            type: 'ORDER',
            actorId: order.userId,
            message: order.isPickup
              ? `Order #${order.id} has been automatically marked as picked up and payment released to the seller after 7 days.`
              : `Order #${order.id} has been automatically marked as delivered and payment released to the seller after 7 days.`,
          })
          .catch(() => {})

        // Seller notification: `releaseFundsOnDelivery` above already sends the
        // seller a "₦X released to your wallet" message (+ email) when it performs
        // a real release. Sending a second "auto-confirmed" message here duplicated
        // that for every auto-release — removed rather than kept in sync.

        released++
      } catch (e) {
        console.error(`[auto-release] Failed for order #${order.id}:`, e)
      }
    }

    return {
      result: `Released funds for ${released}/${overdueOrders.length} orders`,
    }
  },
})
