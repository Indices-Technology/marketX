// POST /api/commerce/products/[id]/like
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { productService } from '~~/layers/commerce/server/services/product.service'
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!id) throw new UserError('INVALID_ID', 'Product ID is required', 400)
    const data = await productService.likeProduct(user.id, id)
    return { success: true, data }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
