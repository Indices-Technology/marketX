// Pure aggregation of Trust Card scan events into the pilot's funnel metrics
// (framework §3 TrustScanEvent). No DB access → unit-testable. The endpoint
// queries the rows; this turns them into totals, per-surface counts, a daily
// trend, and conversion rate (conversion attribution wires in later — until
// then orderId is null and conversions read 0).

export interface ScanStats {
  totalScans: number
  conversions: number
  /** Percentage of scans that led to a protected payment. */
  conversionRate: number
  bySurface: { surface: string; count: number }[]
  /** Last 14 days including today, oldest first. */
  daily: { date: string; count: number }[]
}

const DAY_MS = 86_400_000
const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export function summarizeScans(
  rows: {
    surface: string | null
    orderId: number | null
    created_at: Date | string
  }[],
  now: number = Date.now(),
): ScanStats {
  const totalScans = rows.length
  const conversions = rows.filter((r) => r.orderId != null).length

  const surfaceCounts = new Map<string, number>()
  const dayCounts = new Map<string, number>()
  for (const r of rows) {
    const s = (r.surface || 'UNKNOWN').toUpperCase()
    surfaceCounts.set(s, (surfaceCounts.get(s) ?? 0) + 1)
    dayCounts.set(
      dayKey(new Date(r.created_at)),
      (dayCounts.get(dayKey(new Date(r.created_at))) ?? 0) + 1,
    )
  }

  const bySurface = [...surfaceCounts.entries()]
    .map(([surface, count]) => ({ surface, count }))
    .sort((a, b) => b.count - a.count)

  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  const daily: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const key = dayKey(new Date(start.getTime() - i * DAY_MS))
    daily.push({ date: key, count: dayCounts.get(key) ?? 0 })
  }

  return {
    totalScans,
    conversions,
    conversionRate: totalScans ? (conversions / totalScans) * 100 : 0,
    bySurface,
    daily,
  }
}
