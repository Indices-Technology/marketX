import { BaseApiClient } from '~~/layers/core/app/services/base.api'

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
}

export const useReputationApi = () => new ReputationApiClient()
