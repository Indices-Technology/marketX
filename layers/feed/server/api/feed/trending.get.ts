import { remember } from '~~/server/utils/cache'

const PRODUCT_SELECT = {
  id: true,
  title: true,
  price: true,
  discount: true,
  slug: true,
  isThrift: true,
  isDeal: true,
  dealEndsAt: true,
  created_at: true,
  sellerId: true,
  viewCount: true,
  affiliateCommission: true,
  media: {
    where: { isBgMusic: false },
    select: { id: true, url: true, type: true, isBgMusic: true },
    take: 1,
    orderBy: { created_at: 'asc' as const },
  },
  seller: {
    select: { store_name: true, store_slug: true, default_currency: true },
  },
  variants: {
    select: { id: true, stock: true, price: true, size: true },
    take: 3,
  },
  _count: { select: { likes: true, comments: true } },
} as const

export default defineEventHandler(async (event) => {
  const result = await remember('feed:trending:v2', 300, async () => {
    const [trendingProducts, trendingTags, featuredSellers, freshStrip, dealStrip, prelovedStrip] =
      await Promise.all([
        // Sort by viewCount (denormalized column) — instant index scan vs correlated subquery
        prisma.products.findMany({
          where: { status: 'PUBLISHED' },
          select: PRODUCT_SELECT,
          orderBy: [{ viewCount: 'desc' }, { created_at: 'desc' }],
          take: 10,
        }),

        // Tags — use $queryRaw for efficient GROUP BY instead of correlated subquery
        prisma.$queryRaw<{ id: number; name: string; productCount: bigint }[]>`
          SELECT t.id, t.name, COUNT(pt."tagId")::int AS "productCount"
          FROM "Tag" t
          INNER JOIN "ProductTags" pt ON pt."tagId" = t.id
          GROUP BY t.id, t.name
          ORDER BY "productCount" DESC
          LIMIT 20
        `,

        prisma.sellerProfile.findMany({
          where: { is_active: true },
          select: {
            id: true,
            store_name: true,
            store_slug: true,
            store_logo: true,
            store_banner: true,
            is_verified: true,
            followers_count: true,
            _count: { select: { products: true } },
          },
          orderBy: { followers_count: 'desc' },
          take: 6,
        }),

        // Strip: fresh drops
        prisma.products.findMany({
          where: { status: 'PUBLISHED' },
          select: PRODUCT_SELECT,
          orderBy: { created_at: 'desc' },
          take: 10,
        }),

        // Strip: deals
        prisma.products.findMany({
          where: { status: 'PUBLISHED', discount: { gt: 0 } },
          select: PRODUCT_SELECT,
          orderBy: { created_at: 'desc' },
          take: 10,
        }),

        // Strip: preloved
        prisma.products.findMany({
          where: { status: 'PUBLISHED', isThrift: true },
          select: PRODUCT_SELECT,
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
      ])

    // Normalize bigint from raw query
    const normalizedTags = trendingTags.map((t) => ({
      id: t.id,
      name: t.name,
      _count: { products: Number(t.productCount) },
    }))

    return {
      trendingProducts,
      trendingTags: normalizedTags,
      featuredSellers,
      strips: { fresh: freshStrip, deals: dealStrip, preloved: prelovedStrip },
    }
  })

  setHeader(event, 'Cache-Control', 'public, max-age=180, stale-while-revalidate=300')
  return { success: true, data: result }
})
