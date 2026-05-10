// GET /api/products/:id/reviews?limit=10&offset=0
import { productService } from '~~/layers/commerce/server/services/product.service'

export default defineEventHandler(async (event) => {
  const productId = parseInt(getRouterParam(event, 'id') || '0')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Invalid product ID' })

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 10, 50)
  const offset = Math.max(Number(query.offset) || 0, 0)

  const result = await productService.getProductReviews(productId, limit, offset)
  return { success: true, data: result.reviews, meta: result.meta }
})
