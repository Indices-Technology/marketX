import {
  orderRepository,
  type CreateOrderData,
} from '../repositories/order.repository'
import { affiliateRepository } from '../repositories/affiliate.repository'
import { walletService } from './wallet.service'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { auditQueue } from '~~/server/queues/audit.queue'
import { verifyShippingQuote } from '~~/layers/shipping/server/utils/quoteToken'

export interface PlaceOrderInput {
  items: Array<{ variantId: number; quantity: number }>
  name: string
  address: string
  zipcode: string
  county?: string
  /** Destination state (province) — distinct from county (LGA); carrier booking needs it. */
  shipState?: string
  /** Destination contact phone — carrier delivery contact. */
  shipPhone?: string
  country: string
  paymentMethod?: string
  affiliateCode?: string
  /** Total shipping in kobo — fallback when no per-seller breakdown is given. */
  shippingCost?: number
  /** Per-seller shipping selections from checkout — used to split shipping per order. */
  shippingBreakdown?: Array<{
    storeSlug: string
    amount: number // kobo (client-sent — trusted only when the token verifies)
    carrier?: string
    service?: string
    estimatedDays?: string
    /** Signed quote token from /api/shipping/rates — re-derives the amount. */
    token?: string
  }>
}

/** Result of placing an order — one purchase split into one order per seller. */
export interface PlaceOrderResult {
  purchaseGroupId: string
  orders: any[]
  itemsTotal: number // kobo (sum of order.totalAmount)
  shippingTotal: number // kobo (sum of order.shippingCost)
}

