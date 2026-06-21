import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export class MapApiClient extends BaseApiClient {
  async getSellers(params: {
    lat: number
    lng: number
    radius?: number
    limit?: number
    offset?: number
    filter?: string
    search?: string
    category?: string
  }): Promise<any> {
    return this.request('/api/map/sellers', {
      method: 'GET',
      params: params as any,
      skipAuth: true,
    })
  }

  async getSellerPreview(
    storeSlug: string,
    lat?: number,
    lng?: number,
  ): Promise<any> {
    const params: Record<string, unknown> = {}
    if (lat !== undefined) params.lat = lat
    if (lng !== undefined) params.lng = lng
    return this.request(`/api/map/sellers/${storeSlug}/preview`, {
      method: 'GET',
      params: params as any,
      skipAuth: true,
    })
  }

  async getCategories(): Promise<any> {
    return this.request('/api/commerce/categories', {
      method: 'GET',
      skipAuth: true,
    })
  }

  /** Squares plotted on the map. */
  async getSquares(): Promise<any> {
    return this.request('/api/map/squares', { method: 'GET', skipAuth: true })
  }
}

let instance: MapApiClient | null = null
export const useMapApi = () => {
  if (!instance) instance = new MapApiClient()
  return instance
}
