import { ref, computed, watch, type Ref } from 'vue'
import { useSellerApi } from '../services/seller.services'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'

export type AnalyticsDays = 7 | 30 | 90

export interface AnalyticsSummary {
  revenue: number
  affiliatePaid: number
  orders: number
  unitsSold: number
  views: number
  impressions: number
}

export interface AnalyticsChartPoint {
  date: string
  revenue: number
  affiliatePaid: number
  orders: number
  unitsSold: number
  views: number
  impressions: number
}

export interface AnalyticsProduct {
  productId: number
  title: string
  slug: string
  thumbnail: string | null
  revenue: number
  affiliatePaid: number
  orders: number
  unitsSold: number
  views: number
  impressions: number
}

export interface AnalyticsData {
  summary: AnalyticsSummary
  chart: AnalyticsChartPoint[]
  topProducts: AnalyticsProduct[]
}

const RANGES: AnalyticsDays[] = [7, 30, 90]

export function useAnalytics(storeSlug: Ref<string>) {
  const api = useSellerApi()

  const data = ref<AnalyticsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const days = ref<AnalyticsDays>(30)

  async function load() {
    if (!storeSlug.value) return
    loading.value = true
    error.value = null
    try {
      const res = await api.getAnalytics(storeSlug.value, days.value)
      data.value = res.data as AnalyticsData
    } catch (e: unknown) {
      error.value = extractErrorMessage(e, 'Failed to load analytics')
    } finally {
      loading.value = false
    }
  }

  function setDays(d: AnalyticsDays) {
    days.value = d
  }

  // Auto-reload when storeSlug or days changes
  watch([storeSlug, days], () => load(), { immediate: true })

  const kpis = computed(() => {
    if (!data.value) return []
    const s = data.value.summary
    const net = s.revenue - s.affiliatePaid
    const conversion = s.views > 0 ? ((s.orders / s.views) * 100).toFixed(1) : '0.0'
    return [
      { label: 'Gross Revenue', value: s.revenue, format: 'currency' as const },
      { label: 'Net Revenue', value: net, format: 'currency' as const, sub: 'after affiliate' },
      { label: 'Orders', value: s.orders, format: 'number' as const, sub: `${s.unitsSold} units` },
      { label: 'Product Views', value: s.views, format: 'number' as const },
      { label: 'Conversion', value: parseFloat(conversion), format: 'percent' as const, sub: 'views → orders' },
    ]
  })

  return { data, loading, error, days, kpis, RANGES, load, setDays }
}