export const orderService = {
  async placeOrder(
    userId: string,
    data: PlaceOrderInput,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      items,
      name,
      address,
      zipcode,
      county,
      shipState,
      shipPhone,
      country,
      paymentMethod,
      affiliateCode,
    } = data

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new UserError(
        'INVALID_ORDER',
        'Order must have at least one item',
        400,
      )
    }

    // Resolve affiliate code → profileId (ignore self-referral)
    let affiliateUserId: string | undefined
    if (affiliateCode) {
      const affiliateProfile =
        await affiliateRepository.findByCode(affiliateCode)
      if (affiliateProfile && affiliateProfile.id !== userId) {
        affiliateUserId = affiliateProfile.id
      }
    }

    // ── Pre-validate all variants BEFORE entering the transaction ────────────
    // Fetch every variant + product so we can compute prices and check stock.
    const variantRows = await Promise.all(
      items.map((item) =>
        prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: {
              include: {
                offers: {
                  where: { isActive: true },
                  orderBy: { minQuantity: 'desc' },
                },
                seller: { select: { id: true, profileId: true, store_name: true, store_slug: true } },
              },
            },
          },
        }),
      ),
    )

    let totalAmount = 0
    let totalAffiliateCut = 0
    interface Line {
      variantId: number
      quantity: number
      price: number
      affiliateCut: number
      productId: number
      storeSlug: string
      sellerProfileId: string
      storeName: string
    }
    const lines: Line[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!
      const variant = variantRows[i]
      if (!variant) {
        throw new UserError(
          'VARIANT_NOT_FOUND',
          `Variant ${item.variantId} not found`,
          404,
        )
      }
      if (variant.stock < item.quantity) {
        throw new UserError(
          'INSUFFICIENT_STOCK',
          `Not enough stock for variant ${item.variantId}`,
          400,
        )
      }

      const basePrice = variant.price ?? variant.product.price
      const productDiscount = variant.product.discount ?? 0
      let unitPrice = basePrice * (1 - productDiscount / 100)

      const bestOffer = (variant.product.offers ?? [])
        .filter((o) => o.isActive && item.quantity >= o.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity)[0]
      if (bestOffer) {
        unitPrice = unitPrice * (1 - bestOffer.discount / 100)
      }

      const lineTotalKobo = Math.round(unitPrice * item.quantity * 100)
      totalAmount += lineTotalKobo

      let itemAffiliateCut = 0
      if (affiliateUserId && variant.product.affiliateCommission) {
        itemAffiliateCut = Math.round(variant.product.affiliateCommission * item.quantity * 100)
        totalAffiliateCut += itemAffiliateCut
      }

      const seller = variant.product.seller
      lines.push({
        variantId: item.variantId,
        quantity: item.quantity,
        price: lineTotalKobo,
        affiliateCut: itemAffiliateCut,
        productId: variant.product.id,
        storeSlug: seller?.store_slug || `seller-${seller?.id ?? 'unknown'}`,
        sellerProfileId: seller?.profileId || '',
        storeName: seller?.store_name || 'Your Store',
      })
    }

    // ── Group lines by seller — one order per seller ──────────────────────────
    const groups = new Map<string, Line[]>()
    for (const ln of lines) {
      const arr = groups.get(ln.storeSlug) ?? []
      arr.push(ln)
      groups.set(ln.storeSlug, arr)
    }

    // Per-seller shipping (kobo) from the checkout breakdown. Fallback: assign the
    // single shippingCost to the first group (legacy callers without a breakdown).
    const breakdownMap = new Map<
      string,
      {
        amount: number
        carrier?: string
        service?: string
        estimatedDays?: string
        token?: string
      }
    >()
    for (const b of data.shippingBreakdown ?? []) {
      breakdownMap.set(b.storeSlug, {
        amount: b.amount ?? 0,
        carrier: b.carrier,
        service: b.service,
        estimatedDays: b.estimatedDays,
        token: b.token,
      })
    }
    const hasBreakdown = breakdownMap.size > 0
    const fallbackShipping = data.shippingCost ?? 0

    const purchaseGroupId = crypto.randomUUID()
    const orderInclude = {
      orderItem: {
        include: {
          variant: {
            select: {
              id: true,
              size: true,
              price: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  price: true,
                  seller: {
                    select: { id: true, profileId: true, store_slug: true, store_name: true },
                  },
                  media: {
                    take: 1,
                    where: { isBgMusic: false },
                    select: { id: true, url: true, type: true },
                  },
                },
              },
            },
          },
        },
      },
    } as const

    // ── Atomic transaction: decrement stock + create one order per seller ─────
    let shippingTotal = 0
    const created = await prisma.$transaction(async (tx) => {
      for (const ln of lines) {
        const result = await tx.productVariant.updateMany({
          where: { id: ln.variantId, stock: { gte: ln.quantity } },
          data: { stock: { decrement: ln.quantity } },
        })
        if (result.count === 0) {
          throw new UserError(
            'INSUFFICIENT_STOCK',
            `Stock unavailable for variant ${ln.variantId}`,
            400,
          )
        }
      }

      const out: any[] = []
      let idx = 0
      for (const [storeSlug, groupLines] of groups) {
        const groupTotal = groupLines.reduce((s, l) => s + l.price, 0)
        const groupCut = groupLines.reduce((s, l) => s + l.affiliateCut, 0)
        const bd = breakdownMap.get(storeSlug)
        // Re-derive the shipping charge from the signed quote token so a tampered
        // client amount (e.g. ₦0) can't stick. Fall back to the client amount
        // only when there's no token yet (legacy clients) — logged as unverified.
        let groupShipping: number
        if (hasBreakdown) {
          const claims = verifyShippingQuote(bd?.token)
          if (claims && claims.s === storeSlug) {
            groupShipping = claims.a
          } else {
            groupShipping = bd?.amount ?? 0
            if (bd?.token || groupShipping > 0)
              console.warn(
                '[placeOrder] shipping amount not verified by a quote token',
                { storeSlug, clientAmount: groupShipping },
              )
          }
        } else {
          groupShipping = idx === 0 ? fallbackShipping : 0
        }
        shippingTotal += groupShipping
        const shippingZone = bd?.carrier
          ? `${bd.carrier} ${bd.service ?? ''}`.trim()
          : undefined

        const ord = await tx.orders.create({
          data: {
            userId,
            stripeId: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            purchaseGroupId,
            name,
            address,
            zipcode,
            county: county || '',
            ...(shipState ? { shipState } : {}),
            ...(shipPhone ? { shipPhone } : {}),
            country,
            totalAmount: groupTotal,
            shippingCost: groupShipping,
            ...(shippingZone ? { shippingZone } : {}),
            ...(bd?.estimatedDays ? { estimatedDays: bd.estimatedDays } : {}),
            ...(bd ? { shippingBreakdown: bd as unknown as object } : {}),
            paymentMethod: paymentMethod || 'card',
            ...(affiliateUserId ? { affiliateUserId } : {}),
            ...(groupCut ? { affiliateCut: groupCut } : {}),
            orderItem: {
              create: groupLines.map((l) => ({
                variantId: l.variantId,
                quantity: l.quantity,
                price: l.price,
                affiliateCut: l.affiliateCut,
              })),
            },
          },
          include: orderInclude,
        })
        out.push(ord)
        idx++
      }
      return out
    })

    // NOTE: the cart is intentionally NOT cleared here. placeOrder runs at
    // payment *initialization* (before the buyer completes payment), so clearing
    // now would empty the cart even when the payment is abandoned or fails. The
    // cart is cleared only once the order is actually confirmed — at the payment
    // confirmation points (payments verify / webhook / paypal capture / pod-verify).

    // NOTE: sale analytics are NOT tracked here. placeOrder runs at payment
    // initialization, so tracking now would count abandoned/failed payments as
    // revenue. Sales are recorded at the confirmation points (payments verify /
    // webhook / paypal capture / pod-verify) via analyticsService.trackOrderSale.

    // Audit each placed order. Seller-facing effects (new-order notification and
    // email) intentionally do NOT fire here — placeOrder runs at payment
    // *initialization*, before the buyer has paid. Alerting sellers now (and
    // counting the order in their dashboard) would react to checkouts that are
    // later abandoned or fail. The seller is notified once payment is confirmed,
    // at the confirmation points (payments verify / webhook / paypal capture /
    // pod-verify), each of which notifies the seller idempotently.
    created.forEach((ord) => {
      auditQueue.enqueue({
        userId,
        action: 'ORDER_PLACED',
        resource: 'Orders',
        resourceId: String(ord.id),
        reason: 'Placed new order',
        changes: { totalAmount: ord.totalAmount, purchaseGroupId },
        ipAddress,
        userAgent,
      })
    })

    return {
      purchaseGroupId,
      orders: created,
      itemsTotal: totalAmount,
      shippingTotal,
    } satisfies PlaceOrderResult
  },

  async getUserOrders(userId: string, limit = 20, offset = 0) {
    const [orders, total] = await Promise.all([
      orderRepository.getUserOrders(userId, limit, offset),
      orderRepository.countUserOrders(userId),
    ])
    return { orders, total, limit, offset }
  },

  async getOrderById(id: number, userId: string) {
    const order = await orderRepository.getOrderById(id)
    if (!order) throw new UserError('ORDER_NOT_FOUND', 'Order not found', 404)
    if (order.userId !== userId)
      throw new UserError('FORBIDDEN', 'Access denied', 403)
    return order
  },

  async cancelOrder(
    id: number,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const order = await orderRepository.getOrderById(id)
    if (!order) throw new UserError('ORDER_NOT_FOUND', 'Order not found', 404)
    if (order.userId !== userId)
      throw new UserError('FORBIDDEN', 'Access denied', 403)
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new UserError(
        'CANNOT_CANCEL',
        'Order cannot be cancelled at this stage',
        400,
      )
    }

    // Atomic transition + stock restore in one transaction. The conditional
    // updateMany means a concurrent expiry-cron cancel (or a double request) that
    // already moved the order out of PENDING/CONFIRMED matches zero rows and this
    // caller bails — so stock is never restored twice.
    const didCancel = await prisma.$transaction(async (tx) => {
      const { count } = await tx.orders.updateMany({
        where: { id, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { status: 'CANCELLED' },
      })
      if (count === 0) return false
      const items = await tx.orderItem.findMany({
        where: { orderId: id },
        select: { variantId: true, quantity: true },
      })
      await Promise.all(
        items
          .filter((i) => i.variantId != null)
          .map((i) =>
            tx.productVariant.update({
              where: { id: i.variantId! },
              data: { stock: { increment: i.quantity } },
            }),
          ),
      )
      return true
    })

    if (!didCancel) {
      throw new UserError(
        'CANNOT_CANCEL',
        'Order cannot be cancelled at this stage',
        400,
      )
    }

    // If the order was already paid, reverse any pending seller credit so the
    // seller's pending_balance stays accurate. A Paystack refund to the buyer
    // must be issued separately (manual or via admin tooling).
    if (order.paymentStatus === 'PAID') {
      walletService.reverseOrderCredit(id).catch((e) =>
        logger.logError('[cancelOrder wallet reverse]', e),
      )
    }

    auditQueue.enqueue({
      userId,
      action: 'ORDER_CANCELLED',
      resource: 'Orders',
      resourceId: String(id),
      reason: 'Order cancelled by user',
      ipAddress,
      userAgent,
    })

    return orderRepository.getOrderById(id)
  },
}
