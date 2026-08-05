// A variant priced wildly differently from the base price is usually a
// data-entry mistake (e.g. typing a discount amount instead of the full
// price) rather than an intentional option upcharge/discount.
const RATIO_HIGH = 5
const RATIO_LOW = 0.2

export function isVariantPriceSuspicious(
  basePrice: number | null | undefined,
  price: number | null | undefined,
): boolean {
  if (!basePrice || basePrice <= 0 || !price) return false
  const ratio = price / basePrice
  return ratio > RATIO_HIGH || ratio < RATIO_LOW
}

export interface SuspiciousVariant {
  size: string
  price: number
}

export function findSuspiciousVariantPrice(
  basePrice: number | null | undefined,
  variants: Array<{ size?: string; price?: number | null }>,
): SuspiciousVariant | null {
  for (const v of variants) {
    if (isVariantPriceSuspicious(basePrice, v.price)) {
      return { size: v.size || 'this option', price: v.price! }
    }
  }
  return null
}
