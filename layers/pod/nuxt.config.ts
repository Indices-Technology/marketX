export default defineNuxtConfig({
  // POD (pay-on-delivery) layer — server-only.
  // Providers + services in server/, imported explicitly by the commerce
  // payment routes. This config exists so Nuxt's layer auto-scan can register
  // the directory as a layer instead of warning "Cannot extend config".
})
