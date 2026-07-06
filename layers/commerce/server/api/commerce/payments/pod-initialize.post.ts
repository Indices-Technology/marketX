// POST /api/commerce/payments/pod-initialize
// Pay-on-Delivery flow: creates the order and charges ONLY the shipping fee
// upfront via Paystack as a commitment deposit.
// The product amount is collected in cash on delivery.
// Returns a Paystack authorization URL for the shipping fee payment.

import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { orderService } from '../../../services/order.service'
import { orderRepository } from '../../../repositories/order.repository'
import { resolveAffiliateCode } from '~~/server/utils/affiliate-ref'
import { walletRepository } from '../../../repositories/wallet.repository'
import { podService } from '~~/layers/pod/server/services/pod.service'

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
  address: z.string().min(1),
  zipcode: z.string().min(1),
  county: z.string().optional().default(''),
  country: z.string().min(2).max(2),
  shippingCost: z.number().int().min(1, 'Shipping fee is required for Pay on Delivery'),
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
  callback_url: z.string().url().optional(),
  affiliateCode: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = schema.parse(await readBody(event))
    const ipAddress = getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // 1. Verify every seller can offer POD:
    //    - opted in (pod_enabled)
    //    - has a ship-from origin — GIG (the only COD collector) picks up there
    //    - the buyer's state is in the seller's POD zones (when the state is known)
    // Buyer state derived from shippingZone ("State · Zone") or county.
    const buyerState =
      body.shippingZone?.split('·')[0]?.trim() || body.county || ''
    const variantIds = body.items.map((i) => i.variantId)
    const sellers = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        product: {
          select: {
            seller: {
              select: {
                pod_enabled: true,
                pod_zones: true,
                shipFromCity: true,
                shipFromState: true,
                state: true,
              },
            },
          },
        },
      },
    })

    const anySellerDisablesPOD = sellers.some((v) => {
      const s = v.product?.seller
      if (!s?.pod_enabled) return true
      // GIG needs a ship-from origin (city + state) to collect on delivery.
      const hasOrigin = !!(s.shipFromCity && (s.shipFromState || s.state))
      if (!hasOrigin) return true
      // Zone restriction only when we know the buyer's state and the seller set zones.
      if (buyerState && s.pod_zones) {
        const zones = s.pod_zones as string[]
        if (
          zones.length &&
          !zones.some((z) => buyerState.toLowerCase().includes(z.toLowerCase()))
        )
          return true
      }
      return false
    })

    if (anySellerDisablesPOD) {
      throw new UserError(
        'POD_NOT_AVAILABLE',
        "Pay on Delivery isn't available for a seller in your cart — they may not have set a pickup address, or they don't deliver to your area.",
        400,
      )
    }

    // Select the POD provider (courier-COD). GIG covers Nigeria; BYOP is gated.
    const podProvider = podService.selectProvider({
      destinationState: buyerState,
      country: body.country,
      sellerOptIn: true,
    })
    if (!podProvider) {
      throw new UserError(
        'POD_UNAVAILABLE',
        'Pay on Delivery is not available for your location right now.',
        400,
      )
    }

    // 2. Create the orders (one per seller, PENDING/UNPAID, pay_on_delivery)
    const group = await orderService.placeOrder(
      user.id,
      {
        ...body,
        paymentMethod: 'pay_on_delivery',
        affiliateCode: await resolveAffiliateCode(event, body.affiliateCode),
      },
      ipAddress,
      userAgent,
    )

    // 3. Platform fee per seller (each order = one seller). item.price is the
    //    line total incl. discounts. Track the seller's orderId for the ledger.
    const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT ?? '5')
    const sellerFees = new Map<string, { orderId: number; fee: number }>()
    for (const ord of group.orders) {
      for (const item of ord.orderItem) {
        const sellerId = item.variant?.product?.seller?.id
        if (!sellerId) continue
        const fee = Math.round(item.price * PLATFORM_FEE_PERCENT / 100)
        const cur = sellerFees.get(sellerId) ?? { orderId: ord.id, fee: 0 }
        cur.fee += fee
        sellerFees.set(sellerId, cur)
      }
    }
    const allItems = group.orders.flatMap((o) =>
      o.orderItem.map((i: any) => ({ variantId: i.variantId, quantity: i.quantity })),
    )

    // Check every seller has sufficient balance before debiting any
    for (const [sellerId, { fee }] of sellerFees) {
      const wallet = await walletRepository.getOrCreateWallet(sellerId)
      if (wallet.balance < fee) {
        const shortfallNGN = ((fee - wallet.balance) / 100).toFixed(2)
        // Cancel the whole purchase + restore stock — buyer sees a clean error
        await orderRepository.restoreStock(allItems)
        await prisma.orders.updateMany({
          where: { purchaseGroupId: group.purchaseGroupId },
          data: { status: 'CANCELLED' },
        })
        throw new UserError(
          'SELLER_INSUFFICIENT_WALLET',
          `One or more sellers cannot offer Pay on Delivery at this time (wallet shortfall: ₦${shortfallNGN}). Please choose a different payment method.`,
          402,
        )
      }
    }

    // 4. Build Paystack reference and initialize BEFORE debiting wallets.
    //    This way, if Paystack is unavailable the wallet balance is never touched
    //    and the buyer can safely retry.
    const reference = `pod_ship_${group.purchaseGroupId.slice(0, 8)}_${Date.now()}`
    await orderRepository.setPaymentRefForGroup(group.purchaseGroupId, reference)

    const FAKE_TLDS = new Set(['test', 'demo', 'local', 'example', 'invalid', 'localhost'])
    const isPaystackEmail = (e: string | null | undefined): e is string => {
      if (!e) return false
      const tld = e.split('.').pop()?.toLowerCase() ?? ''
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && !FAKE_TLDS.has(tld)
    }
    const email = isPaystackEmail(user.email) ? user.email : `user_${user.id}@checkout.marketx.africa`
    const ps = await paystack.initializeTransaction({
      email,
      amount: group.shippingTotal || body.shippingCost, // shipping fee only — kobo
      reference,
      currency: 'NGN',
      metadata: {
        purchaseGroupId: group.purchaseGroupId,
        userId: user.id,
        type: 'pod_shipping',
      },
      callback_url: body.callback_url,
    })

    // 5. Record the POD lifecycle per order (freight deposit PENDING). The
    //    platform fee is deliberately NOT debited here — `initializeTransaction`
    //    only opens the checkout, the buyer hasn't paid yet. The debit moves to
    //    pod-verify (after the deposit is confirmed), so abandoned POD checkouts
    //    never charge the seller.
    await Promise.all(
      group.orders.map((ord) => {
        const freight = podService.splitFreight(ord.shippingCost ?? 0)
        return prisma.podDelivery.create({
          data: {
            orderId: ord.id,
            provider: podProvider.id,
            state: 'DEPOSIT_PENDING',
            freightDepositMinor: freight.depositMinor,
            freightTaxMinor: freight.taxMinor,
            codAmountMinor: ord.totalAmount,
          },
        })
      }),
    )

    return {
      success: true,
      data: {
        purchaseGroupId: group.purchaseGroupId,
        orderIds: group.orders.map((o) => o.id),
        reference,
        authorizationUrl: ps.data.authorization_url,
        accessCode: ps.data.access_code,
        shippingCost: group.shippingTotal || body.shippingCost,
        productAmount: group.itemsTotal,
      },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[POST /api/commerce/payments/pod-initialize]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'POD initialization failed' })
  }
})
