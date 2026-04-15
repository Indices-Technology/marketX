<script setup lang="ts">
const route = useRoute()
const storeSlug = route.params.store as string

const RESERVED = new Set([
  'discover', 'thrift', 'checkout', 'cart', 'sellers', 'seller',
  'user-login', 'user-register', 'profile', 'map', 'reels', 'api',
  'offline', 'landing', 'about', 'help', 'privacy', 'terms',
  'forgot-password', 'reset-password', 'verify-email', 'resend-verification',
  'feed', 'search', 'explore', 'settings', 'notifications', 'messages', 'admin',
])

if (RESERVED.has(storeSlug?.toLowerCase())) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}

await navigateTo(`/sellers/profile/${storeSlug}`, { redirectCode: 301 })
</script>
