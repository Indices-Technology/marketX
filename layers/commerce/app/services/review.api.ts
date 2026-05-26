import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export class ReviewApiClient extends BaseApiClient {
  // ── Product reviews ───────────────────────────────────────────────────────

  async getProductReviews(
    productId: string | number,
    limit = 10,
    offset = 0,
  ): Promise<any> {
    return this.request(
      `/api/products/${productId}/reviews?limit=${limit}&offset=${offset}`,
      { method: 'GET', skipAuth: true },
    )
  }

  async getProductReviewEligibility(productId: string | number): Promise<any> {
    return this.request(`/api/products/${productId}/reviews/eligibility`, {
      method: 'GET',
    })
  }

  async submitProductReview(
    productId: string | number,
    data: { rating: number; body?: string },
  ): Promise<any> {
    return this.request(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: data,
    })
  }

  // ── Seller reviews ────────────────────────────────────────────────────────

  async getSellerReviews(
    storeSlug: string,
    limit = 10,
    offset = 0,
  ): Promise<any> {
    return this.request(
      `/api/seller/${storeSlug}/reviews?limit=${limit}&offset=${offset}`,
      { method: 'GET', skipAuth: true },
    )
  }

  async getSellerReviewEligibility(storeSlug: string): Promise<any> {
    return this.request(`/api/seller/${storeSlug}/reviews/eligibility`, {
      method: 'GET',
    })
  }

  async submitSellerReview(
    storeSlug: string,
    data: { rating: number; title?: string; body?: string },
  ): Promise<any> {
    return this.request(`/api/seller/${storeSlug}/reviews`, {
      method: 'POST',
      body: data,
    })
  }
}

let instance: ReviewApiClient | null = null
export const useReviewApi = () => {
  if (!instance) instance = new ReviewApiClient()
  return instance
}
