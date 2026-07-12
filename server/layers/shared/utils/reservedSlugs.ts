// Shared reserved store-slug guard.
//
// Store slugs become top-level URLs (`/{slug}`), so they must never collide with
// app routes or system names. Both seller-creation paths must use this list:
//   - POST /auth/register-seller  (new account + store)
//   - POST /seller/register       (upgrade an existing user to seller)

export const RESERVED_SLUGS = new Set([
  'discover',
  'market',
  'thrift',
  'checkout',
  'cart',
  'sellers',
  'seller',
  'user-login',
  'user-register',
  'profile',
  'map',
  'reels',
  'api',
  'offline',
  'landing',
  'about',
  'help',
  'privacy',
  'terms',
  'forgot-password',
  'reset-password',
  'verify-email',
  'resend-verification',
  'feed',
  'search',
  'explore',
  'settings',
  'notifications',
  'messages',
  'admin',
  'static',
  'marketx',
  'marketx.africa',
  'marketx.africa',
  'marketx_ng',
  'marketx_ng_africa',
  'marketx_ng_app',
  'marketx_ng_nuxt',
  'marketx_africa',
  'marketx_africa_app',
  'marketx_africa_nuxt',
  'marketx_app',
  'marketx_app_nuxt',
  'marketx_nuxt',
  'dasah',
  'dasah.ai',
  'dasah_africa',
  'dasah_africa_app',
  'dasah_africa_nuxt',
  'dasah_app',
  '_app',
  '_nuxt',
])

/** True when a (already lowercased/trimmed) slug is reserved and must be rejected. */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim())
}
