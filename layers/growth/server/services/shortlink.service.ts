/**
 * Short-link mint — creates the AssetDistribution rows whose short codes are the
 * unit of attribution (QR on the card + each per-channel share link resolve here
 * via /r/[code]). See docs/GROWTH_ENGINE.md §3.
 */

import { prisma } from '~~/server/utils/db'
import { randomShortCode } from '../utils/shortcode'

/** Mirrors the Prisma GrowthChannel enum (kept as a literal union to stay decoupled). */
export type GrowthChannelValue =
  | 'CARD'
  | 'ORGANIC_SHARE'
  | 'AFFILIATE'
  | 'EMBED'
  | 'TIKTOK'
  | 'META_FB'
  | 'META_IG'
  | 'WHATSAPP'
  | 'EMAIL'

/** Build the public tracked link for a code (`{base}/r/{code}`). */
export function trackedUrl(shortCode: string, baseUrl?: string): string {
  const base = (
    baseUrl ??
    (useRuntimeConfig().public.baseURL as string) ??
    ''
  ).replace(/\/$/, '')
  return `${base}/r/${shortCode}`
}

export interface MintedDistribution {
  distributionId: string
  shortCode: string
  trackedUrl: string
}

/**
 * Create an AssetDistribution with a unique short code and return its tracked
 * link. Retries on the rare shortCode unique-constraint collision (P2002).
 */
export async function mintDistribution(args: {
  assetId: string
  channel: GrowthChannelValue
  baseUrl?: string
  /** Who this specific link belongs to — omit/null for the seller's own CARD link. */
  sharerProfileId?: string | null
}): Promise<MintedDistribution> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = randomShortCode()
    try {
      const row = await prisma.assetDistribution.create({
        data: {
          assetId: args.assetId,
          channel: args.channel,
          shortCode,
          sharerProfileId: args.sharerProfileId ?? null,
        },
        select: { id: true, shortCode: true },
      })
      return {
        distributionId: row.id,
        shortCode: row.shortCode,
        trackedUrl: trackedUrl(row.shortCode, args.baseUrl),
      }
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002' && attempt < 4) continue
      throw e
    }
  }
  throw new Error('Could not mint a unique short code')
}
