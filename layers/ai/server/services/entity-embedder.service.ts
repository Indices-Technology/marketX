// Live embedding hooks — called fire-and-forget whenever a product, seller,
// or square is created or updated. Keeps the Embedding table in sync with
// production data without blocking the originating request.
//
// Text is built locally, SHA-256 hashed, then sent to OpenAI only when the
// content has actually changed (same hash = no API call, no DB write).

import { createHash } from 'crypto'
import { prisma } from '~~/server/utils/db'
import { aiContextService } from './ai-context.service'

// ── OpenAI embedding (fetch — no SDK dependency needed) ───────────────────────

async function callOpenAIEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`OpenAI embeddings API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
  const vec = data.data[0]?.embedding
  if (!vec || vec.length !== 1536)
    throw new Error(`Unexpected vector length: ${vec?.length}`)
  return vec
}

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
  const vec = await callOpenAIEmbedding(text)
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

        const text = buildProductText(ctx as any)
        const metadata: Record<string, unknown> = {
          entityType: 'PRODUCT',
          entityId: String(productId),
          title: (ctx as any).title,
          price: (ctx as any).price,
          discount: (ctx as any).discount ?? null,
          slug: (ctx as any).slug,
          imageUrl: (ctx as any).media?.[0]?.url ?? null,
          inStock: (ctx as any).variants?.some((v: any) => v.stock > 0) ?? true,
          sellerName: (ctx as any).seller?.storeName,
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
