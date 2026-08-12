import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export interface FacebookImportPost {
  id: string
  message: string | null
  createdTime: string
  permalinkUrl: string | null
  images: string[]
}

export interface FacebookImportedMedia {
  url: string
  public_id: string
  type: 'IMAGE'
}

export class FacebookImportApiClient extends BaseApiClient {
  /** Lists the connected Page's recent photo posts, newest first. */
  async listPosts(): Promise<{ success: boolean; data: FacebookImportPost[] }> {
    return this.request('/api/growth/facebook/posts', {
      method: 'GET',
    }) as Promise<{ success: boolean; data: FacebookImportPost[] }>
  }

  /** Re-uploads one post's images to Cloudinary; returns StagedMedia-shaped results. */
  async importImages(
    images: string[],
  ): Promise<{ success: boolean; data: { media: FacebookImportedMedia[] } }> {
    return this.request('/api/growth/facebook/import', {
      method: 'POST',
      body: { images },
    }) as Promise<{ success: boolean; data: { media: FacebookImportedMedia[] } }>
  }
}

let instance: FacebookImportApiClient | null = null
export const useFacebookImportApi = () => {
  if (!instance) instance = new FacebookImportApiClient()
  return instance
}
