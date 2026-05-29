import type { Product, ProductVariant } from '~~/shared/types/product'

export interface CartItem {
  id: string
  quantity: number
  variant: ProductVariant & {
    product: Product
  }
}

export type CartItemStatus =
  | 'ok'
  | 'price_increased'
  | 'price_decreased'
  | 'insufficient_stock'
  | 'unavailable'

export type CartValidationItem =
  | { variantId: number; status: 'ok'; currentPrice: number }
  | {
      variantId: number
      status: 'price_increased'
      priceAtAdd: number
      currentPrice: number
      diff: number
    }
  | {
      variantId: number
      status: 'price_decreased'
      priceAtAdd: number
      currentPrice: number
      diff: number
    }
  | {
      variantId: number
      status: 'insufficient_stock'
      requested: number
      available: number
      currentPrice: number
    }
  | { variantId: number; status: 'unavailable' }
