/**
 * Shipping orchestrator — the carrier-agnostic brain.
 *
 *   filter(canHandle) → quote fan-out (parallel, graceful) → apply platform
 *   pricing dial → rank → present.
 *
 * "No fixed carrier": every eligible provider is quoted; the platform applies
 * its margin dial and ranks. See docs/SHIPPING.md §5, §6.
 */

import type { Quote, ShipmentRequest } from '../utils/types'
import { eligibleProviders } from '../providers/registry'
import { computePrice } from './pricing.service'

export type RankStrategy = 'cheapest' | 'fastest' | 'best-value'

export interface QuoteOptions {
  /** 0..1 — fraction of each carrier's spread passed to the buyer (from config). */
  discountPct?: number
  strategy?: RankStrategy
  /** Per-provider quote timeout (ms) for live-API carriers. */
  timeoutMs?: number
  /** Restrict to specific carrier ids (e.g. ['self'] before GIG API is live). */
  only?: string[]
}

const DEFAULT_TIMEOUT = 15000 // live carrier login+quote chains can be slow on cold start

export async function getQuotes(
  req: ShipmentRequest,
  opts: QuoteOptions = {},
): Promise<Quote[]> {
  const providers = eligibleProviders(req, opts.only)
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT

  // Fan out in parallel; a slow/failing carrier drops out rather than blocking.
  const settled = await Promise.allSettled(
    providers.map((p) => withTimeout(p.quote(req), timeoutMs)),
  )

  const quotes: Quote[] = []
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    for (const q of result.value) {
      // Apply the platform pricing dial: provider gives cost+list, we set buyerPrice.
      const priced = computePrice({
        costMinor: q.costMinor,
        listMinor: q.listMinor,
        discountPct: opts.discountPct ?? 0,
      })
      quotes.push({ ...q, ...priced })
    }
  }

  return rank(quotes, opts.strategy ?? 'best-value')
}

function rank(quotes: Quote[], strategy: RankStrategy): Quote[] {
  const byPrice = (a: Quote, b: Quote) => a.buyerPriceMinor - b.buyerPriceMinor
  const bySpeed = (a: Quote, b: Quote) =>
    (a.etaMaxHours ?? Infinity) - (b.etaMaxHours ?? Infinity)

  const sorted = [...quotes]
  if (strategy === 'cheapest') sorted.sort(byPrice)
  else if (strategy === 'fastest') sorted.sort(bySpeed)
  else sorted.sort((a, b) => byPrice(a, b) || bySpeed(a, b)) // best-value
  return sorted
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('quote timeout')), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}
