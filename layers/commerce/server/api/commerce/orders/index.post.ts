// POST /api/commerce/orders - Place an order
import { createHash } from 'crypto'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { orderService } from '../../../services/order.service'
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { resolveAffiliateCode } from '~~/server/utils/affiliate-ref'
import { once } from '~~/server/utils/cache'
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)
    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'
    const affiliateCode = await resolveAffiliateCode(event, body?.affiliateCode)

    // Idempotency: a double-click or network retry must not create a second
    // order group. Prefer a client-sent Idempotency-Key; otherwise derive a
    // stable hash of the order payload. `once` runs placeOrder a single time and
    // returns the same result for repeats within the window (single-flight
    // coalesces concurrent submits; failures rethrow uncached so real errors can
    // be retried — it never double-places an order).
    const idemHeader = getHeader(event, 'idempotency-key')
    const payloadKey =
      idemHeader ||
      createHash('sha256')
        .update(
          JSON.stringify({
            items: body?.items,
            address: body?.address,
            paymentMethod: body?.paymentMethod,
          }),
        )
        .digest('hex')
        .slice(0, 32)
    const idemKey = `order:idem:${user.id}:${payloadKey}`

    const result = await once(idemKey, 60, () =>
      orderService.placeOrder(
        user.id,
        { ...body, affiliateCode },
        ipAddress,
        userAgent,
      ),
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
