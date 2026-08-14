<!--
  /{slug} — the memorable store URL a seller actually hands out (storeShareUrl:
  Trust Card, QR, WhatsApp status, bio link).

  This used to 301 to /sellers/profile/{slug}. It no longer redirects at all,
  for three reasons:

  1. The address bar is the point. A seller sharing marketx.africa/jane whose
     customer lands on marketx.africa/sellers/profile/jane?store=jane has been
     told, in the most visible place on the page, that this is not her store.
  2. A redirect hop is dead latency on the single most important link in the
     product, on mobile networks where it costs the most.
  3. 301s are cached permanently by browsers and CDNs. Anything encoded in the
     redirect target is unchangeable for everyone who has already followed it.

  So the two routes now genuinely differ: this one is the seller's shopfront,
  /sellers/profile/{slug} is the marketplace's view of a seller. Same component,
  different entrance — see useStorefront().
-->
<template>
  <StoreProfilePage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import StoreProfilePage from './sellers/profile/[storeSlug].vue'

// Read by useStorefront() to mark this entrance as a storefront. Set on the
// route rather than sniffed from the path, so the rule stays explicit and any
// future storefront entrance can opt in the same way.
definePageMeta({ storefront: true })

const route = useRoute()
const raw = route.params.store as string
// Strip leading @ so /@amara-couture resolves the same as /amara-couture
const storeSlug = raw?.startsWith('@') ? raw.slice(1) : raw

const RESERVED = new Set([
  'discover',
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
  'support',
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
])

if (RESERVED.has(storeSlug?.toLowerCase())) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}
</script>
