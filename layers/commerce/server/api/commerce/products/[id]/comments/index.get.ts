// GET /api/commerce/products/[id]/comments

import { productService } from '~~/layers/commerce/server/services/product.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Invalid product ID' })

  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const offset = Math.max(Number(query.offset) || 0, 0)

  const result = await productService.getProductComments(id, limit, offset)
  return {
    success: true,
    data: result.comments,
    meta: { total: result.total, limit, offset, hasMore: result.hasMore },
  }
})
