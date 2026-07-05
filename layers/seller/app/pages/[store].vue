<script setup lang="ts">
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

await navigateTo(`/sellers/profile/${storeSlug}`, { redirectCode: 301 })
</script>
