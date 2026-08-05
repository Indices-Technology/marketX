/**
 * Growth Asset service — turns a product into a trackable, reusable Growth Asset.
 *
 * A Growth Asset is the card's record: its commerce identity (product, seller,
 * canonical URL) plus, once rendered, the hosted card image. Its **CARD**
 * distribution's short link is what the QR encodes — scanning it logs attribution
 * and redirects to the product. Get-or-create keeps one asset per (seller,
 * product), so re-promoting the same product reuses the same tracked link.
 *
 * Extractable boundary: reads the product table via prisma (like shipping reads
 * orders) but the growth value objects never import the Product type.
 */

import { prisma } from '~~/server/utils/db'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { mintDistribution, trackedUrl } from './shortlink.service'

/** True if the user owns the store (sellerProfile) — multi-store safe ownership. */
async function userOwnsStore(
  userId: string,
  sellerId: string,
): Promise<boolean> {
  const owns = await prisma.sellerProfile.findFirst({
    where: { id: sellerId, profileId: userId },
    select: { id: true },
  })
  return !!owns
}

export interface GrowthAssetResult {
  id: string
  productId: number | null
  status: string
  cardImageUrl: string
  canonicalUrl: string
  /** The CARD short link the QR encodes / the caption carries. */
  trackedUrl: string
}

function shape(
  asset: {
    id: string
    productId: number | null
    status: string
    content: unknown
    commerce: unknown
  },
  tracked: string,
): GrowthAssetResult {
  const content = (asset.content ?? {}) as { cardImageUrl?: string }
  const commerce = (asset.commerce ?? {}) as { canonicalUrl?: string }
  return {
    id: asset.id,
    productId: asset.productId,
    status: asset.status,
    cardImageUrl: content.cardImageUrl ?? '',
    canonicalUrl: commerce.canonicalUrl ?? '',
    trackedUrl: tracked,
  }
}

type AssetRow = {
  id: string
  productId: number | null
  status: string
  content: unknown
  commerce: unknown
}

/** Loads the product this asset would belong to — no caller-identity check. */
async function loadProductForAsset(productId: number) {
  const product = await prisma.products.findFirst({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      sellerId: true,
      status: true,
      affiliateCommission: true,
      socialCaptions: true,
      seller: { select: { publicId: true, profileId: true } },
    },
  })
  if (!product)
    throw new UserError('PRODUCT_NOT_FOUND', 'Product not found', 404)
  return product
}

