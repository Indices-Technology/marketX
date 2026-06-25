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
import { notificationQueue } from '~~/server/queues/notification.queue'

const schema = z.object({
  items: z
    .array(z.object({ variantId: z.number(), quantity: z.number().positive() }))
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
      }),
    )
    .optional(),
  callback_url: z.string().url().optional(),
  affiliateCode: z.string().optional(),
})

/** Notify each unique seller of a new POD order */
async function notifySellersPOD(orderId: number, buyerName: string, totalAmount: number) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      variant: {
        include: {
          product: {
            include: { seller: { select: { profileId: true, store_name: true } } },
          },
        },
      },
    },
  })

  const seen = new Set<string>()
  for (const item of items) {
    const sellerId = item.variant?.product?.seller?.profileId
    if (!sellerId || seen.has(sellerId)) continue
    seen.add(sellerId)

    const amountNGN = (totalAmount / 100).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    })

    notificationQueue.enqueue({
      userId: sellerId,
      type: 'ORDER',
      actorId: sellerId,
      orderId,
      message: `📦 New Pay-on-Delivery order #${orderId} from ${buyerName} · ${amountNGN} to collect on delivery. Shipping fee secured.`,
    })
  }
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = schema.parse(await readBody(event))
    const ipAddress = getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // 1. Verify seller supports POD for this zone
    // Derive state from shippingZone (format "State · Zone" or just "State")
    const buyerState = body.shippingZone?.split('·')[0]?.trim() || body.county || ''

    if (buyerState) {
      // Find sellers for items in this order and check POD eligibility
      const variantIds = body.items.map((i) => i.variantId)
      const sellers = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          product: {
            select: {
              seller: {
                select: { pod_enabled: true, pod_zones: true },
              },
            },
          },
        },
      })

      const anySellerDisablesPOD = sellers.some((v) => {
        const s = v.product?.seller
        if (!s?.pod_enabled) return true
        if (!s.pod_zones) return false // no zone restriction = all zones allowed
        const zones = s.pod_zones as string[]
        return !zones.some((z) => buyerState.toLowerCase().includes(z.toLowerCase()))
      })

      if (anySellerDisablesPOD) {
        throw new UserError(
          'POD_NOT_AVAILABLE',
          'Pay on Delivery is not available for your location or one of the sellers in your cart.',
          400,
        )
      }
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
    const email = isPaystackEmail(user.email) ? user.email : `user_${user.id}@checkout.marketx.app`
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

    // 5. Paystack confirmed — now debit platform fees atomically (per seller)
    await prisma.$transaction(async (tx) => {
      for (const [sellerId, { orderId, fee }] of sellerFees) {
        const wallet = await tx.sellerWallet.findUniqueOrThrow({ where: { sellerId } })
        await tx.sellerWallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: fee } },
        })
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: fee,
            type: 'PLATFORM_FEE_DEBIT',
            description: `POD platform fee (${PLATFORM_FEE_PERCENT}%) — Order #${orderId}`,
            orderId,
          },
        })
      }
    })

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
