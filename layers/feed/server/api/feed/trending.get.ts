import { remember } from '~~/server/utils/cache'
import { assignStrips } from '../../utils/discoverAlgorithm'

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
  // Bump cache key when algorithm changes to invalidate stale strips
  const result = await remember('feed:trending:v3', 300, async () => {
    const STRIP_SIZE = 10       // products shown per strip
    const CANDIDATE_FACTOR = 3  // over-fetch multiplier so dedup still fills each strip

    const [trendingTags, featuredSellers, trendingCandidates, freshCandidates, dealCandidates, prelovedCandidates] =
      await Promise.all([
        // Tags — raw GROUP BY for efficiency
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

        // Trending candidates — most viewed (wide open, no category filter)
        prisma.products.findMany({
          where: { status: 'PUBLISHED' },
          select: PRODUCT_SELECT,
          orderBy: [{ viewCount: 'desc' }, { created_at: 'desc' }],
          take: STRIP_SIZE * CANDIDATE_FACTOR,
        }),

        // Fresh candidates — newest first (no discount/thrift filter — algorithm handles it)
        prisma.products.findMany({
          where: { status: 'PUBLISHED' },
          select: PRODUCT_SELECT,
          orderBy: { created_at: 'desc' },
          take: STRIP_SIZE * CANDIDATE_FACTOR,
        }),

        // Deal candidates — must have a discount so this strip always has relevant items
        prisma.products.findMany({
          where: { status: 'PUBLISHED', discount: { gt: 0 } },
          select: PRODUCT_SELECT,
          orderBy: [{ discount: 'desc' }, { created_at: 'desc' }],
          take: STRIP_SIZE * CANDIDATE_FACTOR,
        }),

        // Preloved candidates — must be thrift so this strip always has relevant items
        prisma.products.findMany({
          where: { status: 'PUBLISHED', isThrift: true },
          select: PRODUCT_SELECT,
          orderBy: { created_at: 'desc' },
          take: STRIP_SIZE * CANDIDATE_FACTOR,
        }),
      ])

    // Score candidates and assign each product to exactly one strip
    const strips = assignStrips(
      {
        trending: trendingCandidates as any,
        fresh:    freshCandidates as any,
        deals:    dealCandidates as any,
        preloved: prelovedCandidates as any,
      },
      STRIP_SIZE,
    )

    const normalizedTags = trendingTags.map((t) => ({
      id: t.id,
      name: t.name,
      _count: { products: Number(t.productCount) },
    }))

    return {
      trendingProducts: strips.trending,
      trendingTags: normalizedTags,
      featuredSellers,
      strips: {
        fresh:   strips.fresh,
        deals:   strips.deals,
        preloved: strips.preloved,
      },
    }
  })

  setHeader(event, 'Cache-Control', 'public, max-age=180, stale-while-revalidate=300')
  return { success: true, data: result }
})