/** Get (or create) the seller's canonical Growth Asset row for a product. */
async function getOrCreateAsset(
  product: Awaited<ReturnType<typeof loadProductForAsset>>,
  baseUrl: string,
): Promise<AssetRow> {
  const existing = await prisma.growthAsset.findFirst({
    where: { sellerId: product.sellerId, productId: product.id },
    select: {
      id: true,
      productId: true,
      status: true,
      content: true,
      commerce: true,
    },
  })
  if (existing) return existing

  const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/product/${product.slug}`
  return prisma.growthAsset.create({
    data: {
      sellerId: product.sellerId,
      productId: product.id,
      intent: 'SELL',
      status: 'DRAFT',
      content: {
        cardImageUrl: '',
        cardPublicId: '',
        captions: (product.socialCaptions ?? {}) as object,
      },
      commerce: {
        productRef: String(product.id),
        sellerPublicId: product.seller?.publicId ?? null,
        canonicalUrl,
      },
    },
    select: {
      id: true,
      productId: true,
      status: true,
      content: true,
      commerce: true,
    },
  })
}

export const growthAssetService = {
  /**
   * Get (or create) the Growth Asset for a product the seller owns, ensuring it
   * has a CARD distribution, and return the tracked link the card should encode.
   */
  async fromProduct(args: {
    productId: number
    userId: string
    baseUrl: string
  }): Promise<GrowthAssetResult> {
    const { productId, userId, baseUrl } = args

    // Resolve ownership via the PRODUCT's store owner, not the caller's primary
    // store — a user can own several stores, so the product's sellerId is the
    // source of truth for which store this asset belongs to.
    const product = await loadProductForAsset(productId)
    if (product.seller?.profileId !== userId) {
      throw new UserError(
        'PRODUCT_NOT_FOUND',
        'Product not found or not yours',
        404,
      )
    }

    const asset = await getOrCreateAsset(product, baseUrl)
    const card = await prisma.assetDistribution.findFirst({
      where: { assetId: asset.id, channel: 'CARD', sharerProfileId: null },
      select: { shortCode: true },
    })
    const code =
      card?.shortCode ??
      (await mintDistribution({ assetId: asset.id, channel: 'CARD', baseUrl }))
        .shortCode
    return shape(asset, trackedUrl(code, baseUrl))
  },

  /**
   * Get (or create) a personal, per-sharer tracked link for a product — used by
   * anyone who isn't the owning seller: an enrolled affiliate's own AFFILIATE
   * card, or any other signed-in viewer's ORGANIC_SHARE card. Each (product,
   * channel, sharer) triple gets its own short code, so clicks/scans roll up per
   * sharer instead of all landing on the seller's single CARD link.
   */
  async forSharer(args: {
    productId: number
    sharerProfileId: string
    channel: 'ORGANIC_SHARE' | 'AFFILIATE'
    baseUrl: string
  }): Promise<GrowthAssetResult> {
    const { productId, sharerProfileId, channel, baseUrl } = args

    const product = await loadProductForAsset(productId)
    if (product.status !== 'PUBLISHED') {
      throw new UserError('PRODUCT_NOT_FOUND', 'Product not found', 404)
    }
    if (channel === 'AFFILIATE') {
      if (!product.affiliateCommission || product.affiliateCommission <= 0) {
        throw new UserError(
          'NOT_AFFILIATABLE',
          'This product is not open to affiliates',
          400,
        )
      }
      const sharer = await prisma.profile.findUnique({
        where: { id: sharerProfileId },
        select: { affiliateCode: true },
      })
      if (!sharer?.affiliateCode) {
        throw new UserError(
          'NOT_ENROLLED',
          'Enroll as an affiliate before sharing an affiliate link',
          403,
        )
      }
    }

    const asset = await getOrCreateAsset(product, baseUrl)
    const existing = await prisma.assetDistribution.findFirst({
      where: { assetId: asset.id, channel, sharerProfileId },
      select: { shortCode: true },
    })
    const code =
      existing?.shortCode ??
      (
        await mintDistribution({
          assetId: asset.id,
          channel,
          baseUrl,
          sharerProfileId,
        })
      ).shortCode
    return shape(asset, trackedUrl(code, baseUrl))
  },

  /**
   * Get (or create) the seller's EMBED distribution for a product they own — the
   * tracked link a third-party <iframe> (their own blog/site) points at. One per
   * (seller, product), like the CARD link, since embedding is the seller
   * publishing their own product on their own site, not a per-viewer share.
   *
   * Returns the product slug + short code (not just the /r/ tracked link) so the
   * caller can build the <iframe src="/embed/product/{slug}?code={shortCode}">
   * snippet — the embed page uses that same code to log VIEW events and to link
   * its own CTA through /r/{shortCode} (which logs the CLICK on the way through).
   */
  async forEmbed(args: {
    productId: number
    userId: string
    baseUrl: string
  }): Promise<GrowthAssetResult & { slug: string; shortCode: string }> {
    const { productId, userId, baseUrl } = args

    const product = await loadProductForAsset(productId)
    if (product.seller?.profileId !== userId) {
      throw new UserError(
        'PRODUCT_NOT_FOUND',
        'Product not found or not yours',
        404,
      )
    }

    const asset = await getOrCreateAsset(product, baseUrl)
    const existing = await prisma.assetDistribution.findFirst({
      where: { assetId: asset.id, channel: 'EMBED', sharerProfileId: null },
      select: { shortCode: true },
    })
    const code =
      existing?.shortCode ??
      (await mintDistribution({ assetId: asset.id, channel: 'EMBED', baseUrl }))
        .shortCode
    return {
      ...shape(asset, trackedUrl(code, baseUrl)),
      slug: product.slug,
      shortCode: code,
    }
  },

  /** Attach the rendered+uploaded card image to an asset the user owns. */
  async attachCard(args: {
    assetId: string
    userId: string
    cardImageUrl: string
    cardPublicId: string
    qrPublicId?: string
  }) {
    const asset = await prisma.growthAsset.findUnique({
      where: { id: args.assetId },
      select: { id: true, content: true, commerce: true, sellerId: true },
    })
    if (!asset || !(await userOwnsStore(args.userId, asset.sellerId))) {
      throw new UserError('ASSET_NOT_FOUND', 'Growth asset not found', 404)
    }

    const content = (asset.content ?? {}) as Record<string, unknown>
    const commerce = (asset.commerce ?? {}) as Record<string, unknown>
    content.cardImageUrl = args.cardImageUrl
    content.cardPublicId = args.cardPublicId
    if (args.qrPublicId) commerce.qrPublicId = args.qrPublicId

    await prisma.growthAsset.update({
      where: { id: asset.id },
      data: { content, commerce, status: 'APPROVED' },
    })
    return { success: true }
  },

  /** List a seller's growth assets (safe fields only). */
  async listForSeller(sellerId: string) {
    return prisma.growthAsset.findMany({
      where: { sellerId },
      select: {
        id: true,
        productId: true,
        status: true,
        content: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })
  },

  /**
   * The Growth tab's data: every asset plus its rollup funnel (shared →
   * viewed → scanned → leads → orders), summed across all its distributions
   * (CARD, TikTok, organic shares, ...). Manual joins, not Prisma relations —
   * growth reads the Products table by scalar id (extractability boundary,
   * see docs/GROWTH_ENGINE.md §5), it never gets a `product` relation to include.
   */
  async dashboardForSeller(sellerId: string) {
    const zeroEvents = (): Record<AttributionEventType, number> => ({
      VIEW: 0,
      SCAN: 0,
      CLICK: 0,
      LEAD: 0,
      ORDER: 0,
    })

    const assets = await prisma.growthAsset.findMany({
      where: { sellerId },
      select: { id: true, productId: true, status: true, content: true, created_at: true },
      orderBy: { created_at: 'desc' },
    })
    if (assets.length === 0) {
      return { assets: [] as GrowthDashboardAsset[], summary: { assets: 0, distributions: 0, events: zeroEvents() } }
    }

    const assetIds = assets.map((a) => a.id)
    const distributions = await prisma.assetDistribution.findMany({
      where: { assetId: { in: assetIds } },
      select: { id: true, assetId: true },
    })
    const distIdsByAsset = new Map<string, string[]>()
    for (const d of distributions) {
      const list = distIdsByAsset.get(d.assetId) ?? []
      list.push(d.id)
      distIdsByAsset.set(d.assetId, list)
    }

    const distIds = distributions.map((d) => d.id)
    const eventGroups = distIds.length
      ? await prisma.attributionEvent.groupBy({
          by: ['distributionId', 'type'],
          where: { distributionId: { in: distIds } },
          _count: { _all: true },
        })
      : []
    const eventsByDist = new Map<string, Partial<Record<AttributionEventType, number>>>()
    for (const row of eventGroups) {
      const m = eventsByDist.get(row.distributionId) ?? {}
      m[row.type as AttributionEventType] = row._count._all
      eventsByDist.set(row.distributionId, m)
    }

    const productIds = [...new Set(assets.map((a) => a.productId).filter((id): id is number => id != null))]
    const products = productIds.length
      ? await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, title: true, bannerImageUrl: true },
        })
      : []
    const productById = new Map(products.map((p) => [p.id, p]))

    const shapedAssets: GrowthDashboardAsset[] = assets.map((a) => {
      const dIds = distIdsByAsset.get(a.id) ?? []
      const events = zeroEvents()
      for (const dId of dIds) {
        const m = eventsByDist.get(dId)
        if (!m) continue
        for (const t of Object.keys(events) as AttributionEventType[]) events[t] += m[t] ?? 0
      }
      const content = (a.content ?? {}) as { cardImageUrl?: string }
      const product = a.productId != null ? productById.get(a.productId) : undefined
      return {
        id: a.id,
        productId: a.productId,
        productTitle: product?.title ?? null,
        productImage: product?.bannerImageUrl ?? null,
        status: a.status,
        cardImageUrl: content.cardImageUrl ?? '',
        createdAt: a.created_at.toISOString(),
        distributions: dIds.length,
        events,
      }
    })

    const summary = shapedAssets.reduce(
      (acc, a) => {
        acc.assets += 1
        acc.distributions += a.distributions
        for (const t of Object.keys(acc.events) as AttributionEventType[]) acc.events[t] += a.events[t]
        return acc
      },
      { assets: 0, distributions: 0, events: zeroEvents() },
    )

    return { assets: shapedAssets, summary }
  },
}

type AttributionEventType = 'VIEW' | 'SCAN' | 'CLICK' | 'LEAD' | 'ORDER'

export interface GrowthDashboardAsset {
  id: string
  productId: number | null
  productTitle: string | null
  productImage: string | null
  status: string
  cardImageUrl: string
  createdAt: string
  /** How many channels this asset has been shared to (CARD counts as one). */
  distributions: number
  events: Record<AttributionEventType, number>
}
