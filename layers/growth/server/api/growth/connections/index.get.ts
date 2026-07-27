// GET /api/growth/connections
// List the authenticated seller's social connections. Never returns tokens —
// select only the safe, UI-facing fields.

import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const seller = await getAuthSellerProfile(event)
    if (!seller) {
      throw new UserError('SELLER_REQUIRED', 'A seller profile is required', 403)
    }

    const connections = await prisma.socialConnection.findMany({
      where: { sellerId: seller.id },
      select: {
        id: true,
        platform: true,
        providerUserId: true,
        displayName: true,
        avatarUrl: true,
        scope: true,
        status: true,
        expiresAt: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })

    return { success: true, data: connections }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/growth/connections]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to load connections' })
  }
})
