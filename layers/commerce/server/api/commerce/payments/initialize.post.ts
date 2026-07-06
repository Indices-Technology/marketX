// POST /api/commerce/payments/initialize
// Creates an order in PENDING state, then initializes a Paystack transaction.
// The client redirects the user to the Paystack payment page.
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { orderService } from '../../../services/order.service'
import { orderRepository } from '../../../repositories/order.repository'
import { resolveAffiliateCode } from '~~/server/utils/affiliate-ref'

const schema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.number().int(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
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
        token: z.string().optional(),
      }),
    )
    .optional(),
  // Paystack settles NGN here — lock it so the client can't dictate currency
  // (the confirmPayment gate also rejects a non-NGN settlement at verify).
  currency: z.enum(['NGN']).default('NGN'),
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

    // 1. Create the orders (one per seller, PENDING/UNPAID, shared group)
    const group = await orderService.placeOrder(
      user.id,
      {
        ...body,
        paymentMethod: 'card',
        affiliateCode: await resolveAffiliateCode(event, body.affiliateCode),
      },
      ipAddress,
      userAgent,
    )

    // 2. One Paystack reference for the whole purchase, set on every order
    const reference = `marketx_${group.purchaseGroupId.slice(0, 8)}_${Date.now()}`
    await orderRepository.setPaymentRefForGroup(
      group.purchaseGroupId,
      reference,
    )

    // 3. Initialize Paystack transaction
    // Priority: email from checkout form → account email (if real TLD) → generated placeholder
    const FAKE_TLDS = new Set([
      'test',
      'demo',
      'local',
      'example',
      'invalid',
      'localhost',
    ])
    const isRealEmail = (e: string | null | undefined): e is string => {
      if (!e) return false
      const tld = e.split('.').pop()?.toLowerCase() ?? ''
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && !FAKE_TLDS.has(tld)
    }
    const email = isRealEmail(body.email)
      ? body.email
      : isRealEmail(user.email)
        ? user.email
        : `user_${user.id}@checkout.marketx.africa`
    // Charge the whole purchase: items + shipping across all per-seller orders.
    const amount = group.itemsTotal + group.shippingTotal
    const ps = await paystack.initializeTransaction({
      email,
      amount,
      reference,
      currency: body.currency,
      metadata: { purchaseGroupId: group.purchaseGroupId, userId: user.id },
      callback_url: body.callback_url,
    })

    return {
      success: true,
      data: {
        purchaseGroupId: group.purchaseGroupId,
        orderIds: group.orders.map((o) => o.id),
        reference,
        authorizationUrl: ps.data.authorization_url,
        accessCode: ps.data.access_code,
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
    // Surface Paystack-specific errors so the client can show the real reason
    const msg: string = error instanceof Error ? error.message : ''
    if (msg.startsWith('Paystack:')) {
      logger.logError(
        '[POST /api/commerce/payments/initialize] Paystack error',
        error,
        { requestId: event.context?.requestId },
      )
      throw createError({ statusCode: 502, statusMessage: msg })
    }
    logger.logError('[POST /api/commerce/payments/initialize]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Payment initialization failed',
    })
  }
})
