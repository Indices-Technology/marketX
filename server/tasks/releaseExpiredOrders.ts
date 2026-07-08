/**
 * Scheduled task: reconcile orders that were created but never confirmed.
 *
 * An order is a *candidate* for expiry if it has been PENDING with UNPAID status
 * for more than 30 minutes. But "unpaid in our DB" is NOT the same as "unpaid at
 * the provider": the buyer may have completed payment while our return-redirect or
 * webhook was lost/delayed. So before cancelling, we ASK Paystack.
 *
 *   - provider says the payment succeeded → confirm the order (money was
 *     collected; it must be fulfilled, never cancelled) and reclaim nothing.
 *   - provider says failed / abandoned / unknown → cancel the order and restore
 *     its stock so other buyers can purchase.
 *
 * This closes the money hole where a blindly-cancelling cron would mark a genuinely
 * paid order FAILED, keeping the buyer's money with no fulfilment and (worse)
 * releasing already-sold stock. The cancel path is an atomic conditional write so
 * it can't double-restore stock against a concurrent buyer cancel.
 *
 * Runs every 15 minutes via Nitro scheduled tasks.
 * Register in nuxt.config.ts:
 *   nitro.scheduledTasks: { '*\/15 * * * *': ['releaseExpiredOrders'] }
 */
import { prisma } from '../utils/db'
import { notificationService } from '~~/layers/profile/server/services/notification.service'
import { paymentService } from '~~/layers/payments/server/services/payment.service'
import { paymentConfirmationService } from '~~/layers/commerce/server/services/paymentConfirmation.service'
import { podService } from '~~/layers/pod/server/services/pod.service'

const EXPIRY_MINUTES = 30

/** Atomically cancel one order and restore its stock. Conditional on the order
 *  still being PENDING/UNPAID so a concurrent buyer cancel can't double-restore. */
async function cancelAndRestore(orderId: number): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.orders.updateMany({
      where: { id: orderId, status: 'PENDING', paymentStatus: 'UNPAID' },
      data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
    })
    if (count === 0) return false
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    })
    await Promise.all(
      items
        .filter((i) => i.variantId !== null)
        .map((i) =>
          tx.productVariant.update({
            where: { id: i.variantId! },
            data: { stock: { increment: i.quantity } },
          }),
        ),
    )
    return true
  })
}

export default defineTask({
  meta: {
    name: 'releaseExpiredOrders',
    description:
      'Reconcile unpaid orders after 30 minutes: confirm those the provider shows paid, cancel + restore stock for the rest',
  },
  async run() {
    logger.info('[task:releaseExpiredOrders] fired', {
      at: new Date().toISOString(),
    })
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
        paymentRef: true,
        paymentMethod: true,
        totalAmount: true,
        shippingCost: true,
      },
    })

    if (!expiredOrders.length) return { result: 'No expired orders' }

    // Group per payment reference — one checkout can be several per-seller orders
    // sharing a reference, and Paystack is verified once per reference.
    const groups = new Map<string, typeof expiredOrders>()
    const noRef: typeof expiredOrders = []
    for (const o of expiredOrders) {
      if (!o.paymentRef) noRef.push(o)
      else {
        const arr = groups.get(o.paymentRef) ?? []
        arr.push(o)
        groups.set(o.paymentRef, arr)
      }
    }

    let cancelled = 0
    let confirmed = 0

    // Orders that never even reached payment init (no reference) can only be cancelled.
    for (const order of noRef) {
      try {
        if (await cancelAndRestore(order.id)) {
          cancelled++
          notifyCancelled(order.id, order.userId)
        }
      } catch (e) {
        console.error(
          `[releaseExpiredOrders] cancel failed for order #${order.id}:`,
          e,
        )
      }
    }

    for (const [reference, group] of groups) {
      const isPod = group[0]!.paymentMethod === 'pay_on_delivery'
      // What the group owes: card collects items + shipping, POD collects shipping only.
      const expectedMinor = group.reduce(
        (s, o) => s + (isPod ? 0 : o.totalAmount) + (o.shippingCost ?? 0),
        0,
      )

      let providerPaid = false
      try {
        const confirm = await paymentService.confirmPayment({
          reference,
          expectedMinor,
          expectedCurrency: 'NGN',
        })
        providerPaid = confirm.ok
      } catch (e) {
        // Provider unreachable → do NOT cancel; a paid order must never be lost to
        // a transient outage. Leave it for the next run.
        console.error(
          `[releaseExpiredOrders] verify failed for ${reference} — leaving for next run:`,
          e,
        )
        continue
      }

      for (const order of group) {
        try {
          if (providerPaid) {
            const ok = isPod
              ? await paymentConfirmationService.confirmPodShippingOrder(
                  order.id,
                )
              : await paymentConfirmationService.confirmPaidCardOrder(order.id)
            if (ok) confirmed++
          } else if (await cancelAndRestore(order.id)) {
            cancelled++
            notifyCancelled(order.id, order.userId)
          }
        } catch (e) {
          console.error(
            `[releaseExpiredOrders] failed for order #${order.id}:`,
            e,
          )
        }
      }

      // A POD group we just confirmed via reconciliation still needs its freight
      // deposit advanced + platform fee debited (normally done by pod-verify).
      if (providerPaid && isPod) {
        const ids = group.map((o) => o.id)
        await prisma.podDelivery
          .updateMany({
            where: { orderId: { in: ids }, state: 'DEPOSIT_PENDING' },
            data: { state: 'DEPOSIT_PAID' },
          })
          .catch((e) =>
            console.error(
              '[releaseExpiredOrders] POD state advance failed:',
              e,
            ),
          )
        await podService
          .debitSellerPodFees(ids)
          .catch((e) =>
            console.error('[releaseExpiredOrders] POD fee debit failed:', e),
          )
      }
    }

    return {
      result: `Reconciled expired orders — confirmed ${confirmed} (paid late), cancelled ${cancelled}`,
    }
  },
})

function notifyCancelled(orderId: number, userId: string) {
  notificationService
    .createNotification({
      userId,
      type: 'ORDER',
      orderId,
      message: `Your order #${orderId} was cancelled because payment was not completed within ${EXPIRY_MINUTES} minutes. Items have been returned to stock.`,
    })
    .catch(() => {})
}
