import { prisma } from '~~/server/utils/db'
import type { Prisma } from '@prisma/client'
import type {
  EntityType,
  VariantContext,
  SellerSummary,
  SquareSummary,
  ProductAIContext,
  SellerAIContext,
  SquareAIContext,
  BatchContextResponse,
} from '../types/ai-context.types'

// ── Reusable Prisma selects ───────────────────────────────────────────────────
// Defined once, referenced in both single-entity and batch queries.

const sellerSummarySelect = {
  id: true,
  store_name: true,
  store_slug: true,
  locationLabel: true,
  city: true,
  state: true,
  is_verified: true,
  averageRating: true,
  pod_enabled: true,
  pod_zones: true,
} satisfies Prisma.SellerProfileSelect

const squareSummarySelect = {
  id: true,
  name: true,
  slug: true,
  type: true,
  city: true,
  state: true,
} satisfies Prisma.SquareSelect

const sellerFullSelect = {
  id: true,
  store_name: true,
  store_slug: true,
  store_description: true,
  locationLabel: true,
  city: true,
  state: true,
  latitude: true,
  longitude: true,
  hideLocation: true,
  shipFromCity: true,
  shipFromState: true,
  pod_enabled: true,
  pod_zones: true,
  is_verified: true,
  isPremium: true,
  averageRating: true,
  totalReviews: true,
  followers_count: true,
  businessHours: true,
  updated_at: true,
  squareMemberships: {
    where: { isPrimary: true, status: 'ACTIVE' as const },
    select: { square: { select: squareSummarySelect } },
    take: 1,
  },
} satisfies Prisma.SellerProfileSelect

const productInclude = {
  variants: {
    select: { size: true, stock: true, price: true },
    orderBy: { size: 'asc' as const },
  },
  category: {
    include: { category: { select: { name: true } } },
  },
  tags: {
    include: { tag: { select: { name: true } } },
  },
  seller: { select: sellerSummarySelect },
  square: { select: squareSummarySelect },
} satisfies Prisma.ProductsInclude

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePodZones(raw: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((z): z is string => typeof z === 'string')
}

function mapSellerSummary(
  s: Prisma.SellerProfileGetPayload<{ select: typeof sellerSummarySelect }>,
): SellerSummary {
  return {
    id: s.id,
    storeName: s.store_name ?? '',
    storeSlug: s.store_slug,
    locationLabel: s.locationLabel ?? null,
    city: s.city ?? null,
    state: s.state ?? null,
    isVerified: s.is_verified,
    averageRating: s.averageRating ?? null,
    podEnabled: s.pod_enabled,
    podZones: parsePodZones(s.pod_zones),
  }
}

function mapSquareSummary(
  sq: Prisma.SquareGetPayload<{ select: typeof squareSummarySelect }>,
): SquareSummary {
  return {
    id: sq.id,
    name: sq.name,
    slug: sq.slug,
    type: sq.type as 'GEOGRAPHIC' | 'CATEGORY',
    city: sq.city ?? null,
    state: sq.state ?? null,
  }
}

function mapProduct(
  p: Prisma.ProductsGetPayload<{ include: typeof productInclude }>,
): ProductAIContext {
  return {
    entityType: 'PRODUCT',
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    description: p.description ?? null,
    price: p.price,
    discount: p.discount ?? null,
    condition: p.condition ?? null,
    isThrift: p.isThrift,
    isDeal: p.isDeal,
    status: p.status ?? 'DRAFT',
    averageRating: p.averageRating ?? null,
    totalReviews: p.totalReviews,
    soldCount: p.soldCount,
    viewCount: p.viewCount,
    variants: p.variants.map(
      (v): VariantContext => ({
        size: v.size,
        stock: v.stock,
        price: v.price ?? null,
      }),
    ),
    categories: p.category.map((c) => c.category.name),
    tags: p.tags.map((t) => t.tag.name),
    seller: mapSellerSummary(p.seller),
    square: p.square ? mapSquareSummary(p.square) : null,
    updatedAt: p.updated_at.toISOString(),
  }
}

