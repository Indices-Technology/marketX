/**
 * Sentinel size for the implicit "simple product" variant.
 *
 * The cart, orders and stock all key off ProductVariant, so a product with no
 * seller-defined options still needs exactly one variant to be cartable. We
 * create a single variant with this size to carry the base stock. It's a UI
 * sentinel — hidden from the buyer's option selector (see product/[slug].vue)
 * and unfolded back into the "Quantity in stock" field on the edit form.
 *
 * Shared by client (forms, product page) and server (repository safety net) so
 * the value can never drift between where it's written and where it's detected.
 */
export const DEFAULT_VARIANT_SIZE = 'Default'

/** True when `variants` is the single implicit default (a simple product). */
export function isSimpleProduct(
  variants: Array<{ size?: string | null }> | null | undefined,
): boolean {
  return (
    !!variants &&
    variants.length === 1 &&
    variants[0]?.size === DEFAULT_VARIANT_SIZE
  )
}

/**
 * Human label for a variant's size/option, with the implicit Default sentinel
 * hidden. Use anywhere a cart/order line shows the chosen option so simple
 * products don't display a meaningless "Default".
 */
export function variantLabel(size?: string | null): string {
  if (!size || size === DEFAULT_VARIANT_SIZE) return ''
  return size
}
