// Opens a per-request DB query counter and logs the tally on response.
//
// Enabled in dev, or anywhere with DB_METRICS=1. Disabled otherwise (zero cost).
// Output:  [db-metrics] GET /api/feed/home → 4 queries  {"findMany":3,"count":1}
// Requests at/above DB_METRICS_WARN (default 15) are flagged as likely N+1 hotspots.
//
// The store lives on event.context; the Prisma extension (server/utils/dbMetrics.ts)
// finds it via Nitro async-context while the handler runs.

import type { DbMetricsStore } from '~~/server/utils/dbMetrics'

const N1_THRESHOLD = Number(process.env.DB_METRICS_WARN ?? 15)

// Module-level guard: the plugin factory can run more than once in dev; we only
// want one set of hooks (otherwise every request logs twice).
let registered = false

export default defineNitroPlugin((nitroApp) => {
  const enabled =
    process.env.DB_METRICS === '1' || process.env.NODE_ENV !== 'production'
  if (!enabled || registered) return
  registered = true
  console.log('[db-metrics] enabled — counting queries per request')

  nitroApp.hooks.hook('request', (event) => {
    if (!event.path?.startsWith('/api')) return
    const store: DbMetricsStore = { path: event.path, count: 0, ops: {} }
    ;(event.context as Record<string, unknown>).__dbMetrics = store
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const store = (event.context as Record<string, unknown>).__dbMetrics as
      | DbMetricsStore
      | undefined
    if (!store || !event.path?.startsWith('/api')) return

    const line = `[db-metrics] ${store.path} → ${store.count} queries  ${JSON.stringify(store.ops)}`
    if (store.count >= N1_THRESHOLD) console.warn(`${line}  ⚠️ possible N+1`)
    else console.log(line)
  })
})
