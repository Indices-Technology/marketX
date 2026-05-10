// GET /api/seller/:slug/reviews/eligibility
// Returns whether the logged-in user can review this seller and if they already have
import { prisma } from '~~/server/utils/db'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const slug = getRouterParam(event, 'id')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

  const seller = await prisma.sellerProfile.findUnique({
    where: { store_slug: slug },
    select: { id: true, profileId: true },
  })
  if (!seller) throw createError({ statusCode: 404, statusMessage: 'Seller not found' })

  // Own store — can't review
  if (seller.profileId === user.id) {
    return { success: true, data: { canReview: false, reason: 'own_store', existingReview: null } }
  }

  const [deliveredOrder, existingReview] = await Promise.all([
    prisma.orders.findFirst({
      where: {
        profileId: user.id,
        status: 'DELIVERED',
        orderItem: { some: { variant: { product: { sellerId: seller.id } } } },
      },
      select: { id: true },
    }),
    prisma.sellerReview.findUnique({
      where: { sellerId_authorId: { sellerId: seller.id, authorId: user.id } },
      select: { id: true, rating: true, title: true, body: true, created_at: true },
    }),
  ])

  return {
    success: true,
    data: {
      canReview: !!deliveredOrder,
      reason: deliveredOrder ? null : 'no_purchase',
      existingReview,
    },
  }
})
