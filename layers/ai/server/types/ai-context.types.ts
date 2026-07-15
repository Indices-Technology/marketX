// ── Embeddable entity types ───────────────────────────────────────────────────

export type EntityType = 'PRODUCT' | 'SELLER' | 'SQUARE'

// ── Shared sub-types ──────────────────────────────────────────────────────────

export interface VariantContext {
  size: string
  stock: number
  price: number | null
}

/** Minimal seller info embedded inside a ProductAIContext */
export interface SellerSummary {
  id: string
  publicId: string | null
  storeName: string
  storeSlug: string
  locationLabel: string | null
  city: string | null
  state: string | null
  isVerified: boolean
  averageRating: number | null
  podEnabled: boolean
  podZones: string[]
}

/** Minimal square info embedded inside product/seller contexts */
export interface SquareSummary {
  id: string
  name: string
  slug: string
  type: 'GEOGRAPHIC' | 'CATEGORY'
  city: string | null
  state: string | null
}

// ── Per-entity context shapes ─────────────────────────────────────────────────

/**
 * Full product context for embedding.
 * Captures everything a buyer might ask about a specific item:
 * price, variants/sizes, seller location, square, categories, tags.
 */
export interface ProductAIContext {
  entityType: 'PRODUCT'
  id: string // int → string for uniform entity_id storage
  slug: string
  title: string
  imageUrl: string | null // first non-audio media, for card rendering
  description: string | null
  price: number
  discount: number | null
  condition: string | null
  isThrift: boolean
  isDeal: boolean
  status: string
  averageRating: number | null
  totalReviews: number
  soldCount: number
  viewCount: number
  variants: VariantContext[]
  categories: string[]
  tags: string[]
  seller: SellerSummary
  square: SquareSummary | null
  updatedAt: string // ISO 8601
}

/**
 * Full seller context for embedding.
 * Captures who the seller is, where they operate, what they sell,
 * delivery capabilities, and reputation.
 */
export interface SellerAIContext {
  entityType: 'SELLER'
  id: string
  publicId: string | null
  storeName: string
  storeSlug: string
  storeDescription: string | null
  locationLabel: string | null
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  hideLocation: boolean
  shipFromCity: string | null
  shipFromState: string | null
  podEnabled: boolean
  podZones: string[]
  isVerified: boolean
  isPremium: boolean
  averageRating: number | null
  totalReviews: number
  followersCount: number
  businessHours: unknown // { mon:{open,close,closed}, ... } — opaque to the type layer
  primarySquare: SquareSummary | null
  topCategories: string[] // derived: top 6 categories by published product count
  updatedAt: string
}

/**
 * Full square context for embedding.
 * Captures the market identity — physical or category-based — including
 * location, membership size, and the product categories sold inside it.
 */
export interface SquareAIContext {
  entityType: 'SQUARE'
  id: string
  name: string
  slug: string
  description: string | null
  type: 'GEOGRAPHIC' | 'CATEGORY'
  status: string
  city: string | null
  state: string | null
  country: string
  physicalAddress: string | null
  latitude: number | null
  longitude: number | null
  memberCount: number
  followerCount: number
  topCategories: string[] // derived: top 8 categories by published product count
  updatedAt: string
}

/** Discriminated union of all embeddable entity contexts */
export type AIEntityContext =
  | ProductAIContext
  | SellerAIContext
  | SquareAIContext

// ── Batch response ────────────────────────────────────────────────────────────

export interface BatchContextResponse {
  entityType: EntityType
  items: AIEntityContext[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}
