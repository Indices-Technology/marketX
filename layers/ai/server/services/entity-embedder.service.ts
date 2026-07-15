// Live embedding hooks — called fire-and-forget whenever a product, seller,
// or square is created or updated. Keeps the Embedding table in sync with
// production data without blocking the originating request.
//
// Text is built locally, SHA-256 hashed, then sent to OpenAI only when the
// content has actually changed (same hash = no API call, no DB write).
//
// This is the WRITE path of the vector index. The READ path (semantic query)
// lives in /api/ai/search — both share the embedding model via embedText().

import { createHash } from 'crypto'
import { prisma } from '~~/server/utils/db'
import { aiContextService } from './ai-context.service'
import { embedText } from '../utils/openai-embedding'

// ── Content hash ──────────────────────────────────────────────────────────────

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

// ── Text builders ─────────────────────────────────────────────────────────────

function buildProductText(p: Record<string, any>): string {
  const parts: string[] = [`Product: ${p.title}`]
  if (p.description)
    parts.push(p.description.replace(/<[^>]+>/g, '').slice(0, 400))
  if (p.seller?.storeName) parts.push(`Sold by: ${p.seller.storeName}`)
  if (p.seller?.publicId) parts.push(`Seller ID: ${p.seller.publicId}`)
  if (p.seller?.locationLabel)
    parts.push(`Seller location: ${p.seller.locationLabel}`)
  if (p.seller?.city) parts.push(`City: ${p.seller.city}`)
  if (p.seller?.state) parts.push(`State: ${p.seller.state}`)
  if (p.price != null) parts.push(`Price: ₦${p.price}`)
  if (p.discount) parts.push(`Discount: ${p.discount}%`)
  if (p.isDeal) parts.push('This is a flash deal.')
  if (p.isThrift) parts.push('Pre-loved / thrift item.')
  if (p.condition) parts.push(`Condition: ${p.condition}`)
  if (p.categories?.length) parts.push(`Categories: ${p.categories.join(', ')}`)
  if (p.tags?.length) parts.push(`Tags: ${p.tags.join(', ')}`)
  if (p.variants?.length) {
    const sizes = p.variants.map((v: any) => v.size).join(', ')
    const inStock = p.variants.some((v: any) => v.stock > 0)
    parts.push(`Available sizes: ${sizes}`)
    parts.push(inStock ? 'In stock.' : 'Currently out of stock.')
  }
  if (p.square?.name) parts.push(`Listed in: ${p.square.name}`)
  if (p.averageRating)
    parts.push(`Rating: ${p.averageRating}/5 (${p.totalReviews} reviews)`)
  return parts.join('\n')
}

function buildSellerText(s: Record<string, any>): string {
  const parts: string[] = [`Seller: ${s.storeName}`]
  // Public Seller ID (e.g. MX-PLA-VDKR) — printed on cards/QR; include it so a
  // query that names the ID resolves to this store.
  if (s.publicId) parts.push(`Seller ID: ${s.publicId}`)
  if (s.storeDescription)
    parts.push(s.storeDescription.replace(/<[^>]+>/g, '').slice(0, 400))
  if (s.locationLabel) parts.push(`Location: ${s.locationLabel}`)
  if (s.city) parts.push(`City: ${s.city}`)
  if (s.state) parts.push(`State: ${s.state}`)
  if (s.podEnabled) {
    const zones = Array.isArray(s.podZones) ? s.podZones.join(', ') : ''
    parts.push(`Pay-on-delivery available${zones ? ` in: ${zones}` : ''}.`)
  }
  if (s.shipFromCity)
    parts.push(`Ships from: ${s.shipFromCity}, ${s.shipFromState ?? ''}`)
  if (s.isVerified) parts.push('Verified seller.')
  if (s.isPremium) parts.push('Premium seller.')
  if (s.averageRating)
    parts.push(`Rating: ${s.averageRating}/5 (${s.totalReviews} reviews)`)
  if (s.followersCount) parts.push(`Followers: ${s.followersCount}`)
  if (s.topCategories?.length)
    parts.push(`Top categories: ${s.topCategories.join(', ')}`)
  if (s.primarySquare?.name)
    parts.push(`Primary market: ${s.primarySquare.name}`)
  return parts.join('\n')
}

function buildSquareText(sq: Record<string, any>): string {
  const parts: string[] = [`Market/Square: ${sq.name}`]
  if (sq.description)
    parts.push(sq.description.replace(/<[^>]+>/g, '').slice(0, 400))
  parts.push(
    `Type: ${sq.type === 'GEOGRAPHIC' ? 'Physical market' : 'Online category market'}`,
  )
  if (sq.city) parts.push(`City: ${sq.city}`)
  if (sq.state) parts.push(`State: ${sq.state}`)
  if (sq.physicalAddress) parts.push(`Address: ${sq.physicalAddress}`)
  if (sq.latitude && sq.longitude)
    parts.push(`GPS: ${sq.latitude}, ${sq.longitude}`)
  if (sq.memberCount) parts.push(`${sq.memberCount} sellers.`)
  if (sq.followerCount) parts.push(`${sq.followerCount} followers.`)
  if (sq.topCategories?.length)
    parts.push(`Top categories: ${sq.topCategories.join(', ')}`)
  return parts.join('\n')
}

