/**
 * useSellerCheck — the "who is this?" lookup, debounced for typeahead use.
 *
 * The search dock runs this while the buyer types an identifier, so the answer
 * lands in the dropdown instead of costing a page change. Wraps the same
 * endpoint the /verify page uses, so the two can't disagree.
 */
import { ref, computed } from 'vue'
import { useReputationApi } from '~~/layers/reputation/app/services/reputation.api'
import type { VerifyResult } from '~~/layers/reputation/app/types/trust.types'
import { sellerIdentifierKind } from '~~/shared/utils/sellerIdentifier'

export function useSellerCheck(debounceMs = 350) {
  const api = useReputationApi()

  const result = ref<VerifyResult | null>(null)
  const loading = ref(false)
  const failed = ref(false)

  let timer: ReturnType<typeof setTimeout> | null = null
  // A slow answer for an earlier query must never overwrite a newer one — at
  // typing speed the responses do not come back in order.
  let seq = 0

  const clear = () => {
    if (timer) clearTimeout(timer)
    seq += 1
    result.value = null
    loading.value = false
    failed.value = false
  }

  const run = async (query: string) => {
    const q = query.trim()
    // Only identifiers get looked up. Ordinary searches are not people, and
    // firing this on every keystroke would hammer a public endpoint.
    if (!sellerIdentifierKind(q)) return clear()

    const mine = ++seq
    loading.value = true
    failed.value = false
    try {
      const res = await api.verify(q, { silent: true })
      if (mine !== seq) return
      if (res?.success && res.data) {
        result.value = res.data
        failed.value = false
      } else {
        result.value = null
        failed.value = true
      }
    } catch {
      if (mine !== seq) return
      // A failed lookup is not an answer. Never fall back to a reassuring
      // state — the dock shows the manual check route instead.
      result.value = null
      failed.value = true
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  /** Debounced entry point — safe to call on every keystroke. */
  const check = (query: string) => {
    if (timer) clearTimeout(timer)
    if (!sellerIdentifierKind(query)) return clear()
    // Drop any in-flight answer for the previous value straight away, so a
    // stale verdict can't sit under a query it doesn't belong to.
    seq += 1
    result.value = null
    loading.value = true
    timer = setTimeout(() => run(query), debounceMs)
  }

  const status = computed(() => result.value?.status ?? null)
  const seller = computed(() => result.value?.seller ?? null)

  const dispose = () => {
    if (timer) clearTimeout(timer)
  }

  return { result, seller, status, loading, failed, check, clear, dispose }
}
