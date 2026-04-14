/**
 * useViewTracker
 *
 * Tracks views for posts, stories and products.
 * - In-memory Set for O(1) dedup (no JSON.parse on every scroll tick)
 * - sessionStorage persists the set across page navigations within the session
 * - Batched queue: pending API calls are flushed together after a 1.5s idle,
 *   so a feed load with 10 visible posts sends one batch instead of 10 simultaneous requests
 */

const SESSION_KEY = 'mx_viewed'

// ── In-memory Set (initialized once from sessionStorage) ──────────────────────
const _viewed: Set<string> = (() => {
  if (typeof sessionStorage === 'undefined') return new Set<string>()
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set<string>()
  }
})()

const _persistViewed = () => {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([..._viewed]))
  } catch {}
}

// ── Batched queue ─────────────────────────────────────────────────────────────
interface QueueEntry { url: string }
const _queue: QueueEntry[] = []
let _flushTimer: ReturnType<typeof setTimeout> | null = null

const _flush = () => {
  _flushTimer = null
  const batch = _queue.splice(0)
  for (const { url } of batch) {
    $fetch(url, { method: 'POST' }).catch(() => {})
  }
}

const _enqueue = (url: string) => {
  _queue.push({ url })
  // Reset the idle timer — flush 1.5s after the last item is enqueued
  if (_flushTimer) clearTimeout(_flushTimer)
  _flushTimer = setTimeout(_flush, 1500)
}

// ── Public composable ─────────────────────────────────────────────────────────
export const useViewTracker = () => {
  const trackPost = (id: string) => {
    const key = `post:${id}`
    if (_viewed.has(key)) return
    _viewed.add(key)
    _persistViewed()
    _enqueue(`/api/posts/${id}/view`)
  }

  const trackStory = (id: string) => {
    const key = `story:${id}`
    if (_viewed.has(key)) return
    _viewed.add(key)
    _persistViewed()
    _enqueue(`/api/stories/${id}/view`)
  }

  const trackProduct = (id: number | string) => {
    const key = `product:${id}`
    if (_viewed.has(key)) return
    _viewed.add(key)
    _persistViewed()
    _enqueue(`/api/products/${id}/view`)
  }

  return { trackPost, trackStory, trackProduct }
}
