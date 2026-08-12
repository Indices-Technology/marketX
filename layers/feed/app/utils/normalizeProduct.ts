import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'

/** Raw media row as returned by the product endpoints (superset of IFeedItem's). */
interface RawProductMedia {
  id: string
  url: string
  type?: string
  isBgMusic?: boolean
  altText?: string | null
}

/**
 * The subset of a raw product row this normalizer reads. Deliberately
 * structural rather than the full Prisma/IProduct type: the shapes returned by
 * /api/commerce/products and /api/feed/deals differ in which optional columns
 * they select, and only these fields are needed to build a feed item.
 */
export interface RawProductRow {
  id: number | string
  title?: string
  description?: string | null
  created_at: string | Date
  sellerId?: string
  viewCount?: number
  /** Denormalized column on the product row; fallback when `seller` isn't selected. */
  store_slug?: string | null
  media?: RawProductMedia[]
  seller?: {
    store_name?: string | null
    store_slug?: string | null
    store_logo?: string | null
  }
  _count?: { likes?: number; comments?: number }
}

/**
 * Client-side mirror of the server's `normalizeProduct` (layers/feed/server/
 * utils/feed.utils.ts), for endpoints that return raw product rows rather than
 * already-normalized feed items — e.g. `/api/commerce/products` (the real
 * product-filtering API) and `/api/feed/deals`.
 *
 * Why this exists rather than spreading the product directly: a raw product's
 * `media` is an ARRAY, while `IFeedItem.media` is a SINGLE object with
 * `mediaItems` holding the array. Spreading a product into a feed item shape
 * therefore produces an `IFeedItem` whose `media` is an array and whose
 * `mediaItems` is missing entirely — consumers (FeedSlide's media carousel,
 * ReelItem's video lookup) then read `.url` off an array and get `undefined`,
 * rendering a broken/blank slide. Normalizing keeps one shape everywhere.
 */
export const normalizeProductToFeedItem = (
  product: RawProductRow,
): IFeedItem => {
  const allMedia = product.media ?? []
  const isMusicItem = (m: RawProductMedia) => m.isBgMusic || m.type === 'AUDIO'
  const contentMedia = allMedia.filter((m) => !isMusicItem(m))
  const bgMusicItem = allMedia.find(isMusicItem)
  const primaryMedia = contentMedia[0]

  return {
    // Namespaced so a product and a post can never collide on id — the feed
    // renders both in one list keyed by id.
    id: `product-${product.id}`,
    type: 'PRODUCT',
    created_at: product.created_at as IFeedItem['created_at'],
    author: {
      id: product.sellerId ?? '',
      username:
        product.seller?.store_name || product.seller?.store_slug || 'Unknown',
      avatar: product.seller?.store_logo || undefined,
      role: 'seller',
      storeSlug: product.seller?.store_slug ?? product.store_slug ?? null,
      tier:
        ((product.seller as { trustTier?: string | null } | undefined)
          ?.trustTier as IFeedItem['author']['tier']) ?? null,
    },
    media: primaryMedia
      ? {
          id: primaryMedia.id,
          url: primaryMedia.url,
          type: primaryMedia.type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        }
      : undefined,
    mediaItems: contentMedia.map((m) => ({
      id: m.id,
      url: m.url,
      type: (m.type === 'VIDEO'
        ? 'VIDEO'
        : m.type === 'AUDIO'
          ? 'AUDIO'
          : 'IMAGE') as 'IMAGE' | 'VIDEO' | 'AUDIO',
    })),
    bgMusic: bgMusicItem
      ? {
          id: bgMusicItem.id,
          url: bgMusicItem.url,
          name: bgMusicItem.altText ?? undefined,
        }
      : undefined,
    caption: product.title ?? '',
    content: product.description ?? null,
    contentType: 'PRODUCT',
    likeCount: product._count?.likes ?? 0,
    commentCount: product._count?.comments ?? 0,
    shareCount: 0,
    viewCount: product.viewCount ?? 0,
    taggedProducts: [],
    product: product as unknown as IFeedItem['product'],
  }
}
