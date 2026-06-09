// GET /api/commerce/buyer-wallet
// Returns the authenticated buyer's wallet balance and stats.
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { buyerWalletRepository } from '../../../repositories/buyer-wallet.repository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const wallet = await buyerWalletRepository.getOrCreate(user.id)
    const stats = await buyerWalletRepository.getStats(wallet.id)

    return {
      success: true,
      data: {
        wallet: { id: wallet.id, balance: wallet.balance },
        stats,
      },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/commerce/buyer-wallet]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
