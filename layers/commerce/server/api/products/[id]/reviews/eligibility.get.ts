// GET /api/products/:id/reviews/eligibility
import { prisma } from '~~/server/utils/db'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const productId = parseInt(getRouterParam(event, 'id') || '0')
    if (!productId) throw createError({ statusCode: 400, statusMessage: 'Invalid product ID' })

    const [deliveredOrder, existingReview] = await Promise.all([
      prisma.orders.findFirst({
        where: {
          userId: user.id,
          status: 'DELIVERED',
          orderItem: { some: { variant: { product: { id: productId } } } },
        },
        select: { id: true },
      }),
      prisma.review.findUnique({
        where: { productId_authorId: { productId, authorId: user.id } },
        select: { id: true, rating: true, body: true, created_at: true },
      }),
    ])

    return {
      success: true,
      data: {
        canReview: !!deliveredOrder,
        existingReview,
      },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/products/:id/reviews/eligibility]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
