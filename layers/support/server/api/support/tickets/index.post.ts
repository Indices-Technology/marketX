// POST /api/support/tickets — create a support ticket (logged-in user or guest)
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { optionalAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { supportService } from '~~/layers/support/server/services/support.service'

const schema = z.object({
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(5).max(5000),
  category: z.enum([
    'ORDER',
    'PAYMENT',
    'DELIVERY',
    'ACCOUNT',
    'SELLER',
    'PRODUCT',
    'REFUND',
    'OTHER',
  ]),
  email: z.string().email().optional(),
  orderId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(),
  sellerId: z.string().uuid().optional(),
  source: z.enum(['WEB', 'EMAIL', 'CHECKOUT', 'ORDER']).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await optionalAuth(event)
    const body = schema.parse(await readBody(event))

    if (!user && !body.email)
      throw new UserError(
        'EMAIL_REQUIRED',
        'An email is required to contact support',
        400,
      )

    const ticket = await supportService.createTicket({
      requesterId: user?.id ?? null,
      guestEmail: user ? null : body.email,
      subject: body.subject,
      message: body.message,
      category: body.category,
      source: body.source ?? 'WEB',
      orderId: body.orderId ?? null,
      productId: body.productId ?? null,
      sellerId: body.sellerId ?? null,
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
    logger.logError('[support/tickets:create]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
