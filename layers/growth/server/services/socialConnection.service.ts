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

/** Decrypt a connection's access token for an API call. */
export function decryptAccessToken(conn: { accessToken: string }): string {
  return decryptApiKey(conn.accessToken)
}
