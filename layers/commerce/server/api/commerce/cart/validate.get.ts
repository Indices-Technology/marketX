// GET /api/commerce/cart/validate
// Checks every cart item for staleness: price changes, low stock, unavailability.
// Called when the cart sidebar opens — no writes, pure read.
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

type ItemStatus = 'ok' | 'price_increased' | 'price_decreased' | 'insufficient_stock' | 'unavailable'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    select: {
      variantId: true,
      quantity: true,
      priceAtAdd: true,
      variant: {
        select: {
          id: true,
          stock: true,
          price: true,
          product: {
            select: {
              id: true,
              price: true,
              discount: true,
              status: true,
            },
          },
        },
      },
    },
  })

  const results = cartItems.map((item) => {
    const variant = item.variant
    const product = variant?.product

    // Product or variant gone / archived
    if (!variant || !product || product.status !== 'PUBLISHED') {
      return { variantId: item.variantId, status: 'unavailable' as ItemStatus }
    }

    // Current effective unit price
    const basePrice = variant.price ?? product.price
    const discount = product.discount ?? 0
    const currentPrice = Math.round(basePrice * (1 - discount / 100))

    // Stock check
    if (variant.stock < item.quantity) {
      return {
        variantId: item.variantId,
        status: 'insufficient_stock' as ItemStatus,
        requested: item.quantity,
        available: variant.stock,
        currentPrice,
      }
    }

    // Price change detection (only if priceAtAdd was recorded)
    if (item.priceAtAdd !== null && item.priceAtAdd !== undefined) {
      const diff = currentPrice - item.priceAtAdd
      if (diff > 0) {
        return {
          variantId: item.variantId,
          status: 'price_increased' as ItemStatus,
          priceAtAdd: item.priceAtAdd,
          currentPrice,
          diff,
        }
      }
      if (diff < 0) {
        return {
          variantId: item.variantId,
          status: 'price_decreased' as ItemStatus,
          priceAtAdd: item.priceAtAdd,
          currentPrice,
          diff,
        }
      }
    }

    return { variantId: item.variantId, status: 'ok' as ItemStatus, currentPrice }
  })

  const hasIssues = results.some((r) => r.status !== 'ok' && r.status !== 'price_decreased')

  return { success: true, data: { items: results, hasIssues } }
})
