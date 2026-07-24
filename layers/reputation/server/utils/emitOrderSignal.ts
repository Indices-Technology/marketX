// Single entry point for the commerce.order_completed signal (framework §2.3).
//
// An order can be completed through several paths — seller status update, buyer
// confirm-receipt, pay-on-delivery, a carrier scan, or the auto-release task.
// Each of them calls this, so the ledger can't silently under-count (which would
// wrongly hold a seller below the min-evidence threshold).
//
// Self-guarding: only emits when the order genuinely qualifies (PAID +
// COMPLETED/DELIVERED), so callers fire it unconditionally after any status or
// payment change. Fire-and-forget, and idempotent on `Orders:{id}` at the
// writer, so duplicate calls are harmless.

import { prisma } from '~~/server/utils/db'
import { reputationQueue } from '~~/server/queues/reputation.queue'
import { orderCompletedSignal } from './signals'

export function emitOrderCompleted(orderId: number): void {
  void (async () => {
    try {
      const o = await prisma.orders.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          deliveredAt: true,
          shipState: true,
          county: true,
          orderItem: {
            take: 1,
            select: {
              variant: { select: { product: { select: { sellerId: true } } } },
            },
          },
        },
      })

      if (!o || o.paymentStatus !== 'PAID') return
      if (o.status !== 'COMPLETED' && o.status !== 'DELIVERED') return

      const sellerId = o.orderItem[0]?.variant?.product?.sellerId
      if (!sellerId) return

      reputationQueue.enqueue(
        orderCompletedSignal({
          sellerId,
          orderId: o.id,
          delivered: o.deliveredAt != null,
          place: o.shipState ?? o.county ?? null,
          observedAt: (o.deliveredAt ?? new Date()).toISOString(),
        }),
      )
    } catch {
      // Reputation must never break an order flow.
    }
  })()
}
