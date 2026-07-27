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

export const growthAssetService = {
  /**
   * Get (or create) the Growth Asset for a product the seller owns, ensuring it
   * has a CARD distribution, and return the tracked link the card should encode.
   */
  async fromProduct(args: {
    productId: number
    sellerId: string
    baseUrl: string
  }): Promise<GrowthAssetResult> {
    const { productId, sellerId, baseUrl } = args

    // Ownership + the fields the card/commerce identity needs.
    const product = await prisma.products.findFirst({
      where: { id: productId, sellerId },
      select: {
        id: true,
        slug: true,
        socialCaptions: true,
        seller: { select: { publicId: true } },
      },
    })
    if (!product) {
      throw new UserError('PRODUCT_NOT_FOUND', 'Product not found or not yours', 404)
    }

    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/product/${product.slug}`

    // Reuse an existing asset for this product if present.
    const existing = await prisma.growthAsset.findFirst({
      where: { sellerId, productId },
      select: { id: true, productId: true, status: true, content: true, commerce: true },
    })
    if (existing) {
      const card = await prisma.assetDistribution.findFirst({
        where: { assetId: existing.id, channel: 'CARD' },
        select: { shortCode: true },
      })
      const code =
        card?.shortCode ??
        (await mintDistribution({ assetId: existing.id, channel: 'CARD', baseUrl }))
          .shortCode
      return shape(existing, trackedUrl(code, baseUrl))
    }

    const asset = await prisma.growthAsset.create({
      data: {
        sellerId,
        productId,
        intent: 'SELL',
        status: 'DRAFT',
        content: {
          cardImageUrl: '',
          cardPublicId: '',
          captions: (product.socialCaptions ?? {}) as object,
        },
        commerce: {
          productRef: String(productId),
          sellerPublicId: product.seller?.publicId ?? null,
          canonicalUrl,
        },
      },
      select: { id: true, productId: true, status: true, content: true, commerce: true },
    })

    const minted = await mintDistribution({ assetId: asset.id, channel: 'CARD', baseUrl })
    return shape(asset, minted.trackedUrl)
  },

  /** Attach the rendered+uploaded card image to an asset the seller owns. */
  async attachCard(args: {
    assetId: string
    sellerId: string
    cardImageUrl: string
    cardPublicId: string
    qrPublicId?: string
  }) {
    const asset = await prisma.growthAsset.findFirst({
      where: { id: args.assetId, sellerId: args.sellerId },
      select: { id: true, content: true, commerce: true },
    })
    if (!asset) throw new UserError('ASSET_NOT_FOUND', 'Growth asset not found', 404)

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
}
