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

  // ── Buyer requests / seller offers ────────────────────────────────────────────

  async getRequests(
    slug: string,
    params: { status?: string; limit?: number; offset?: number },
  ): Promise<any> {
    return this.request(`/api/squares/${slug}/requests`, {
      method: 'GET',
      params: params as any,
    })
  }

  async createRequest(slug: string, body: Record<string, unknown>): Promise<any> {
    return this.request(`/api/squares/${slug}/requests`, { method: 'POST', body })
  }

  async getRequest(slug: string, requestId: string): Promise<any> {
    return this.request(`/api/squares/${slug}/requests/${requestId}`, { method: 'GET' })
  }

  async closeRequest(slug: string, requestId: string): Promise<any> {
    return this.request(`/api/squares/${slug}/requests/${requestId}`, {
      method: 'DELETE',
    })
  }

  async createOffer(
    slug: string,
    requestId: string,
    body: { productId: number; variantId?: number | null; message?: string | null },
  ): Promise<any> {
    return this.request(`/api/squares/${slug}/requests/${requestId}/offers`, {
      method: 'POST',
      body,
    })
  }

  async actOnOffer(
    slug: string,
    requestId: string,
    offerId: string,
    action: 'ACCEPT' | 'DECLINE',
  ): Promise<any> {
    return this.request(
      `/api/squares/${slug}/requests/${requestId}/offers/${offerId}`,
      { method: 'PATCH', body: { action } },
    )
  }

  // ── Follow ───────────────────────────────────────────────────────────────────

  /** IDs of squares the current user follows — used to seed browse-list follow state. */
  async getFollowedSquareIds(): Promise<{ success: boolean; data: string[] }> {
    return this.request('/api/squares/following', { method: 'GET' })
  }

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

  // ── Admin: members ───────────────────────────────────────────────────────────

  async getMembers(
    slug: string,
    params: {
      status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
      limit?: number
      offset?: number
    },
  ): Promise<any> {
    return this.request(`/api/squares/${slug}/members`, {
      method: 'GET',
      params: params as any,
    })
  }

  async actOnMember(
    slug: string,
    sellerId: string,
    action: 'APPROVE' | 'REJECT' | 'SUSPEND',
    reason?: string,
  ): Promise<any> {
    return this.request(`/api/squares/${slug}/members/${sellerId}`, {
      method: 'PATCH',
      body: { action, reason },
    })
  }

  // ── Admin: officers ──────────────────────────────────────────────────────────

  async getOfficers(slug: string): Promise<any> {
    return this.request(`/api/squares/${slug}/officers`, { method: 'GET' })
  }

  async appointOfficer(
    slug: string,
    data: { profileId: string; role: 'CHAIRMAN' | 'SECRETARY' | 'TREASURER' | 'MODERATOR' | 'GOVT_REP' },
  ): Promise<any> {
    return this.request(`/api/squares/${slug}/officers`, { method: 'POST', body: data })
  }

  async removeOfficer(slug: string, profileId: string): Promise<any> {
    return this.request(`/api/squares/${slug}/officers/${profileId}`, { method: 'DELETE' })
  }

  // ── Admin: settings ──────────────────────────────────────────────────────────

  async updateSquare(slug: string, data: Record<string, unknown>): Promise<any> {
    return this.request(`/api/squares/${slug}`, { method: 'PATCH', body: data })
  }
}

// Singleton composable — mirrors the pattern used by useSellerApi()
export const useSquareApi = () => new SquareApiClient()
