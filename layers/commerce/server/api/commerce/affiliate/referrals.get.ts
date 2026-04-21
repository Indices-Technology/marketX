// GET /api/commerce/affiliate/referrals
// Returns the authenticated affiliate's conversion history (orders they referred).
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { affiliateRepository } from '../../../repositories/affiliate.repository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const query = getQuery(event)
    const limit = Math.min(Number(query.limit) || 20, 50)
    const offset = Number(query.offset) || 0

    const { orders, total } = await affiliateRepository.getReferrals(user.id, limit, offset)

    const referrals = orders.map((order) => ({
      id: order.id,
      date: order.created_at.toISOString(),
      commission: order.affiliateCut,
      status: order.status,
      products: order.orderItem
        .map((item) => item.variant?.product)
        .filter(Boolean)
        .map((p) => ({ title: p!.title, slug: p!.slug })),
    }))

    return {
      success: true,
      data: {
        referrals,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }
  } catch (error: any) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
