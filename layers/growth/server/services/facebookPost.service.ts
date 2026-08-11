/**
 * Shared setup for Facebook Page photo posting — resolves asset ownership,
 * the connected Page's access token, the card photo URL, and mints the
 * META_FB distribution so the caption link is attributable. Mirrors
 * tiktokPost.service.ts's shape for the same reasons (single place the
 * ownership/connection checks live, instead of duplicated in the route).
 */

import { prisma } from '~~/server/utils/db'
import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  getUserActiveConnection,
  decryptAccessToken,
} from '~~/layers/growth/server/services/socialConnection.service'
import { mintDistribution } from '~~/layers/growth/server/services/shortlink.service'

export async function resolveFacebookPostContext(
  assetId: string,
  userId: string,
  baseUrl: string,
) {
  const asset = await prisma.growthAsset.findUnique({
    where: { id: assetId },
    select: { id: true, content: true, sellerId: true },
  })
  // Ownership: the asset's store must belong to the authenticated user.
  const owns =
    asset &&
    (await prisma.sellerProfile.findFirst({
      where: { id: asset.sellerId, profileId: userId },
      select: { id: true },
    }))
  if (!asset || !owns) {
    throw new UserError('ASSET_NOT_FOUND', 'Growth asset not found', 404)
  }
  const cardImageUrl = ((asset.content ?? {}) as { cardImageUrl?: string })
    .cardImageUrl
  if (!cardImageUrl) {
    throw new UserError(
      'NO_CARD',
      'Generate the card image before posting',
      400,
    )
  }

  const conn = await getUserActiveConnection(userId, 'META_FB')
  const pageAccessToken = decryptAccessToken(conn)
  // providerUserId is the Page id itself (set at connect time — facebookConnection.service.ts).
  const pageId = conn.providerUserId

  // Facebook fetches the photo server-side from any public URL — unlike TikTok
  // it does not require a TikTok-style verified domain, so the existing
  // /growth/cards/:id proxy works as-is with no extra Meta console config.
  const photoUrl = `${baseUrl.replace(/\/$/, '')}/growth/cards/${asset.id}`

  // Mint the channel distribution so the caption link is attributable to Facebook.
  const minted = await mintDistribution({
    assetId: asset.id,
    channel: 'META_FB',
    baseUrl,
  })

  return { asset, pageId, pageAccessToken, photoUrl, minted }
}

/** Always append the attributable tracked link so the caption is measurable. */
export function buildFacebookCaption(
  userCaption: unknown,
  trackedUrl: string,
): string {
  const trimmed = typeof userCaption === 'string' ? userCaption.trim() : ''
  return trimmed ? `${trimmed}\n\n${trackedUrl}` : trackedUrl
}
