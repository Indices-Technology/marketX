// Reputation backfill (framework §4). Replays existing history — completed
// orders, verified reviews, resolved disputes — into the ReputationSignal
// ledger, so sellers start with their REAL track record, not zero.
//
// Enqueues through the same reputationQueue as live emission, so writes are
// idempotent (one signal per sourceRef + signalKey): re-running is always safe.
// Runs inline via /api/reputation/backfill (dev) or the reputationBackfill task.

import { prisma } from '~~/server/utils/db'
import { reputationQueue } from '~~/server/queues/reputation.queue'
import { orderCompletedSignal, reviewSignal, disputeSignal } from './signals'

export interface BackfillCounts {
  orders: number
  reviews: number
  disputes: number
}

export async function runReputationBackfill(): Promise<BackfillCounts> {
  const counts: BackfillCounts = { orders: 0, reviews: 0, disputes: 0 }

  // ── Completed, paid orders → commerce.order_completed ──────────────────────
  const orders = await prisma.orders.findMany({
    where: {
      paymentStatus: 'PAID',
      status: { in: ['COMPLETED', 'DELIVERED'] },
    },
    select: {
      id: true,
      created_at: true,
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
  for (const o of orders) {
    const sellerId = o.orderItem[0]?.variant?.product?.sellerId
    if (!sellerId) continue
    reputationQueue.enqueue(
      orderCompletedSignal({
        sellerId,
        orderId: o.id,
        delivered: o.deliveredAt != null,
        place: o.shipState ?? o.county ?? null,
        observedAt: (o.deliveredAt ?? o.created_at).toISOString(),
      }),
    )
    counts.orders++
  }

  // ── Verified reviews → commerce.review ─────────────────────────────────────
  const reviews = await prisma.sellerReview.findMany({
    select: {
      id: true,
      sellerId: true,
      rating: true,
      orderId: true,
      created_at: true,
    },
  })
  for (const r of reviews) {
    reputationQueue.enqueue(
      reviewSignal({
        sellerId: r.sellerId,
        reviewId: r.id,
        rating: r.rating,
        orderId: r.orderId,
        observedAt: r.created_at.toISOString(),
      }),
    )
    counts.reviews++
  }

  // ── Resolved disputes → commerce.dispute_resolved ──────────────────────────
  const disputes = await prisma.supportTicket.findMany({
    where: {
      type: 'DISPUTE',
      disputeOutcome: { not: null },
      sellerId: { not: null },
    },
    select: {
      id: true,
      sellerId: true,
      disputeOutcome: true,
      resolvedAt: true,
      created_at: true,
    },
  })
  for (const d of disputes) {
    if (!d.sellerId || !d.disputeOutcome) continue
    reputationQueue.enqueue(
      disputeSignal({
        sellerId: d.sellerId,
        ticketId: d.id,
        outcome: d.disputeOutcome,
        observedAt: (d.resolvedAt ?? d.created_at).toISOString(),
      }),
    )
    counts.disputes++
  }

  return counts
}