function mapSeller(
  s: Prisma.SellerProfileGetPayload<{ select: typeof sellerFullSelect }>,
  topCategories: string[],
): SellerAIContext {
  const primarySquare = s.squareMemberships[0]?.square ?? null
  return {
    entityType: 'SELLER',
    id: s.id,
    storeName: s.store_name ?? '',
    storeSlug: s.store_slug,
    storeDescription: s.store_description ?? null,
    locationLabel: s.locationLabel ?? null,
    city: s.city ?? null,
    state: s.state ?? null,
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
    hideLocation: s.hideLocation,
    shipFromCity: s.shipFromCity ?? null,
    shipFromState: s.shipFromState ?? null,
    podEnabled: s.pod_enabled,
    podZones: parsePodZones(s.pod_zones),
    isVerified: s.is_verified,
    isPremium: s.isPremium,
    averageRating: s.averageRating ?? null,
    totalReviews: s.totalReviews,
    followersCount: s.followers_count,
    businessHours: s.businessHours ?? null,
    primarySquare: primarySquare ? mapSquareSummary(primarySquare) : null,
    topCategories,
    updatedAt: s.updated_at.toISOString(),
  }
}

// ── Top-category derivation ───────────────────────────────────────────────────
// Two lightweight queries: one GROUP BY, one name lookup.

async function deriveTopCategoriesForSeller(
  sellerId: string,
): Promise<string[]> {
  const counts = await prisma.productCategories.groupBy({
    by: ['categoryId'],
    where: { product: { sellerId, status: 'PUBLISHED' } },
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: 'desc' } },
    take: 6,
  })
  if (!counts.length) return []

  const cats = await prisma.category.findMany({
    where: { id: { in: counts.map((c) => c.categoryId) } },
    select: { id: true, name: true },
  })

  return counts
    .map((c) => cats.find((cat) => cat.id === c.categoryId)?.name)
    .filter((n): n is string => Boolean(n))
}

async function deriveTopCategoriesForSquare(
  squareId: string,
): Promise<string[]> {
  const counts = await prisma.productCategories.groupBy({
    by: ['categoryId'],
    where: { product: { squareId, status: 'PUBLISHED' } },
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: 'desc' } },
    take: 8,
  })
  if (!counts.length) return []

  const cats = await prisma.category.findMany({
    where: { id: { in: counts.map((c) => c.categoryId) } },
    select: { id: true, name: true },
  })

  return counts
    .map((c) => cats.find((cat) => cat.id === c.categoryId)?.name)
    .filter((n): n is string => Boolean(n))
}

// Run async tasks in parallel with a bounded concurrency.
async function withConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn))
  }
}

// ── Public service ────────────────────────────────────────────────────────────

