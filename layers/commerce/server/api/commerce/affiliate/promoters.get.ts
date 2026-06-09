// GET /api/commerce/affiliate/promoters
// Returns affiliates who have generated sales for the authenticated seller's products.
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { affiliateRepository } from '../../../repositories/affiliate.repository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const sellerProfiles = await prisma.sellerProfile.findMany({
      where: { profileId: user.id, is_active: true },
      select: { id: true },
    })

    if (!sellerProfiles.length) {
      return { success: true, data: { promoters: [], total: 0 } }
    }

    const sellerIds = sellerProfiles.map((s) => s.id)
    const rawOrders = await affiliateRepository.getPromoters(sellerIds)

    // Group by affiliate, summing their cuts and counting orders
    const promoterMap = new Map<string, {
      id: string
      username: string
      avatar: string | null
      totalEarned: number
      orderCount: number
    }>()

    for (const order of rawOrders) {
      if (!order.affiliateUserId || !order.affiliate) continue
      // Sum only the items that belong to this seller — order-level affiliateCut
      // includes cuts from other sellers in multi-seller orders.
      const earnedThisOrder = order.orderItem.reduce((s, i) => s + (i.affiliateCut ?? 0), 0)
      if (earnedThisOrder <= 0) continue
      const existing = promoterMap.get(order.affiliateUserId)
      if (existing) {
        existing.totalEarned += earnedThisOrder
        existing.orderCount++
      } else {
        promoterMap.set(order.affiliateUserId, {
          id: order.affiliate.id,
          username: order.affiliate.username ?? '',
          avatar: order.affiliate.avatar ?? null,
          totalEarned: earnedThisOrder,
          orderCount: 1,
        })
      }
    }

    const promoters = Array.from(promoterMap.values())
      .sort((a, b) => b.totalEarned - a.totalEarned)

    return {
      success: true,
      data: { promoters, total: promoters.length },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[affiliate/promoters]', error)
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
