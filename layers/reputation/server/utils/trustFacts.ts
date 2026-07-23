import {
  PaymentStatus,
  OrderStatus,
  SupportTicketType,
  DisputeOutcome,
} from '@prisma/client'

/**
 * Real per-seller trust facts, computed live from existing tables (Orders,
 * SellerReview, SupportTicket) — the honest, pre-engine version of the
 * reputation framework's COMMERCE signals (§2.3). No seeded/placeholder data.
 *
 * This is intentionally query-per-seller and cached at the endpoint; the durable
 * answer is the `ReputationProfile` snapshot (framework §3/§4) once the engine
 * lands — at which point callers read the snapshot instead of recomputing.
 */
export interface RawTrustFacts {
  /** Completed, paid orders on the escrow rail. */
  sales: number
  /** Of those, carrier-scan-confirmed delivered (Orders.deliveredAt). */
  delivered: number
  /** Disputes resolved against the seller (REFUND_BUYER). */
  disputes: number
  /** disputes / sales, as a percentage. */
  disputeRate: number
  reviewCount: number
  rating: number | null
  /** Whole years since the store was created (0 if under a year). */
  tenureYears: number
  /** The most recent completed order — powers the "last sale" line. */
  lastOrder: { at: Date; place: string | null } | null
}

/** Orders belonging to a seller reach them via orderItem → variant → product. */
const sellerOrderWhere = (
  sellerId: string,
  extra: Record<string, unknown> = {},
) => ({
  paymentStatus: PaymentStatus.PAID,
  status: { in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] },
  orderItem: { some: { variant: { product: { sellerId } } } },
  ...extra,
})

export async function sellerTrustFacts(
  sellerId: string,
  createdAt: Date,
): Promise<RawTrustFacts> {
  const [sales, delivered, disputes, reviewAgg, last] = await Promise.all([
    prisma.orders.count({ where: sellerOrderWhere(sellerId) }),
    prisma.orders.count({
      where: sellerOrderWhere(sellerId, { deliveredAt: { not: null } }),
    }),
    prisma.supportTicket.count({
      where: {
        sellerId,
        type: SupportTicketType.DISPUTE,
        disputeOutcome: DisputeOutcome.REFUND_BUYER,
      },
    }),
    prisma.sellerReview.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.orders.findFirst({
      where: sellerOrderWhere(sellerId),
      orderBy: { created_at: 'desc' },
      select: { created_at: true, shipState: true, county: true },
    }),
  ])

  const disputeRate = sales ? (disputes / sales) * 100 : 0
  const tenureYears = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 31_536_000_000),
  )

  return {
    sales,
    delivered,
    disputes,
    disputeRate,
    reviewCount: reviewAgg._count,
    rating: reviewAgg._avg.rating,
    tenureYears,
    lastOrder: last
      ? { at: last.created_at, place: last.shipState || last.county || null }
      : null,
  }
}

// ── presentation helpers (shared by the rail card + the profile tab) ─────────

export function tenureChip(years: number): string {
  return years >= 1 ? `${years} yr${years > 1 ? 's' : ''} trading` : 'New store'
}

export function daysAgo(d: Date): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000),
  )
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}
