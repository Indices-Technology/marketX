// GET /api/seller/mine
// Returns all SellerProfiles owned by the authenticated user.
// Used by Dassah (CP-2) to populate the store picker on first load.

import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const stores = await prisma.sellerProfile.findMany({
    where: { profileId: user.id },
    select: {
      id: true,
      store_name: true,
      store_slug: true,
      store_logo: true,
      is_active: true,
      averageRating: true,
      totalReviews: true,
      followers_count: true,
    },
    orderBy: { created_at: 'asc' },
  })

  return { success: true, data: stores }
})
