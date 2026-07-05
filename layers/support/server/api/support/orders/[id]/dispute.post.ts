// POST /api/support/orders/:id/dispute — buyer opens a dispute on a paid order
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { supportService } from '~~/layers/support/server/services/support.service'

const schema = z.object({
  message: z.string().trim().min(10).max(5000),
  category: z
    .enum(['ORDER', 'DELIVERY', 'PRODUCT', 'REFUND', 'OTHER'])
    .optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const orderId = parseInt(getRouterParam(event, 'id') || '')
    if (isNaN(orderId))
      throw new UserError('INVALID_ID', 'Invalid order ID', 400)

    const body = schema.parse(await readBody(event))

    const ticket = await supportService.openDispute({
      orderId,
      userId: user.id,
      userEmail: user.email,
      message: body.message,
      category: body.category,
    })
    return { success: true, data: ticket }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
      })
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    logger.logError('[support/orders:dispute]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
