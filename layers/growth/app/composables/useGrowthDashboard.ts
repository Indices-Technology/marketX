/**
 * useGrowthDashboard — the Growth tab's data: a seller's assets + rollup funnel.
 * Component → composable → BaseApiClient (data-layer rule).
 */

import {
  useGrowthAssetApi,
  type GrowthDashboardDTO,
} from '~~/layers/growth/app/services/growthAsset.api'

export function useGrowthDashboard() {
  const api = useGrowthAssetApi()
  const data = ref<GrowthDashboardDTO | null>(null)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await api.dashboard()
      data.value = res.data
    } finally {
      loading.value = false
    }
  }

  return { data, loading, load }
}
