import { BaseApiClient } from '~~/layers/core/app/services/base.api'

/**
 * Square API Client
 * All Square-related HTTP calls for the client side.
 * Extends BaseApiClient to inherit auth headers, CSRF, token refresh, and error handling.
 */
export class SquareApiClient extends BaseApiClient {
  // ── Browse ──────────────────────────────────────────────────────────────────

  async listSquares(params?: {
    type?: 'GEOGRAPHIC' | 'CATEGORY'
    city?: string
    state?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<any> {
    return this.request('/api/squares', { method: 'GET', params: params as any })
  }

  async getSquare(slug: string): Promise<any> {
    return this.request(`/api/squares/${slug}`, { method: 'GET' })
  }

  // ── Feed ────────────────────────────────────────────────────────────────────

  async getSquareFeed(
    slug: string,
    params: { limit: number; offset: number; type: string },
  ): Promise<any> {
    return this.request(`/api/feed/squares/${slug}`, {
      method: 'GET',
      params: params as any,
    })
  }

  // ── Sellers tab ─────────────────────────────────────────────────────────────

  async getSquareSellers(
    slug: string,
    params: { limit: number; offset: number },
  ): Promise<any> {
    return this.request(`/api/squares/${slug}/sellers`, {
      method: 'GET',
      params: params as any,
    })
  }

  // ── Announcements ────────────────────────────────────────────────────────────

  async getAnnouncements(
    slug: string,
    params: { limit: number; offset: number },
  ): Promise<any> {
    return this.request(`/api/squares/${slug}/announcements`, {
      method: 'GET',
      params: params as any,
    })
  }

  async postAnnouncement(
    slug: string,
    body: { title: string; body: string; isPinned?: boolean },
  ): Promise<any> {
    return this.request(`/api/squares/${slug}/announcements`, {
      method: 'POST',
      body,
    })
  }

  // ── Follow ───────────────────────────────────────────────────────────────────

  async followSquare(slug: string): Promise<any> {
    return this.request(`/api/squares/${slug}/follow`, { method: 'POST' })
  }

  async unfollowSquare(slug: string): Promise<any> {
    return this.request(`/api/squares/${slug}/follow`, { method: 'DELETE' })
  }

  // ── Membership ───────────────────────────────────────────────────────────────

  async joinSquare(slug: string): Promise<any> {
    return this.request(`/api/squares/${slug}/join`, { method: 'POST' })
  }
}

// Singleton composable — mirrors the pattern used by useSellerApi()
export const useSquareApi = () => new SquareApiClient()
