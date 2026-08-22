// Per-request flush for queue writes.
//
// THE PROBLEM
// `queue.add()` is a network round-trip to Redis. Producers call enqueue()
// without awaiting it, which is correct in intent — an order must not fail
// because a notification was slow. But on a function host (Vercel, Netlify,
// Cloudflare) the instance is frozen the instant the response is sent, so an
// un-awaited write races that freeze and often loses.
//
// When it loses, nothing is left behind: no waiting job, no failed job, no log.
// The event never existed. That is what dropped the notifications on order #237
// — payment confirmed, escrow credited, and neither party told.
//
// THE FIX
// Every enqueue registers its promise against the current request. Nitro's
// `beforeResponse` hook then waits for them — before the response goes out, so
// before the instance can be frozen. Call sites keep writing
// `queue.enqueue(...)` with no await and get delivery anyway.
//
// This is the same plumbing dbMetrics already uses: a store on event.context,
// found from deep in a util via Nitro async-context (`useEvent`), which needs
// `nitro.experimental.asyncContext: true`.
//
// Outside a request — the BullMQ workers, scheduled tasks — useEvent() throws
// and tracking is skipped. Those run on the always-on host and are never frozen,
// so they need none of this.

import { useEvent } from 'nitropack/runtime'

const KEY = '__pendingQueueWrites'

/** Longest a response will wait for its queue writes. A stalled Redis must slow
 *  a request, never hang it — past this we give up and let the response go. The
 *  write may still land; we simply stop waiting. */
const FLUSH_TIMEOUT_MS = 3000

type Pending = Set<Promise<unknown>>

/**
 * Register an in-flight queue write against the current request.
 * Returns the promise untouched, so callers can still await it directly.
 */
export function trackQueueWrite<T>(p: Promise<T>): Promise<T> {
  let event
  try {
    event = useEvent()
  } catch {
    return p // no request context (worker / task) — nothing to flush
  }
  const ctx = event?.context as Record<string, unknown> | undefined
  if (!ctx) return p

  const pending = (ctx[KEY] as Pending | undefined) ?? new Set()
  ctx[KEY] = pending
  pending.add(p)
  // Never let a rejection here surface as unhandled: each enqueue already logs
  // its own failure, and flush() uses allSettled.
  void p.catch(() => {}).finally(() => pending.delete(p))
  return p
}

/**
 * Wait for this request's queue writes to reach Redis. Called from
 * server/plugins/queueFlush.ts on `beforeResponse`.
 */
export async function flushQueueWrites(event: {
  context?: Record<string, unknown>
}): Promise<void> {
  const pending = event?.context?.[KEY] as Pending | undefined
  if (!pending || pending.size === 0) return

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      Promise.allSettled([...pending]),
      new Promise((resolve) => {
        timer = setTimeout(resolve, FLUSH_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
