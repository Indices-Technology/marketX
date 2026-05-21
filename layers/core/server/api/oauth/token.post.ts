import { defineEventHandler, readBody, createError } from 'h3'
import { randomBytes } from 'crypto'
import {
  validateOAuthClient,
  redeemAuthCode,
  storeRefreshToken,
} from '~~/server/utils/auth/oauthServer'
import { generateTokens } from '~~/server/utils/auth/auth'

/**
 * POST /api/oauth/token
 *
 * Server-to-server token exchange. The client backend calls this with the
 * auth code to receive a MarketX access + refresh token pair.
 *
 * Body: { grant_type, code, client_id, client_secret, redirect_uri }
 * Returns: { access_token, refresh_token, token_type, expires_in }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    grant_type: string
    code: string
    client_id: string
    client_secret: string
    redirect_uri: string
  }>(event)

  const { grant_type, code, client_id, client_secret, redirect_uri } =
    body ?? {}

  if (grant_type !== 'authorization_code') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only grant_type=authorization_code is supported',
    })
  }
  if (!code)
    throw createError({ statusCode: 400, statusMessage: 'Missing code' })
  if (!client_id)
    throw createError({ statusCode: 400, statusMessage: 'Missing client_id' })
  if (!client_secret)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing client_secret',
    })
  if (!redirect_uri)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing redirect_uri',
    })

  const client = validateOAuthClient(client_id, client_secret)
  if (!client) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid client credentials',
    })
  }

  const authData = await redeemAuthCode(code, client_id, redirect_uri)
  if (!authData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid, expired, or already-used auth code',
    })
  }

  const { accessToken } = generateTokens(
    authData.userId,
    authData.email,
    'user',
  )

  const refreshToken = randomBytes(32).toString('hex')
  await storeRefreshToken(refreshToken, {
    userId: authData.userId,
    email: authData.email,
    clientId: client_id,
  })

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 3600,
  }
})
