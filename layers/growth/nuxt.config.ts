export default defineNuxtConfig({
  // Growth Engine layer — converts static business info into measurable Growth Assets
  // that acquire customers and route them into MarketX commerce. See docs/GROWTH_ENGINE.md.
  //
  // EXTRACTABLE: depends only on `core`. MUST NOT import commerce/seller/product/order
  // models — cross-boundary data arrives as plain value objects / opaque refs at the
  // edge (same discipline as the shipping layer). Growth's own tables reference
  // seller/product by scalar id, never a Prisma relation.
  //
  // Server: server/channels/* (verb-seam providers), services (orchestrator), utils/types.
  components: [
    {
      path: '~/app/components',
      pathPrefix: false,
    },
  ],
})