export const aiContextService = {
  async getProduct(id: number): Promise<ProductAIContext | null> {
    const p = await prisma.products.findUnique({
      where: { id },
      include: productInclude,
    })
    return p ? mapProduct(p) : null
  },

  async getSeller(id: string): Promise<SellerAIContext | null> {
    const s = await prisma.sellerProfile.findUnique({
      where: { id },
      select: sellerFullSelect,
    })
    if (!s) return null
    const topCategories = await deriveTopCategoriesForSeller(s.id)
    return mapSeller(s, topCategories)
  },

  async getSquare(id: string): Promise<SquareAIContext | null> {
    const sq = await prisma.square.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        type: true,
        status: true,
        city: true,
        state: true,
        country: true,
        physicalAddress: true,
        latitude: true,
        longitude: true,
        memberCount: true,
        followerCount: true,
        updated_at: true,
      },
    })
    if (!sq) return null
    const topCategories = await deriveTopCategoriesForSquare(sq.id)
    return {
      entityType: 'SQUARE',
      id: sq.id,
      name: sq.name,
      slug: sq.slug,
      description: sq.description ?? null,
      type: sq.type as 'GEOGRAPHIC' | 'CATEGORY',
      status: sq.status,
      city: sq.city ?? null,
      state: sq.state ?? null,
      country: sq.country,
      physicalAddress: sq.physicalAddress ?? null,
      latitude: sq.latitude ?? null,
      longitude: sq.longitude ?? null,
      memberCount: sq.memberCount,
      followerCount: sq.followerCount,
      topCategories,
      updatedAt: sq.updated_at.toISOString(),
    }
  },

  async getBatch(
    entityType: EntityType,
    limit: number,
    offset: number,
    updatedSince?: Date,
  ): Promise<BatchContextResponse> {
    const take = Math.min(limit, 100)

    switch (entityType) {
      case 'PRODUCT': {
        const where: Prisma.ProductsWhereInput = {
          status: 'PUBLISHED',
          ...(updatedSince && { updated_at: { gte: updatedSince } }),
        }
        const [products, total] = await Promise.all([
          prisma.products.findMany({
            where,
            include: productInclude,
            take,
            skip: offset,
            orderBy: { updated_at: 'desc' },
          }),
          prisma.products.count({ where }),
        ])
        return {
          entityType,
          items: products.map(mapProduct),
          total,
          limit: take,
          offset,
          hasMore: offset + products.length < total,
        }
      }

      case 'SELLER': {
        const where: Prisma.SellerProfileWhereInput = {
          is_active: true,
          ...(updatedSince && { updated_at: { gte: updatedSince } }),
        }
        const [sellers, total] = await Promise.all([
          prisma.sellerProfile.findMany({
            where,
            select: sellerFullSelect,
            take,
            skip: offset,
            orderBy: { updated_at: 'desc' },
          }),
          prisma.sellerProfile.count({ where }),
        ])

        const topCategoriesMap = new Map<string, string[]>()
        await withConcurrency(sellers, 5, async (s) => {
          topCategoriesMap.set(s.id, await deriveTopCategoriesForSeller(s.id))
        })

        return {
          entityType,
          items: sellers.map((s) =>
            mapSeller(s, topCategoriesMap.get(s.id) ?? []),
          ),
          total,
          limit: take,
          offset,
          hasMore: offset + sellers.length < total,
        }
      }

      case 'SQUARE': {
        const where: Prisma.SquareWhereInput = {
          status: 'ACTIVE',
          ...(updatedSince && { updated_at: { gte: updatedSince } }),
        }
        const [squares, total] = await Promise.all([
          prisma.square.findMany({
            where,
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              type: true,
              status: true,
              city: true,
              state: true,
              country: true,
              physicalAddress: true,
              latitude: true,
              longitude: true,
              memberCount: true,
              followerCount: true,
              updated_at: true,
            },
            take,
            skip: offset,
            orderBy: { updated_at: 'desc' },
          }),
          prisma.square.count({ where }),
        ])

        const topCategoriesMap = new Map<string, string[]>()
        await withConcurrency(squares, 5, async (sq) => {
          topCategoriesMap.set(sq.id, await deriveTopCategoriesForSquare(sq.id))
        })

        return {
          entityType,
          items: squares.map(
            (sq) =>
              ({
                entityType: 'SQUARE' as const,
                id: sq.id,
                name: sq.name,
                slug: sq.slug,
                description: sq.description ?? null,
                type: sq.type as 'GEOGRAPHIC' | 'CATEGORY',
                status: sq.status,
                city: sq.city ?? null,
                state: sq.state ?? null,
                country: sq.country,
                physicalAddress: sq.physicalAddress ?? null,
                latitude: sq.latitude ?? null,
                longitude: sq.longitude ?? null,
                memberCount: sq.memberCount,
                followerCount: sq.followerCount,
                topCategories: topCategoriesMap.get(sq.id) ?? [],
                updatedAt: sq.updated_at.toISOString(),
              }) satisfies SquareAIContext,
          ),
          total,
          limit: take,
          offset,
          hasMore: offset + squares.length < total,
        }
      }
    }
  },
}
