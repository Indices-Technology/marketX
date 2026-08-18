/**
 * useJsonLd — schema.org structured data.
 *
 * This is the half of SEO that meta tags cannot do. Title and description
 * decide whether a result is clicked; structured data decides what the result
 * LOOKS like — the price, the star rating, the stock state, the breadcrumb
 * trail shown under the link. For a marketplace competing against Jumia and
 * Instagram sellers in the same SERP, that difference is the whole game.
 *
 * Not called directly from pages. `useSeo()` emits the right schema alongside
 * the meta tags, so the "every page calls exactly one setter" rule still holds.
 *
 * Honesty rule: only emit a field we can actually prove from a database row.
 * A fabricated `aggregateRating` is the fastest way to earn a Google manual
 * action — so ratings are emitted only when a real review count backs them.
 */
import { BRAND } from '~~/layers/core/app/utils/brand'

type Json = Record<string, unknown>

/**
 * `JSON.stringify` does not escape `<`, so a product title containing
 * `</script>` would close the tag and inject markup. Escaping it as a unicode
 * sequence keeps the JSON identical to a parser while making the string inert
 * in HTML.
 */
const serialize = (data: Json): string =>
  JSON.stringify(data).replace(/</g, '\\u003c')

/**
 * Injects one JSON-LD block. `key` dedupes: re-registering the same key on a
 * client-side navigation replaces the previous block instead of stacking a
 * second, contradictory one in the head.
 *
 * Accepts a getter as well as a plain object, so a page whose data arrives
 * asynchronously can register the block once during setup and let it fill in.
 * That matters: `useHead` has to run in setup to be cleaned up on unmount, so
 * re-calling it from a watcher once the data lands is not an option.
 */
export const useJsonLd = (
  key: string,
  data: Json | null | undefined | (() => Json | null | undefined),
) => {
  useHead({
    script: [
      {
        key: `ld-${key}`,
        type: 'application/ld+json',
        innerHTML: () => {
          const resolved = typeof data === 'function' ? data() : data
          return resolved ? serialize(resolved) : ''
        },
      },
    ],
  })
}

// ── Builders ────────────────────────────────────────────────────────────────

export const organizationSchema = (opts: {
  siteName: string
  baseURL: string
}): Json => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${opts.baseURL}/#organization`,
  name: opts.siteName,
  url: opts.baseURL,
  logo: `${opts.baseURL}/icons/icon-512.png`,
  description: BRAND.description,
  sameAs: [`https://x.com/${BRAND.twitterHandle.replace(/^@/, '')}`],
})

/**
 * WebSite + SearchAction. The SearchAction is what lets Google render a search
 * box directly inside our result — it only appears if the described URL really
 * performs a site search, which `/discover?q=` does.
 */
export const webSiteSchema = (opts: {
  siteName: string
  baseURL: string
}): Json => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${opts.baseURL}/#website`,
  name: opts.siteName,
  url: opts.baseURL,
  publisher: { '@id': `${opts.baseURL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${opts.baseURL}/discover?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
})

export const productSchema = (opts: {
  name: string
  description?: string | null
  image?: string | null
  url: string
  sku?: string | null
  price?: number | null
  currency: string
  inStock: boolean
  sellerName?: string | null
  ratingValue?: number | null
  reviewCount?: number | null
}): Json | null => {
  if (!opts.name) return null

  const schema: Json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: opts.name,
    url: opts.url,
  }

  if (opts.description) schema.description = opts.description
  if (opts.image) schema.image = [opts.image]
  if (opts.sku) schema.sku = opts.sku
  if (opts.sellerName)
    schema.brand = { '@type': 'Brand', name: opts.sellerName }

  if (opts.price != null) {
    schema.offers = {
      '@type': 'Offer',
      url: opts.url,
      price: opts.price,
      priceCurrency: opts.currency,
      availability: opts.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      ...(opts.sellerName
        ? { seller: { '@type': 'Organization', name: opts.sellerName } }
        : {}),
    }
  }

  // Only with real reviews behind it — see the honesty rule at the top.
  if (opts.ratingValue != null && (opts.reviewCount ?? 0) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: opts.ratingValue,
      reviewCount: opts.reviewCount,
    }
  }

  return schema
}

/**
 * A seller's shopfront. `Store` rather than the generic `Organization` — it is
 * a LocalBusiness subtype, so a store with coordinates can surface in local and
 * map results, which is exactly what the Near Me surface is for.
 */
export const storeSchema = (opts: {
  name: string
  description?: string | null
  image?: string | null
  url: string
  city?: string | null
  state?: string | null
  latitude?: number | null
  longitude?: number | null
  telephone?: string | null
  ratingValue?: number | null
  reviewCount?: number | null
}): Json | null => {
  if (!opts.name) return null

  const schema: Json = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: opts.name,
    url: opts.url,
  }

  if (opts.description) schema.description = opts.description
  if (opts.image) schema.image = opts.image
  if (opts.telephone) schema.telephone = opts.telephone

  if (opts.city || opts.state) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(opts.city ? { addressLocality: opts.city } : {}),
      ...(opts.state ? { addressRegion: opts.state } : {}),
      addressCountry: 'NG',
    }
  }

  if (opts.latitude != null && opts.longitude != null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: opts.latitude,
      longitude: opts.longitude,
    }
  }

  if (opts.ratingValue != null && (opts.reviewCount ?? 0) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: opts.ratingValue,
      reviewCount: opts.reviewCount,
    }
  }

  return schema
}

/** Renders the `Home › Discover › Category › Product` trail under a result. */
export const breadcrumbSchema = (
  items: Array<{ name: string; url: string }>,
): Json | null => {
  if (items.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
