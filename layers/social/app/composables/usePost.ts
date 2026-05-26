import { usePostApi } from '../services/post.api'
import { usePostStore } from '../store/post.store'
import { useProfileStore } from '../../../profile/app/stores/profile.store'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import type { ICreatePostData, IPost } from '../types/post.types'
import type { IFeedItem } from '../../../feed/app/types/feed.types'

/**
 * Normalize an IPost (from profile/user API) into IFeedItem shape.
 * IPost has media as an array; IFeedItem has a single media object.
 * All components that open PostDetailModal must use IFeedItem.
 */
export function normalizePost(post: IPost | any): IFeedItem {
  const mediaArr = Array.isArray(post.media)
    ? post.media
    : post.media
      ? [post.media]
      : []
  const contentMedia = mediaArr.filter((m: any) => !m.isBgMusic)
  const bgMusicRaw = mediaArr.find((m: any) => m.isBgMusic)
  const rawMedia = contentMedia[0] ?? null

  return {
    id: post.id,
    type: 'POST',
    created_at: post.created_at ?? post.createdAt ?? new Date(),
    author: {
      id: post.author?.id ?? post.authorId ?? '',
      username: post.author?.username ?? '',
      avatar: post.author?.avatar ?? null,
      role: ((post.author?.role ?? 'USER') as string).toLowerCase() as
        | 'user'
        | 'seller',
    },
    media: rawMedia
      ? {
          id: rawMedia.id,
          url: rawMedia.url,
          type: rawMedia.type,
          thumbnailUrl: rawMedia.thumbnailUrl,
        }
      : undefined,
    mediaItems: contentMedia.map((m: any) => ({
      id: m.id,
      url: m.url,
      type: m.type,
    })),
    bgMusic: bgMusicRaw
      ? { id: bgMusicRaw.id, url: bgMusicRaw.url }
      : undefined,
    caption: post.caption ?? '',
    content: post.content ?? null,
    contentType: post.contentType ?? 'EXPERIENCE',
    likeCount: post._count?.likes ?? post.likeCount ?? 0,
    commentCount: post._count?.comments ?? post.commentCount ?? 0,
    shareCount: post._count?.shares ?? post.shareCount ?? 0,
    taggedProducts: post.taggedProducts ?? [],
  }
}

export const usePost = () => {
  const postApi = usePostApi()
  const postStore = usePostStore()
  const profileStore = useProfileStore()

  const isLoading = computed(() => postStore.isLoading)
  const error = computed(() => postStore.error)

  const createPost = async (data: ICreatePostData) => {
    postStore.setLoading(true)
    postStore.setError(null)
    try {
      const result = await postApi.createPost(data)
      postStore.addPosts([result])
      profileStore.addMyPost(result)
      return result
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to create post'))
      throw e
    } finally {
      postStore.setLoading(false)
    }
  }

  const fetchUserFeed = async (limit: number = 20, offset: number = 0) => {
    postStore.setLoading(true)
    postStore.setError(null)
    try {
      const result = await postApi.getUserFeed(limit, offset)
      postStore.addPosts(result.data)
      return result
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to fetch feed'))
      throw e
    } finally {
      postStore.setLoading(false)
    }
  }

  const fetchUserPosts = async (username: string, limit = 9, offset = 0) => {
    postStore.setLoading(true)
    try {
      const result = await postApi.getUserPosts(username, limit, offset)
      postStore.addPosts(result.data, username)
      return result
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to fetch posts'))
      throw e
    } finally {
      postStore.setLoading(false)
    }
  }

  const getPostById = async (id: string) => {
    postStore.setLoading(true)
    postStore.setError(null)
    try {
      const response = await postApi.getPostById(id)
      const result = (response as any)?.data ?? response
      postStore.addPosts([result])
      return result
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Post not found'))
      throw e
    } finally {
      postStore.setLoading(false)
    }
  }

  const likePost = async (id: string) => {
    try {
      postStore.addLikedPost(id)
      await postApi.likePost(id)
      return true
    } catch (e: unknown) {
      postStore.removeLikedPost(id)
      postStore.setError(extractErrorMessage(e, 'Failed to like post'))
      throw e
    }
  }

  const unlikePost = async (id: string) => {
    try {
      postStore.removeLikedPost(id)
      await postApi.unlikePost(id)
      return true
    } catch (e: unknown) {
      postStore.addLikedPost(id)
      postStore.setError(extractErrorMessage(e, 'Failed to unlike post'))
      throw e
    }
  }

  const savePost = async (id: string) => {
    try {
      await postApi.savePost(id)
      postStore.addSavedPosts([{ id }])
      return true
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to save post'))
      throw e
    }
  }

  const fetchSavedPosts = async (limit = 9, offset = 0) => {
    postStore.setLoading(true)
    try {
      const result = await postApi.getSavedPosts(limit, offset)
      postStore.addSavedPosts(result.data)
      return result
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to fetch saved posts'))
    } finally {
      postStore.setLoading(false)
    }
  }

  const unsavePost = async (postId: string) => {
    try {
      await postApi.unsavePost(postId)
      postStore.removeSavedPost(postId)
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to unsave post'))
    }
  }

  const fetchUserLikedPosts = async (
    username: string,
    limit = 20,
    offset = 0,
  ) => {
    postStore.setLoading(true)
    try {
      const result = await postApi.getUserLikedPosts(username, limit, offset)
      postStore.addLikedPostsByUser(result.data, username)
      return result
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to fetch liked posts'))
      throw e
    } finally {
      postStore.setLoading(false)
    }
  }

  const deletePost = async (id: string) => {
    try {
      await postApi.deletePost(id)
      postStore.deletePost(id)
      profileStore.removeMyPost(id)
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to delete post'))
      throw e
    }
  }

  const updatePost = async (
    id: string,
    data: {
      caption?: string
      content?: string
      contentType?: string
      visibility?: string
    },
  ) => {
    try {
      const updated = await postApi.updatePost(id, data)
      postStore.updatePost(id, updated)
      return updated
    } catch (e: unknown) {
      postStore.setError(extractErrorMessage(e, 'Failed to update post'))
      throw e
    }
  }

  return {
    isLoading,
    error,
    normalizePost,
    createPost,
    fetchUserFeed,
    fetchUserPosts,
    getPostById,
    likePost,
    unlikePost,
    savePost,
    fetchSavedPosts,
    unsavePost,
    fetchUserLikedPosts,
    deletePost,
    updatePost,
  }
}
