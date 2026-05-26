import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export type WallType = 'USER' | 'STORE'
export type WallFilter = 'all' | 'posts' | 'shoutouts'

export interface IWallPost {
  id: string
  type: 'POST' | 'SHOUTOUT'
  caption: string | null
  content: string | null
  contentType: string | null
  created_at: string
  viewerLiked: boolean
  wallTargetType: string | null
  wallTargetSlug: string | null
  author: { id: string; username: string; avatar: string | null; role: string }
  media: { id: string; url: string; type: string; altText: string | null }[]
  _count: { likes: number; comments: number }
}

export interface IWallMeta {
  total: number
  hasMore: boolean
  limit: number
  offset: number
}

class WallApiClient extends BaseApiClient {
  async getWall(
    type: WallType,
    slug: string,
    opts: { filter?: WallFilter; limit?: number; offset?: number } = {},
  ): Promise<{ data: IWallPost[]; meta: IWallMeta }> {
    return this.request(`/api/wall/${type.toLowerCase()}/${slug}`, {
      method: 'GET',
      params: {
        filter: opts.filter ?? 'all',
        limit: opts.limit ?? 20,
        offset: opts.offset ?? 0,
      } as any,
      skipAuth: true,
    })
  }

  async postShoutout(
    type: WallType,
    slug: string,
    body: string,
  ): Promise<{ data: IWallPost }> {
    return this.request(`/api/wall/${type.toLowerCase()}/${slug}`, {
      method: 'POST',
      body: { body },
    })
  }

  async deleteShoutout(
    type: WallType,
    slug: string,
    postId: string,
  ): Promise<{ success: boolean }> {
    return this.request(`/api/wall/${type.toLowerCase()}/${slug}/${postId}`, {
      method: 'DELETE',
    })
  }
}

let instance: WallApiClient | null = null
export const useWallApi = () => {
  if (!instance) instance = new WallApiClient()
  return instance
}
