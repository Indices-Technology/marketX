// GET /api/commerce/buyer-wallet/transactions
import { z, ZodError } from 'zod'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { buyerWalletRepository } from '../../../repositories/buyer-wallet.repository'

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { limit, offset } = querySchema.parse(getQuery(event))

    const wallet = await buyerWalletRepository.getOrCreate(user.id)
    const [transactions, total] = await Promise.all([
      buyerWalletRepository.getTransactions(wallet.id, limit, offset),
      buyerWalletRepository.countTransactions(wallet.id),
    ])

    return {
      success: true,
      data: {
        transactions,
        total,
        limit,
        offset,
        hasMore: offset + transactions.length < total,
      },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid query parameters' })
    logger.logError('[GET /api/commerce/buyer-wallet/transactions]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
