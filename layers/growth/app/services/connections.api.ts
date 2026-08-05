import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export type SocialPlatform = 'TIKTOK' | 'META_FB' | 'META_IG' | 'GOOGLE_GBP'
export type SocialConnectionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ERROR'

/** Safe, UI-facing shape — the API never returns tokens. */
export interface SocialConnection {
  id: string
  platform: SocialPlatform
  providerUserId: string
  displayName: string | null
  avatarUrl: string | null
  scope: string | null
  status: SocialConnectionStatus
  expiresAt: string | null
  created_at: string
}

export class ConnectionsApiClient extends BaseApiClient {
  async list(): Promise<{ success: boolean; data: SocialConnection[] }> {
    return this.request('/api/growth/connections', { method: 'GET' }) as Promise<{
      success: boolean
      data: SocialConnection[]
    }>
  }

  /** Returns the TikTok authorize URL for the client to navigate to. */
  async startTikTok(
    redirectTo: string,
  ): Promise<{ success: boolean; data: { authorizeUrl: string } }> {
    return this.request(
      `/api/growth/connect/tiktok?redirectTo=${encodeURIComponent(redirectTo)}`,
      { method: 'GET' },
    ) as Promise<{ success: boolean; data: { authorizeUrl: string } }>
  }

  /** Returns the Google Business Profile authorize URL for the client to navigate to. */
  async startGoogleBusiness(
    redirectTo: string,
  ): Promise<{ success: boolean; data: { authorizeUrl: string } }> {
    return this.request(
      `/api/growth/connect/google?redirectTo=${encodeURIComponent(redirectTo)}`,
      { method: 'GET' },
    ) as Promise<{ success: boolean; data: { authorizeUrl: string } }>
  }

  async disconnect(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/growth/connections/${id}`, {
      method: 'DELETE',
    }) as Promise<{ success: boolean }>
  }
}

let instance: ConnectionsApiClient | null = null
export const useConnectionsApi = () => {
  if (!instance) instance = new ConnectionsApiClient()
  return instance
}
