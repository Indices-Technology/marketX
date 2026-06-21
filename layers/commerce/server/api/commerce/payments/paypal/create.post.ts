// POST /api/commerce/payments/paypal/create
// Creates a PENDING internal order then a PayPal order.
// Returns the PayPal approval URL for redirect.
import { z, ZodError } from 'zod'
import { orderService } from '~~/layers/commerce/server/services/order.service'
import { orderRepository } from '~~/layers/commerce/server/repositories/order.repository'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'

const schema = z.object({
  items: z
    .array(z.object({ variantId: z.number(), quantity: z.number().positive() }))
    .min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  zipcode: z.string().min(1),
  county: z.string().optional().default(''),
  country: z.string().min(2).max(2),
  shippingCost: z.number().int().min(0).default(0),
  shippingZone: z.string().optional(),
  estimatedDays: z.string().optional(),
  shippingBreakdown: z
    .array(
      z.object({
        storeSlug: z.string(),
        amount: z.number().int().min(0),
        carrier: z.string().optional(),
        service: z.string().optional(),
        estimatedDays: z.string().optional(),
      }),
    )
    .optional(),
  callback_url: z.string().url().optional(),
  affiliateCode: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = schema.parse(await readBody(event))
    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // 1. Create internal orders (one per seller, PENDING/UNPAID, shared group)
    const group = await orderService.placeOrder(
      user.id,
      { ...body, paymentMethod: 'paypal' },
      ipAddress,
      userAgent,
    )

    // 2. Whole-purchase total in kobo (items + shipping across all orders)
    const totalKobo = group.itemsTotal + group.shippingTotal
    const amountUSD = koboToUSD(totalKobo)

    const config = useRuntimeConfig()
    const baseURL = config.public.baseURL || 'http://localhost:3000'
    const baseAppName = config.public.siteName || 'MarketX'
    const returnUrl = `${baseURL}/buyer/orders?paypal=success&group=${group.purchaseGroupId}`
    const cancelUrl = `${baseURL}/checkout`

    // 3. Create PayPal order (reference the group as the internal id)
    const pp = await paypal.createOrder({
      amountUSD,
      internalOrderId: group.orders[0]!.id,
      description: `${baseAppName} Purchase (${group.orders.length} seller${group.orders.length !== 1 ? 's' : ''})`,
      returnUrl,
      cancelUrl,
    })

    // 4. Store the PayPal order ID as the shared paymentRef across the group
    await orderRepository.setPaymentRefForGroup(group.purchaseGroupId, pp.id)

    return {
      success: true,
      data: {
        purchaseGroupId: group.purchaseGroupId,
        orderIds: group.orders.map((o) => o.id),
        paypalOrderId: pp.id,
        approvalUrl: pp.approvalUrl,
        amountUSD,
      },
    }
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
    const msg: string =
      error?.message || error?.data?.message || 'PayPal order creation failed'
    logger.logError('[POST /api/commerce/payments/paypal/create]', error, {
      requestId: event.context?.requestId,
    })
    if (
      msg.includes('PAYPAL_CLIENT_ID') ||
      msg.includes('PAYPAL_CLIENT_SECRET')
    )
      throw createError({
        statusCode: 503,
        statusMessage: 'PayPal is not configured on this server',
      })
    throw createError({ statusCode: 502, statusMessage: `PayPal: ${msg}` })
  }
})
