// DELETE /api/growth/connections/:id
// Disconnect a social account. Ownership-scoped: the delete filters on the
// authenticated seller, so a seller can never remove another seller's connection.

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

    const id = getRouterParam(event, 'id')
    if (!id) throw new UserError('BAD_REQUEST', 'Missing connection id', 400)

    const result = await prisma.socialConnection.deleteMany({
      where: { id, sellerId: seller.id },
    })
    if (result.count === 0) {
      throw new UserError('NOT_FOUND', 'Connection not found', 404)
    }

    return { success: true }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[DELETE /api/growth/connections/:id]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to disconnect' })
  }
})
