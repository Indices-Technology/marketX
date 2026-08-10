import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export type SocialPlatform = 'TIKTOK' | 'META_FB' | 'META_IG' | 'GOOGLE_GBP'
export type SocialConnectionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ERROR'

export interface FacebookPageCandidate {
  pageId: string
  displayName: string | null
  category: string | null
}

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
    return this.request('/api/growth/connections', {
      method: 'GET',
    }) as Promise<{
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

  /** Returns the Facebook Page authorize URL for the client to navigate to. */
  async startFacebook(
    redirectTo: string,
  ): Promise<{ success: boolean; data: { authorizeUrl: string } }> {
    return this.request(
      `/api/growth/connect/facebook?redirectTo=${encodeURIComponent(redirectTo)}`,
      { method: 'GET' },
    ) as Promise<{ success: boolean; data: { authorizeUrl: string } }>
  }

  /** Lists Facebook Pages awaiting a pick — only non-empty when the seller
   *  administers more than one Page (see facebook/callback.get.ts). */
  async getFacebookPageCandidates(): Promise<{
    success: boolean
    data: FacebookPageCandidate[]
  }> {
    return this.request('/api/growth/connect/facebook/pages', {
      method: 'GET',
    }) as Promise<{ success: boolean; data: FacebookPageCandidate[] }>
  }

  /** Finalizes the Facebook Page picker for the chosen pageId. */
  async selectFacebookPage(pageId: string): Promise<{ success: boolean }> {
    return this.request('/api/growth/connect/facebook/select', {
      method: 'POST',
      body: { pageId },
    }) as Promise<{ success: boolean }>
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
