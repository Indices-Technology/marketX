import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export interface GrowthAssetDTO {
  id: string
  productId: number | null
  status: string
  cardImageUrl: string
  canonicalUrl: string
  trackedUrl: string
}

export interface EmbedAssetDTO extends GrowthAssetDTO {
  slug: string
  shortCode: string
}

export interface TikTokCreatorInfoDTO {
  nickname?: string
  username?: string
  avatarUrl?: string
  privacyOptions: string[]
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
}

export class GrowthAssetApiClient extends BaseApiClient {
  /** Get-or-create the Growth Asset for a product; returns its tracked CARD link. */
  async fromProduct(productId: number) {
    return this.request('/api/growth/assets', {
      method: 'POST',
      body: { productId },
    }) as Promise<{ success: boolean; data: GrowthAssetDTO }>
  }

  /**
   * Get-or-create the CALLER's own tracked link for a product they don't own —
   * an affiliate's AFFILIATE link, or any signed-in viewer's ORGANIC_SHARE link.
   */
  async forSharer(productId: number, channel: 'ORGANIC_SHARE' | 'AFFILIATE') {
    return this.request('/api/growth/assets/share', {
      method: 'POST',
      body: { productId, channel },
      silent: true,
    }) as Promise<{ success: boolean; data: GrowthAssetDTO }>
  }

  /** Get-or-create the seller's own EMBED link + iframe-src ingredients for a product they own. */
  async forEmbed(productId: number) {
    return this.request('/api/growth/assets/embed', {
      method: 'POST',
      body: { productId },
    }) as Promise<{ success: boolean; data: EmbedAssetDTO }>
  }

  /** Attach the rendered+uploaded card image to the asset. */
  async attachCard(id: string, cardImageUrl: string, cardPublicId: string) {
    return this.request(`/api/growth/assets/${id}`, {
      method: 'PATCH',
      body: { cardImageUrl, cardPublicId },
    }) as Promise<{ success: boolean }>
  }

  /** Connected TikTok creator info (nickname + allowed privacy levels). */
  async tiktokCreatorInfo() {
    return this.request('/api/growth/tiktok/creator-info', {
      method: 'GET',
      silent: true,
    }) as Promise<{ success: boolean; data: TikTokCreatorInfoDTO }>
  }

  /** Direct-post the asset's card to the connected TikTok. */
  async postToTikTok(
    id: string,
    opts: { privacyLevel?: string; caption?: string } = {},
  ) {
    return this.request(`/api/growth/assets/${id}/post/tiktok`, {
      method: 'POST',
      body: opts,
    }) as Promise<{
      success: boolean
      data: { publishId: string; trackedUrl: string; privacyLevel: string }
    }>
  }
}

let instance: GrowthAssetApiClient | null = null
export const useGrowthAssetApi = () => {
  if (!instance) instance = new GrowthAssetApiClient()
  return instance
}
