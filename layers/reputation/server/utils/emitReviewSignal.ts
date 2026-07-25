// Emit the commerce.review signal for a verified PRODUCT review (framework §2.3).
//
// The app's real review flow is product reviews (`Review`), which are already
// gated on a delivered order — so they are exactly the "verified review" the
// framework wants. Self-guarding (only emits when the review proves a purchase),
// fire-and-forget, idempotent on `Review:{id}`.

import { prisma } from '~~/server/utils/db'
import { reputationQueue } from '~~/server/queues/reputation.queue'
import { reviewSignal } from './signals'

export function emitProductReview(reviewId: string): void {
  void (async () => {
    try {
      const r = await prisma.review.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          rating: true,
          orderId: true,
          verified: true,
          created_at: true,
          product: { select: { sellerId: true } },
        },
      })

      // Only purchase-proven reviews become evidence — otherwise reviews could
      // be farmed, which is exactly what the ledger exists to prevent.
      if (!r || (!r.verified && r.orderId == null)) return

      const sellerId = r.product?.sellerId
      if (!sellerId) return

      reputationQueue.enqueue(
        reviewSignal({
          sellerId,
          reviewId: r.id,
          rating: r.rating,
          orderId: r.orderId,
          observedAt: r.created_at.toISOString(),
        }),
      )
    } catch {
      // Reputation must never break the review flow.
    }
  })()
}
