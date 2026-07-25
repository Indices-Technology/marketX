export default defineNuxtConfig({
  // Payments layer — server-only.
  // Payment providers (Paystack, stubs) + service in server/, imported
  // explicitly by the commerce payment routes. This config exists so Nuxt's
  // layer auto-scan can register the directory instead of warning
  // "Cannot extend config".
})
