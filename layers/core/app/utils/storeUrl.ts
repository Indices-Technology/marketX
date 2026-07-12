/**
 * Memorable store URLs.
 *
 * A store slug is a top-level route: `/{slug}` (see `layers/seller/app/pages/[store].vue`,
 * which 301s to the canonical `/sellers/profile/{slug}`). Slugs are kept collision-free
 * by RESERVED_SLUGS at registration time, so the short form is always safe to hand out.
 *
 * Anything a seller copies, shares, or reads aloud should use these helpers.
 * Internal <NuxtLink> navigation keeps using the canonical path so it doesn't
 * pay for the redirect hop.
 */
import { BRAND } from './brand'

/** Bare host + slug, no protocol — for display. `marketx.africa/amara-couture` */
export const storeDisplayUrl = (slug: string, domain = BRAND.domain) =>
  `${domain}/${slug}`

/** Absolute, shareable link. `https://marketx.africa/amara-couture` */
export const storeShareUrl = (
  slug: string,
  baseUrl = `https://${BRAND.domain}`,
) => `${baseUrl.replace(/\/+$/, '')}/${slug}`

/** Canonical in-app route for the store page — what NuxtLink should point at. */
export const storePath = (slug: string) => `/sellers/profile/${slug}`
