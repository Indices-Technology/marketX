// POST /api/commerce/orders - Place an order
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { orderService } from '../../../services/order.service'
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { resolveAffiliateCode } from '~~/server/utils/affiliate-ref'
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)
    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'
    const result = await orderService.placeOrder(
      user.id,
      { ...body, affiliateCode: await resolveAffiliateCode(event, body?.affiliateCode) },
      ipAddress,
      userAgent,
    )
    // A purchase now splits into one order per seller. Expose the full group,
    // but spread the first order at the top level so single-order consumers
    // (useOrder.placeOrder, `data.id`) keep working without a shape change.
    const [first] = result.orders
    return {
      success: true,
      data: {
        ...first,
        purchaseGroupId: result.purchaseGroupId,
        orderIds: result.orders.map((o) => o.id),
        orders: result.orders,
        itemsTotal: result.itemsTotal,
        shippingTotal: result.shippingTotal,
      },
    }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/commerce/orders]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
