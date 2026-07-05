import { reactive } from 'vue'
import { useProductApi } from '../services/product.api'

/**
 * Shared, session-cached set of the current user's liked product IDs.
 *
 * Used to seed the "already liked" heart state in feeds/reels (the feed itself
 * is cached/public and can't carry a per-user flag). The set is a module-level
 * reactive singleton so every card/reel reacts to the same source of truth.
 *
 * `ensureLoaded()` is idempotent and safe to fire-and-forget — call it AFTER the
 * feed has rendered (ideally on idle) so it never competes with first paint.
 */
const liked = reactive(new Set<number>())
let loaded = false
let inFlight: Promise<void> | null = null

export const useLikedProducts = () => {
  const api = useProductApi()

  const ensureLoaded = (): Promise<void> => {
    if (loaded) return Promise.resolve()
    if (inFlight) return inFlight
    inFlight = api
      .getLikedProductIds()
      .then((res) => {
        for (const id of res?.data ?? []) liked.add(Number(id))
        loaded = true
      })
      .catch(() => {
        // Not signed in / request failed — leave empty and don't retry-loop.
        loaded = true
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }

  const isLiked = (id: number) => liked.has(id)
  const markLiked = (id: number) => liked.add(id)
  const markUnliked = (id: number) => liked.delete(id)

  // Clear on logout so the next user doesn't inherit this session's liked state.
  const reset = () => {
    liked.clear()
    loaded = false
    inFlight = null
  }

  return { ensureLoaded, isLiked, markLiked, markUnliked, reset }
}
