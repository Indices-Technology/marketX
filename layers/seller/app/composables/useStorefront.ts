/**
 * Storefront context — the one question every commerce surface needs to answer:
 * is this visitor browsing the marketplace, or standing inside one seller's shop?
 *
 * The two answers want opposite things. Marketplace pages should cross-sell:
 * discovery rails, other sellers, "more from this market". A storefront must
 * not — the seller paid for that click with her own WhatsApp status, and losing
 * the sale to a competing tile on her own page is the fastest way to teach
 * sellers that their link is worth less here than a plain Instagram bio.
 *
 * Resolution order, most authoritative first:
 *   1. Host subdomain          — jane.marketx.store  (inert until DNS exists)
 *   2. route.meta.storefront   — the /{slug} shopfront route
 *   3. ?store= query param     — /product/x?store=jane
 *   4. null                    — marketplace
 *
 * Context comes from HOW THE VISITOR ARRIVED, never from which seller's data a
 * page happens to show. Someone browsing the marketplace who taps into a seller
 * must keep their marketplace chrome, or they are stranded in a shop with no
 * way back to what they were doing.
 *
 * The provenance signal is the route itself, and it already existed. Sellers
 * hand out the short `/{slug}` form (storeShareUrl → Trust Card, QR, WhatsApp
 * status); in-app <NuxtLink>s use `/sellers/profile/{slug}`. Those are now two
 * real routes rendering one component — her shopfront and the marketplace's
 * view of her — rather than one redirecting to the other.
 *
 * Everything reads this one seam, so switching the primary mechanism from query
 * param to subdomain (or later to a seller's own custom domain) is a change to
 * `slugFromHost` and nothing else.
 */
import { computed } from 'vue'
import { useRoute, useRequestURL } from '#imports'

/** Hosts under STOREFRONT_BASE_HOST that are infrastructure, not sellers. */
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'cdn',
  'static',
  'mail',
  'dev',
  'staging',
])

/**
 * The storefront apex. A subdomain only counts when the host sits directly
 * beneath it, so marketx.africa (the marketplace) never reads as a storefront.
 */
const STOREFRONT_BASE_HOST = 'marketx.store'

export function useStorefront() {
  const route = useRoute()
  const url = useRequestURL()

  /**
   * jane.marketx.store → "jane". Deliberately strict: exactly one label above
   * the apex, so shop.jane.marketx.store does not silently resolve to "shop".
   */
  const slugFromHost = computed(() => {
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (!host.endsWith(`.${STOREFRONT_BASE_HOST}`)) return null
    const label = host.slice(0, -(STOREFRONT_BASE_HOST.length + 1))
    if (!label || label.includes('.') || RESERVED_SUBDOMAINS.has(label))
      return null
    return label
  })

  /**
   * A seller's own page is a storefront whether or not anything said so — it is
   * the link she shares. Without this, the first click out of her shop would
   * lose the context before it was ever established.
   */
  /**
   * The /{slug} shopfront route, which opts in via definePageMeta. Meta comes
   * from the matched route record, so only that entrance sets it — the
   * /sellers/profile/{slug} route renders the same component without it.
   */
  const slugFromMeta = computed(() => {
    if (!route.meta?.storefront) return null
    const p = route.params.store ?? route.params.storeSlug
    const raw = Array.isArray(p) ? p[0] : p
    if (typeof raw !== 'string' || !raw.trim()) return null
    // /@jane and /jane resolve to the same shop.
    return raw.replace(/^@/, '').trim() || null
  })

  const slugFromQuery = computed(() => {
    const q = route.query.store
    const raw = Array.isArray(q) ? q[0] : q
    return typeof raw === 'string' && raw.trim() ? raw.trim() : null
  })

  /** The seller whose shop we are standing in, or null on the marketplace. */
  const storefrontSlug = computed(
    () => slugFromHost.value || slugFromMeta.value || slugFromQuery.value,
  )

  const isStorefront = computed(() => !!storefrontSlug.value)

  /**
   * True only when this page belongs to the shop we are standing in. A product
   * page carries its own seller, and a stale ?store= from a back-navigation
   * must not dress another seller's product in Jane's chrome.
   */
  const isStorefrontOf = (slug: string | null | undefined) =>
    !!slug && storefrontSlug.value === slug

  /**
   * Carry storefront context across an in-shop link. No-op on the marketplace,
   * and no-op once the subdomain carries the context by itself — a link inside
   * jane.marketx.store is already unambiguous.
   */
  const storeLink = (path: string) => {
    if (!storefrontSlug.value || slugFromHost.value) return path
    const [base, hash] = path.split('#')
    const sep = base!.includes('?') ? '&' : '?'
    const withStore = `${base}${sep}store=${encodeURIComponent(storefrontSlug.value)}`
    return hash ? `${withStore}#${hash}` : withStore
  }

  return {
    storefrontSlug,
    isStorefront,
    isStorefrontOf,
    storeLink,
  }
}
