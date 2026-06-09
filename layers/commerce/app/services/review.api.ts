import { BaseApiClient } from '~~/layers/core/app/services/base.api'

interface ReviewUser {
  id: string
  username: string
  avatar?: string | null
}

interface Review {
  id: string
  rating: number
  body?: string | null
  title?: string | null
  user: ReviewUser
  createdAt: string
}

interface ReviewListResponse {
  success: boolean
  data: { reviews: Review[]; total: number }
}

interface EligibilityResponse {
  success: boolean
  data: { eligible: boolean; reason?: string }
}

interface ReviewSubmitResponse {
  success: boolean
  data: { id: string }
}

export class ReviewApiClient extends BaseApiClient {
  // ── Product reviews ───────────────────────────────────────────────────────

  async getProductReviews(
    productId: string | number,
    limit = 10,
    offset = 0,
  ): Promise<ReviewListResponse> {
    return this.request(
      `/api/products/${productId}/reviews?limit=${limit}&offset=${offset}`,
      { method: 'GET', skipAuth: true },
    )
  }

  async getProductReviewEligibility(
    productId: string | number,
  ): Promise<EligibilityResponse> {
    return this.request(`/api/products/${productId}/reviews/eligibility`, {
      method: 'GET',
    })
  }

  async submitProductReview(
    productId: string | number,
    data: { rating: number; body?: string },
  ): Promise<ReviewSubmitResponse> {
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
  ): Promise<ReviewListResponse> {
    return this.request(
      `/api/seller/${storeSlug}/reviews?limit=${limit}&offset=${offset}`,
      { method: 'GET', skipAuth: true },
    )
  }

  async getSellerReviewEligibility(
    storeSlug: string,
  ): Promise<EligibilityResponse> {
    return this.request(`/api/seller/${storeSlug}/reviews/eligibility`, {
      method: 'GET',
    })
  }

  async submitSellerReview(
    storeSlug: string,
    data: { rating: number; title?: string; body?: string },
  ): Promise<ReviewSubmitResponse> {
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
