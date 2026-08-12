/**
 * useFacebookImport — loads the seller's connected Facebook Page's recent
 * photo posts for the bulk-import picker. Component → composable →
 * BaseApiClient (data-layer rule), mirrors useConnections's shape.
 */

import {
  useFacebookImportApi,
  type FacebookImportPost,
} from '~~/layers/growth/app/services/facebookImport.api'

export function useFacebookImport() {
  const api = useFacebookImportApi()
  const posts = ref<FacebookImportPost[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const res = await api.listPosts()
      posts.value = res.data
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : 'Failed to load Facebook posts'
    } finally {
      loading.value = false
    }
  }

  return { posts, loading, error, load }
}
