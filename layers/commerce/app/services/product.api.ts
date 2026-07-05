import { BaseApiClient } from "~~/layers/core/app/services/base.api"
import type { ProductDetail } from '../types/product'


export class ProductApiClient extends BaseApiClient {
  async getProducts(params?: {
    status?: string
    search?: string
    sellerId?: string
    isThrift?: boolean
    categorySlug?: string
    limit?: number
    offset?: number
  }) {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : ''
    return this.request(`/api/commerce/products${query}`, { method: 'GET' })
  }

  async getProductBySlug(slug: string): Promise<{ success: boolean; data: ProductDetail }> {
    return this.request(`/api/commerce/products/by-slug/${slug}`, {
      method: 'GET',
      skipAuth: true,
      silent: true,
    })
  }

  async getProductById(id: number): Promise<{ success: boolean; data: ProductDetail }> {
    return this.request(`/api/commerce/products/${id}`, { method: 'GET' })
  }

  async createProduct(data: Record<string, unknown>) {
    return this.request('/api/commerce/products', {
      method: 'POST',
      body: data,
    })
  }

  async updateProduct(id: number, data: Record<string, unknown>) {
    return this.request(`/api/commerce/products/${id}`, {
      method: 'PATCH',
      body: data,
    })
  }

  async deleteProduct(id: number) {
    return this.request(`/api/commerce/products/${id}`, { method: 'DELETE' })
  }

  async getSellerProducts(
    storeSlug: string,
    params?: { status?: string; limit?: number; offset?: number },
  ) {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : ''
    return this.request(`/api/seller/${storeSlug}/products${query}`, {
      method: 'GET',
    })
  }

  async likeProduct(id: number) {
    return this.request(`/api/commerce/products/${id}/like`, { method: 'POST' })
  }

  async unlikeProduct(id: number) {
    return this.request(`/api/commerce/products/${id}/like`, {
      method: 'DELETE',
    })
  }

  /** Paginated list of profiles who liked a product. */
  async getProductLikes(
    id: number,
    params: { limit?: number; offset?: number } = {},
  ): Promise<any> {
    const q = new URLSearchParams()
    if (params.limit != null) q.set('limit', String(params.limit))
    if (params.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return this.request(
      `/api/commerce/products/${id}/likes${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    )
  }

  async getLikedProducts(params?: { limit?: number; offset?: number }) {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : ''
    return this.request(`/api/commerce/products/liked${query}`, {
      method: 'GET',
    })
  }

  async getLikedProductIds() {
    return this.request<{ success: boolean; data: number[] }>(
      '/api/commerce/products/liked?idsOnly=true',
      { method: 'GET' },
    )
  }

  async getCategories() {
    return this.request('/api/commerce/categories', {
      method: 'GET',
      skipAuth: true,
    })
  }

  async getProductComments(productId: number) {
    return this.request(`/api/commerce/products/${productId}/comments`, {
      method: 'GET',
      skipAuth: true,
    })
  }

  async createProductComment(
    productId: number,
    text: string,
    parentId?: string,
  ) {
    return this.request(`/api/commerce/products/${productId}/comments`, {
      method: 'POST',
      body: { text, parentId },
    })
  }
}

let instance: ProductApiClient | null = null
export const useProductApi = () => {
  if (!instance) instance = new ProductApiClient()
  return instance
}
