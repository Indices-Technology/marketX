/**
 * Platform shipping pricing — the cost→retail dial.
 *
 * Providers return `costMinor` (what we pay) and `listMinor` (reference/retail).
 * The platform decides how much of the spread the buyer keeps via a single
 * admin-tunable knob. See docs/SHIPPING.md §6.
 *
 *   buyerPrice     = list − discountPct × (list − cost)
 *   platformMargin = buyerPrice − cost
 *
 * discountPct = 0   → buyer pays list (full margin, default)
 * discountPct = 1   → buyer pays cost (cheapest, zero margin)
 *
 * Config (per-carrier / per-zone / promo) will come from the `CarrierConfig`
 * table; until then callers pass an explicit discountPct (default 0).
 */

/** Default markup applied to single-rate carriers (no distinct list price). */
export const DEFAULT_MARKUP = 0.15

export interface PricingInput {
  costMinor: number
  /** Reference/retail price. For single-rate carriers, pass costMinor and set deriveList. */
  listMinor?: number
  /** 0..1 — fraction of the (list − cost) spread passed to the buyer as discount. */
  discountPct?: number
  /** When listMinor is absent, derive it as cost × (1 + markup). */
  deriveList?: boolean
  markup?: number
}

export interface PricingResult {
  costMinor: number
  listMinor: number
  buyerPriceMinor: number
  platformMarginMinor: number
}

export function computePrice(input: PricingInput): PricingResult {
  const cost = Math.max(0, Math.round(input.costMinor))
  const markup = input.markup ?? DEFAULT_MARKUP

  const list =
    input.listMinor != null
      ? Math.round(input.listMinor)
      : input.deriveList
        ? Math.round(cost * (1 + markup))
        : cost

  const discountPct = clamp01(input.discountPct ?? 0)
  const spread = Math.max(0, list - cost)
  const buyerPrice = Math.round(list - discountPct * spread)

  return {
    costMinor: cost,
    listMinor: list,
    buyerPriceMinor: buyerPrice,
    platformMarginMinor: buyerPrice - cost,
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(1, Math.max(0, n))
}
