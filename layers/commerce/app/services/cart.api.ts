import { BaseApiClient } from '~~/layers/core/app/services/base.api'
import type { CartValidationItem } from '../types/cart'
import type { GuestCartVariant, ICartItem } from '../types/commerce.types'

export class CartApiClient extends BaseApiClient {
  async getCart() {
    return this.request<{
      success: boolean
      data: { items: ICartItem[]; podAvailable: boolean }
    }>('/api/commerce/cart', { method: 'GET' })
  }

  async addToCart(variantId: number, quantity = 1) {
    return this.request<{ success: boolean; data: ICartItem }>(
      '/api/commerce/cart',
      { method: 'POST', body: { variantId, quantity }, silent: true },
    )
  }

  async updateQuantity(variantId: number, quantity: number) {
    return this.request<{ success: boolean; data: ICartItem }>(
      `/api/commerce/cart/${variantId}`,
      { method: 'PATCH', body: { quantity }, silent: true },
    )
  }

  async removeFromCart(variantId: number) {
    return this.request<{ success: boolean }>(
      `/api/commerce/cart/${variantId}`,
      { method: 'DELETE', silent: true },
    )
  }

  async getVariant(variantId: number) {
    return this.request<{ success: boolean; data: GuestCartVariant }>(
      `/api/commerce/products/variants/${variantId}`,
      { method: 'GET', skipAuth: true, silent: true },
    )
  }

  async validateCart() {
    return this.request<{
      success: boolean
      data: { items: CartValidationItem[]; hasIssues: boolean }
    }>('/api/commerce/cart/validate', { method: 'GET', silent: true })
  }
}

let instance: CartApiClient | null = null
export const useCartApi = () => {
  if (!instance) instance = new CartApiClient()
  return instance
}
