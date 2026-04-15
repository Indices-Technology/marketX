import { BaseApiClient } from './base.api'

export interface IAiListingResult {
  title: string
  description: string
  suggestedPrice?: number
  socialCaptions: {
    instagram: string
    facebook: string
    pinterest: string
  }
}

export class AiApiClient extends BaseApiClient {
  async generateListing(
    imageBase64: string,
    mimeType: string,
    optionalHint = '',
  ): Promise<{ success: boolean; data: IAiListingResult }> {
    return this.request('/api/ai/generate-listing', {
      method: 'POST',
      body: { imageBase64, mimeType, optionalHint },
      silent: true, // caller shows context-specific AI error messages
    }) as Promise<{ success: boolean; data: IAiListingResult }>
  }

  async enhanceDescription(
    description: string,
  ): Promise<{ success: boolean; html: string }> {
    return this.request('/api/ai/enhance-description', {
      method: 'POST',
      body: { description },
      silent: true,
    }) as Promise<{ success: boolean; html: string }>
  }
}

let instance: AiApiClient | null = null
export const useAiApi = () => {
  if (!instance) instance = new AiApiClient()
  return instance
}
