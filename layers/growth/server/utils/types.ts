/**
 * Growth Engine — domain model & channel contract.
 *
 * Pure value objects. They MUST NOT reference Product, SellerProfile, Order or any
 * commerce model — that boundary keeps the Growth layer independently extractable
 * (see docs/GROWTH_ENGINE.md §5). Cross-boundary data (a product, a seller) enters
 * as opaque refs, never as a Prisma model.
 */

// ─── Channels ─────────────────────────────────────────────────────────────────
// Matches the GrowthChannel enum in prisma/schema.prisma (kebab wire form).

export type ChannelId =
  | 'organic-share' // seller shares it themselves — no API, no App Review gate
  | 'meta-fb'
  | 'meta-ig'
  | 'whatsapp'
  | 'email'

/** Maps a wire ChannelId to the Prisma GrowthChannel enum value. */
export const CHANNEL_ENUM: Record<ChannelId, string> = {
  'organic-share': 'ORGANIC_SHARE',
  'meta-fb': 'META_FB',
  'meta-ig': 'META_IG',
  whatsapp: 'WHATSAPP',
  email: 'EMAIL',
}

export interface ChannelCapabilities {
  /** Can push/prepare a Growth Asset for this channel. */
  distribute: boolean
  /** Can pull existing content from this channel into the review grid. */
  import: boolean
  /** Whether the channel supports clickable links in the post body (FB yes, IG no). */
  clickableLink: boolean
  /** Per-seller OAuth + App Review required before real (non-tester) accounts work. */
  requiresAuth: boolean
  /** Max API-published posts per rolling 24h, if the platform caps it (IG: 100). */
  dailyCap?: number
}

// ─── Growth Asset (the reusable, channel-agnostic template) ─────────────────────

export type GrowthIntent = 'SELL' | 'PROMOTE' | 'ANNOUNCE'

export interface AssetContent {
  /** Cloudinary secure_url of the generated card. Serve as f_jpg (IG is JPEG-only). */
  cardImageUrl: string
  cardPublicId: string
  /**
   * Per-channel captions, plus a 'default' fallback. Keyed by ChannelId | 'default'.
   * The orchestrator resolves the caption for each channel at distribution time.
   */
  captions: Partial<Record<ChannelId | 'default', string>>
}

export interface AssetCommerce {
  /** Opaque product id (string form). NOT a Product model — extractable boundary. */
  productRef?: string
  /** Public seller id, e.g. "MX-LAG-J8KP". */
  sellerPublicId: string
  /** Where the QR/link ultimately routes. Attribution is added per distribution. */
  canonicalUrl: string
  qrPublicId?: string
}

export interface GrowthAsset {
  id: string
  intent: GrowthIntent
  content: AssetContent
  commerce: AssetCommerce
}

// ─── Verb seam — the channel contract (Strategy) ────────────────────────────────
// Abstract at the ACTION, not the platform. A keyed action→result map preserves
// compile-time safety through the single execute() dispatch. Add a channel:
// implement IChannelProvider under channels/<id>/ and register it in registry.ts.

export type ChannelActionKind = 'distribute' | 'import'

/**
 * The minimal, channel-agnostic shape a channel needs to distribute an asset.
 * The orchestrator builds this per channel: it resolves the caption and mints the
 * per-distribution `trackedUrl` (the short link that makes attribution possible).
 * The channel never touches the DB or the asset's other channels.
 */
export interface DistributableAsset {
  assetId: string
  distributionId: string
  /** Card image (JPEG) — hosted, public. */
  imageUrl: string
  /** Caption already resolved for THIS channel. */
  caption: string
  /** Per-distribution attributed short link. QR/links point here, not the bare product. */
  trackedUrl: string
}

export interface DistributePayload {
  asset: DistributableAsset
  /** ISO 8601 — when set, an API channel schedules rather than posts immediately. */
  scheduleAt?: string
}

export interface ImportPayload {
  /** Which connected social account to pull from (gated channels only). */
  connectionId: string
  limit?: number
}

export type ChannelAction =
  | { kind: 'distribute'; payload: DistributePayload }
  | { kind: 'import'; payload: ImportPayload }

export type DistributeStatus =
  | 'READY' // organic — client completes the share (share-sheet/download)
  | 'PUBLISHED' // API channel posted immediately
  | 'SCHEDULED' // API channel queued for scheduleAt
  | 'FAILED'

export interface DistributeResult {
  channel: ChannelId
  status: DistributeStatus
  /** Present for organic channels — the client uses this to complete the share. */
  sharePayload?: {
    imageUrl: string
    caption: string
    trackedUrl: string
  }
  /** Present for API channels once posted. */
  remotePostId?: string
  error?: string
}

/** One item pulled from a channel — normalises into a BulkImportRow downstream. */
export interface ImportedItem {
  /** Source post/media id on the origin platform. */
  externalId: string
  /** Cloudinary-hosted media urls (carousel children flattened). */
  media: string[]
  /** Raw caption for AI structured-parse → title/price/sizes. */
  caption?: string
  createdAt?: string
}

export interface ActionResultMap {
  distribute: DistributeResult
  import: ImportedItem[]
}

export interface IChannelProvider {
  readonly id: ChannelId
  readonly name: string
  readonly capabilities: ChannelCapabilities

  /** Capability gate — the orchestrator skips channels that don't support a verb. */
  supports(kind: ChannelActionKind): boolean

  /** Perform one action. Result type is keyed to the action kind. */
  execute<K extends ChannelActionKind>(
    action: Extract<ChannelAction, { kind: K }>,
  ): Promise<ActionResultMap[K]>
}
