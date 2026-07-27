/**
 * Bulk-import helpers — pure functions that neutralise the single-create footguns
 * (docs/BULK_LISTING_AND_SOCIAL_DISTRIBUTION.md §3) when they detonate at N products.
 *
 * Pure and DB-free so they unit-test in isolation. The service supplies the
 * already-fetched "taken" sets; these decide the outcome.
 */

/** Slug base for a title: lowercase, non-alphanumeric runs → single hyphen, trimmed. */
export function slugifyBase(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Assign a unique slug to every title in ONE pass — accounting both for slugs
 * already taken in the DB and for duplicates within this same batch. Replaces the
 * per-title DB-probe loop (§3 footgun #3), which was O(n) round-trips and racy.
 *
 * `taken` is the set of slugs already present in the DB (prefetched once). The
 * returned array is index-aligned with `titles`.
 */
export function assignUniqueSlugs(titles: string[], taken: Set<string>): string[] {
  const used = new Set(taken)
  return titles.map((t) => {
    const base = slugifyBase(t) || 'product'
    let slug = base
    let n = 1
    while (used.has(slug)) slug = `${base}-${n++}`
    used.add(slug)
    return slug
  })
}

/**
 * Row indexes whose SKU collides — either already present in the DB or duplicated
 * earlier in the same batch. Lets the caller reject just those rows instead of the
 * global `@@unique(SKU)` constraint aborting the whole import (§3 footgun #5).
 *
 * `skus` is index-aligned with the rows; empty/undefined SKUs never collide.
 */
export function detectSkuCollisions(
  skus: (string | undefined | null)[],
  existing: Set<string>,
): Set<number> {
  const collisions = new Set<number>()
  const seen = new Set<string>()
  skus.forEach((sku, i) => {
    if (!sku) return
    if (existing.has(sku) || seen.has(sku)) collisions.add(i)
    else seen.add(sku)
  })
  return collisions
}
