// Per-request DB query counter.
//
// A store is opened per HTTP request on `event.context` (server/plugins/dbMetrics.ts)
// and every Prisma operation increments it (the $extends hook in server/utils/db.ts).
// The link from a query back to its request uses Nitro's async-context (`useEvent`),
// which requires `nitro.experimental.asyncContext: true` in nuxt.config.
//
// Inert unless a per-request store is open (dev, or DB_METRICS=1), so production
// overhead is a single useEvent() lookup per query.

import { useEvent } from 'nitropack/runtime'

export interface DbMetricsStore {
  path: string
  count: number
  ops: Record<string, number> // operation → times called (spot the repeats)
}

export function recordQuery(operation: string): void {
  let event
  try {
    event = useEvent()
  } catch {
    return // no active request context
  }
  const store = (event?.context as Record<string, unknown> | undefined)
    ?.__dbMetrics as DbMetricsStore | undefined
  if (!store) return
  store.count++
  store.ops[operation] = (store.ops[operation] ?? 0) + 1
}
