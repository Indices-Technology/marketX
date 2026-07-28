/**
 * Social connection helpers — load a seller's active connection and decrypt its
 * access token for server-to-server posting. Tokens are AES-256-GCM encrypted at
 * rest (see the connect callback); only this path decrypts them.
 */

import { prisma } from '~~/server/utils/db'
import { decryptApiKey } from '~~/layers/core/server/services/aiConfig.service'
import { UserError } from '~~/layers/profile/server/types/user.types'

type Platform = 'TIKTOK' | 'META_FB' | 'META_IG'

export async function getActiveConnection(sellerId: string, platform: Platform) {
  const conn = await prisma.socialConnection.findFirst({
    where: { sellerId, platform, status: 'ACTIVE' },
    orderBy: { created_at: 'desc' },
  })
  if (!conn) {
    throw new UserError(
      'NOT_CONNECTED',
      `No active ${platform} connection — connect the account first`,
      400,
    )
  }
  return conn
}

/**
 * Find an active connection across ALL of a user's stores — multi-store safe, so
 * a connection made on one store is usable when posting from another.
 */
export async function getUserActiveConnection(userId: string, platform: Platform) {
  const profiles = await prisma.sellerProfile.findMany({
    where: { profileId: userId },
    select: { id: true },
  })
  const conn = await prisma.socialConnection.findFirst({
    where: { sellerId: { in: profiles.map((p) => p.id) }, platform, status: 'ACTIVE' },
    orderBy: { created_at: 'desc' },
  })
  if (!conn) {
    throw new UserError(
      'NOT_CONNECTED',
      `No active ${platform} connection — connect the account first`,
      400,
    )
  }
  return conn
}

/** Decrypt a connection's access token for an API call. */
export function decryptAccessToken(conn: { accessToken: string }): string {
  return decryptApiKey(conn.accessToken)
}
