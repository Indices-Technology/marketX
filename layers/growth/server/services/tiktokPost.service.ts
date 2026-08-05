/**
 * Shared setup for TikTok photo posting (both DIRECT_POST and MEDIA_UPLOAD) —
 * resolves asset ownership, the connected TikTok access token, the verified
 * card photo URL, and mints the TIKTOK distribution so the caption link is
 * attributable. Used by both post/tiktok.post.ts and post/tiktok/draft.post.ts
 * to keep the ownership/connection checks from drifting between the two modes.
 */

import { prisma } from '~~/server/utils/db'
import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  getUserActiveConnection,
  decryptAccessToken,
} from '~~/layers/growth/server/services/socialConnection.service'
import { mintDistribution } from '~~/layers/growth/server/services/shortlink.service'

export async function resolveTikTokPostContext(
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
  const cardImageUrl = ((asset.content ?? {}) as { cardImageUrl?: string }).cardImageUrl
  if (!cardImageUrl) {
    throw new UserError('NO_CARD', 'Generate the card image before posting', 400)
  }

  const conn = await getUserActiveConnection(userId, 'TIKTOK')
  const accessToken = decryptAccessToken(conn)

  // TikTok pulls the photo from OUR verified domain (redirects are disallowed).
  const photoUrl = `${baseUrl.replace(/\/$/, '')}/growth/cards/${asset.id}`

  // Mint the channel distribution so the caption link is attributable to TikTok.
  const minted = await mintDistribution({ assetId: asset.id, channel: 'TIKTOK', baseUrl })

  return { asset, accessToken, photoUrl, minted }
}

/** Always append the attributable tracked link so the caption is measurable. */
export function buildTikTokCaption(userCaption: unknown, trackedUrl: string): string {
  const trimmed = typeof userCaption === 'string' ? userCaption.trim() : ''
  return trimmed ? `${trimmed}\n\n${trackedUrl}` : trackedUrl
}