// ── Core upsert ───────────────────────────────────────────────────────────────

async function upsertEmbedding(
  entityType: string,
  entityId: string,
  text: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const contentHash = sha256(text)

  // Skip if content unchanged
  const existing = await prisma.embedding.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
    select: { contentHash: true },
  })
  if (existing?.contentHash === contentHash) return

  // Prisma upsert for non-vector columns
  await prisma.embedding.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    create: { entityType, entityId, metadata, contentHash },
    update: { metadata, contentHash, updatedAt: new Date() },
  })

  // Generate and write vector
  const vec = await embedText(text)
  const vecStr = `[${vec.join(',')}]`

  await prisma.$executeRaw`
    UPDATE "Embedding"
    SET    embedding = ${vecStr}::vector
    WHERE  "entityType" = ${entityType}
    AND    "entityId"   = ${entityId}
  `
}

// ── Public hooks ──────────────────────────────────────────────────────────────
// All are fire-and-forget — call without await in service layer.

export const entityEmbedder = {
  /**
   * Called after a product is created or updated.
   * Fetches full context via aiContextService (same data the indexer uses).
   */
  embedProduct(productId: number): void {
    if (!process.env.OPENAI_API_KEY) return

    setImmediate(async () => {
      try {
        const ctx = await aiContextService.getProduct(productId)
        if (!ctx) return

        const c = ctx as any
        const text = buildProductText(c)
        const inStockSizes: string[] = (c.variants ?? [])
          .filter((v: any) => v.stock > 0)
          .map((v: any) => v.size)
        const metadata: Record<string, unknown> = {
          entityType: 'PRODUCT',
          entityId: String(productId),
          title: c.title,
          // Plain-text, truncated — so search hits carry readable specifics,
          // not just a matchable vector.
          description: c.description
            ? c.description.replace(/<[^>]+>/g, '').slice(0, 300)
            : null,
          price: c.price,
          discount: c.discount ?? null,
          condition: c.condition ?? null,
          isThrift: c.isThrift ?? false,
          isDeal: c.isDeal ?? false,
          averageRating: c.averageRating ?? null,
          totalReviews: c.totalReviews ?? 0,
          categories: c.categories ?? [],
          tags: c.tags ?? [],
          slug: c.slug,
          imageUrl: c.imageUrl ?? null,
          inStock: c.variants?.some((v: any) => v.stock > 0) ?? true,
          inStockSizes,
          sellerName: c.seller?.storeName,
          sellerPublicId: c.seller?.publicId ?? null,
        }

        await upsertEmbedding('PRODUCT', String(productId), text, metadata)
      } catch (err) {
        console.error(
          `[embedder] product ${productId}:`,
          (err as Error).message,
        )
      }
    })
  },

  embedSeller(sellerId: string): void {
    if (!process.env.OPENAI_API_KEY) return

    setImmediate(async () => {
      try {
        const ctx = await aiContextService.getSeller(sellerId)
        if (!ctx) return

        const text = buildSellerText(ctx as any)
        const metadata: Record<string, unknown> = {
          entityType: 'SELLER',
          entityId: sellerId,
          publicId: (ctx as any).publicId ?? null,
          storeName: (ctx as any).storeName,
          storeSlug: (ctx as any).storeSlug,
          locationLabel: (ctx as any).locationLabel,
          city: (ctx as any).city,
          state: (ctx as any).state,
          isVerified: (ctx as any).isVerified,
        }

        await upsertEmbedding('SELLER', sellerId, text, metadata)
      } catch (err) {
        console.error(`[embedder] seller ${sellerId}:`, (err as Error).message)
      }
    })
  },

  embedSquare(squareId: string): void {
    if (!process.env.OPENAI_API_KEY) return

    setImmediate(async () => {
      try {
        const ctx = await aiContextService.getSquare(squareId)
        if (!ctx) return

        const text = buildSquareText(ctx as any)
        const metadata: Record<string, unknown> = {
          entityType: 'SQUARE',
          entityId: squareId,
          name: (ctx as any).name,
          slug: (ctx as any).slug,
          type: (ctx as any).type,
          city: (ctx as any).city,
          state: (ctx as any).state,
        }

        await upsertEmbedding('SQUARE', squareId, text, metadata)
      } catch (err) {
        console.error(`[embedder] square ${squareId}:`, (err as Error).message)
      }
    })
  },
}
