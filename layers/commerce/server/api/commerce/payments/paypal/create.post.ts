// POST /api/commerce/payments/paypal/create
// Creates a PENDING internal order then a PayPal order.
// Returns the PayPal approval URL for redirect.
import { z, ZodError } from 'zod'
import { orderService } from '~~/layers/commerce/server/services/order.service'
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
  callback_url: z.string().url().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = schema.parse(await readBody(event))
    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // 1. Create internal order (PENDING, UNPAID)
    const order = await orderService.placeOrder(
      user.id,
      { ...body, paymentMethod: 'paypal' },
      ipAddress,
      userAgent,
    )

    // 2. Total in kobo (order.totalAmount) + shipping
    const totalKobo = order.totalAmount + body.shippingCost
    const amountUSD = koboToUSD(totalKobo)

    const config = useRuntimeConfig()
    const baseURL = config.public.baseURL || 'http://localhost:3000'
    const baseAppName = config.public.siteName || 'MarketX'
    const returnUrl = `${baseURL}/buyer/orders?paypal=success&orderId=${order.id}`
    const cancelUrl = `${baseURL}/checkout`

    // 3. Create PayPal order
    const pp = await paypal.createOrder({
      amountUSD,
      internalOrderId: order.id,
      description: `${baseAppName} Order #${order.id}`,
      returnUrl,
      cancelUrl,
    })

    // 4. Store PayPal order ID as paymentRef
    await prisma.orders.update({
      where: { id: order.id },
      data: { paymentRef: pp.id },
    })

    return {
      success: true,
      data: {
        orderId: order.id,
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
