export default defineNuxtConfig({
  // Shipping layer — carrier-agnostic delivery orchestration.
  // Foundational: depends only on `core`. Commerce/checkout consume it; it never
  // imports commerce/seller/order/product. See docs/SHIPPING.md.
  // Server: server/api/shipping/*, services, providers, repositories.
  // Client: app/components/*, composables/*.
  components: [
    {
      path: '~/app/components',
      pathPrefix: false,
    },
  ],
})
