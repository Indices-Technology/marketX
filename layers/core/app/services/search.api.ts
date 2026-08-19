import { BaseApiClient } from './base.api'
import type { User } from '../types/user'
import type { Product } from '~~/shared/types/product'
import type { Post } from '~~/shared/types/post'
import type { Tag } from '~~/shared/types/tag'

/** A store hit as /api/search returns it — not a User, which is what this was typed as. */
export interface StoreSearchHit {
  id: string
  publicId?: string | null
  store_name?: string | null
  store_slug: string
  store_description?: string | null
  store_logo?: string | null
  is_verified?: boolean | null
  cac_verified?: boolean | null
}

export class SearchApiClient extends BaseApiClient {
  // FIXED: Added 'stores' to the acceptable types
  async search(
    query: string,
    type: 'all' | 'users' | 'products' | 'posts' | 'stores' = 'all',
    limit = 10,
    offset = 0,
  ): Promise<{
    success: boolean
    data: {
      users: User[]
      products: Product[]
      posts: Post[]
      stores: StoreSearchHit[]
      tags: Tag[]
    }
  }> {
    const params = new URLSearchParams({
      q: query,
      type,
      limit: String(limit),
      offset: String(offset),
    })
    return this.request(`/api/search?${params.toString()}`, { method: 'GET' })
  }

  async searchMentions(q: string): Promise<any> {
    return this.request(`/api/mentions/search?q=${encodeURIComponent(q)}`, {
      method: 'GET',
      skipAuth: true,
    })
  }
}

let instance: SearchApiClient | null = null
export const useSearchApi = () => {
  if (!instance) instance = new SearchApiClient()
  return instance
}
