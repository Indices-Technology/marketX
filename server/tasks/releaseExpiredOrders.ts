/**
 * Scheduled task: restore stock for orders that were created but never paid.
 * An order is considered abandoned if it has been PENDING with UNPAID status
 * for more than 30 minutes. Stock is restored so other buyers can purchase.
 *
 * Runs every 15 minutes via Nitro scheduled tasks.
 * Register in nuxt.config.ts:
 *   nitro.scheduledTasks: { '*\/15 * * * *': ['releaseExpiredOrders'] }
 */
import { prisma } from '../utils/db'
import { notificationService } from '~~/layers/profile/server/services/notification.service'

const EXPIRY_MINUTES = 30

export default defineTask({
  meta: {
    name: 'releaseExpiredOrders',
    description: 'Restore stock and cancel orders unpaid after 30 minutes',
  },
  async run() {
    const cutoff = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000)

    const expiredOrders = await prisma.orders.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        created_at: { lte: cutoff },
      },
      select: {
        id: true,
        userId: true,
        orderItem: {
          select: {
            variantId: true,
            quantity: true,
          },
        },
      },
    })

    if (!expiredOrders.length) return { result: 'No expired orders' }

    let cancelled = 0
    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Cancel the order
          await tx.orders.update({
            where: { id: order.id },
            data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
          })

          // Restore stock for each line item
          await Promise.all(
            order.orderItem
              .filter((i) => i.variantId !== null)
              .map((i) =>
                tx.productVariant.update({
                  where: { id: i.variantId! },
                  data: { stock: { increment: i.quantity } },
                }),
              ),
          )
        })

        // Notify buyer
        notificationService
          .createNotification({
            userId: order.userId,
            type: 'ORDER',
            actorId: order.userId,
            message: `Your order #${order.id} was cancelled because payment was not completed within ${EXPIRY_MINUTES} minutes. Items have been returned to stock.`,
          })
          .catch(() => {})

        cancelled++
      } catch (e) {
        console.error(`[releaseExpiredOrders] Failed for order #${order.id}:`, e)
      }
    }

    return { result: `Cancelled and restored stock for ${cancelled}/${expiredOrders.length} expired orders` }
  },
})
