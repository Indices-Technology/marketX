import { ref } from 'vue'
import { useState } from '#imports'
import { useReputationApi } from '~~/layers/reputation/app/services/reputation.api'
import type { TrustSpotlightSeller } from '~~/layers/reputation/app/types/trust.types'

/**
 * Data source for the Trust Spotlight rail (framework §5.4). Reads REAL trust
 * facts from `/api/reputation/spotlight` — completed sales, delivery rate,
 * dispute rate, reviews and tenure aggregated from existing orders/reviews.
 * Only sellers past the minimum-evidence threshold come back, so the rail is
 * honest: sparse or empty is a true state, never filled with placeholders.
 */
export function useTrustSpotlight() {
  // Cache across the auth-swap (MarketHome ⇄ SocialFeed both mount the rail).
  const sellers = useState<TrustSpotlightSeller[]>('trust-spotlight', () => [])
  const loading = ref(false)
  let loaded = false

  const load = async () => {
    if (loaded || loading.value || sellers.value.length) return
    loading.value = true
    try {
      const res = await useReputationApi().getSpotlight(8)
      sellers.value = (res as { data?: TrustSpotlightSeller[] }).data ?? []
      loaded = true
    } catch {
      // Rail hides itself on failure — no dead header (see TrustSpotlightRail).
    } finally {
      loading.value = false
    }
  }

  return { sellers, loading, load }
}
