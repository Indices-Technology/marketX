import { defineEventHandler, readBody, createError } from 'h3'
import { randomBytes } from 'crypto'
import {
  validateOAuthClient,
  verifyRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
} from '~~/server/utils/auth/oauthServer'
import { generateTokens } from '~~/server/utils/auth/auth'

/**
 * POST /api/oauth/refresh
 *
 * Exchanges a valid refresh token for a new access + refresh token pair.
 * The old refresh token is revoked (rotation).
 *
 * Body: { grant_type, refresh_token, client_id, client_secret }
 * Returns: { access_token, refresh_token, token_type, expires_in }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    grant_type: string
    refresh_token: string
    client_id: string
    client_secret: string
  }>(event)

  const { grant_type, refresh_token, client_id, client_secret } = body ?? {}

  if (grant_type !== 'refresh_token') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only grant_type=refresh_token is supported',
    })
  }
  if (!refresh_token)
    throw createError({ statusCode: 400, statusMessage: 'Missing refresh_token' })
  if (!client_id) throw createError({ statusCode: 400, statusMessage: 'Missing client_id' })
  if (!client_secret)
    throw createError({ statusCode: 400, statusMessage: 'Missing client_secret' })

  const client = validateOAuthClient(client_id, client_secret)
  if (!client) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid client credentials' })
  }

  const tokenData = await verifyRefreshToken(refresh_token)
  if (!tokenData || tokenData.clientId !== client_id) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired refresh token' })
  }

  // Rotate: revoke old token, issue new pair
  await revokeRefreshToken(refresh_token)

  const { accessToken } = generateTokens(tokenData.userId, tokenData.email, 'user')
  const newRefreshToken = randomBytes(32).toString('hex')
  await storeRefreshToken(newRefreshToken, {
    userId: tokenData.userId,
    email: tokenData.email,
    clientId: client_id,
  })

  return {
    access_token: accessToken,
    refresh_token: newRefreshToken,
    token_type: 'Bearer',
    expires_in: 3600,
  }
})
