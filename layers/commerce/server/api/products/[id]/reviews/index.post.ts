// POST /api/products/:id/reviews — authenticated, one review per user per product
import { z } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { productService } from '~~/layers/commerce/server/services/product.service'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const productId = parseInt(getRouterParam(event, 'id') || '0')
    if (!productId) throw new UserError('INVALID_ID', 'Invalid product ID', 400)

    const body = reviewSchema.parse(await readBody(event))
    const review = await productService.submitProductReview(user.id, productId, body)
    return { success: true, data: review }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
