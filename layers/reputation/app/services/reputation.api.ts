import { BaseApiClient } from '~~/layers/core/app/services/base.api'
import type { VerifyResult } from '~~/layers/reputation/app/types/trust.types'

/** Client for the reputation surfaces (spotlight rail + profile trust tab). */
class ReputationApiClient extends BaseApiClient {
  /** Top sellers for the home rail, ranked by real completed-sale evidence. */
  async getSpotlight(limit = 8): Promise<unknown> {
    return this.request('/api/reputation/spotlight', {
      method: 'GET',
      params: { limit },
      skipAuth: true,
    })
  }

  /** Full trust view for one seller (profile Trust tab). */
  async getProfile(slug: string): Promise<unknown> {
    return this.request(`/api/reputation/profile/${slug}`, {
      method: 'GET',
      skipAuth: true,
    })
  }

  /** Tier for a batch of stores, keyed by slug (compact surfaces). */
  async getTiers(slugs: string[]): Promise<unknown> {
    return this.request('/api/reputation/tiers', {
      method: 'GET',
      params: { slugs: slugs.join(',') },
      skipAuth: true,
    })
  }

  /**
   * Check a pasted identifier (MarketX link, Seller ID, phone, or @handle) →
   * one of: verified | unverified | unknown. Powers the Verify door. Guest-safe.
   */
  async verify(
    q: string,
    opts: { silent?: boolean } = {},
  ): Promise<{ success: boolean; data: VerifyResult }> {
    return this.request('/api/reputation/verify', {
      method: 'GET',
      params: { q },
      skipAuth: true,
      // Typeahead callers pass silent: a transient failure while the buyer is
      // still typing shouldn't raise a global toast.
      silent: opts.silent,
    })
  }

  /** Log a Trust Card QR scan (funnel top). Fire-and-forget. */
  async logScan(payload: {
    slug: string
    surface?: string
    orderId?: number
  }): Promise<unknown> {
    return this.request('/api/reputation/scan', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    })
  }

  /** The seller's own Trust Card funnel metrics (owner-gated). */
  async getScanStats(slug: string): Promise<unknown> {
    return this.request('/api/reputation/scan-stats', {
      method: 'GET',
      params: { slug },
    })
  }
}

export const useReputationApi = () => new ReputationApiClient()
