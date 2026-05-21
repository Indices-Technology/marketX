import { defineEventHandler, readBody, createError } from 'h3'
import { randomBytes } from 'crypto'
import {
  getOAuthClient,
  isRedirectUriAllowed,
  storeAuthCode,
} from '~~/server/utils/auth/oauthServer'

/**
 * POST /api/oauth/code
 *
 * Called by the /oauth/authorize consent page once the user is authenticated
 * and has approved the request. Requires a valid session (auth middleware
 * attaches event.context.user from the accessToken cookie).
 *
 * Body: { client_id, redirect_uri, state? }
 * Returns: { redirect_url } — the client's redirect_uri with ?code=...&state=...
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'You must be logged in to authorize this request',
    })
  }

  const body = await readBody<{
    client_id: string
    redirect_uri: string
    state?: string
  }>(event)
  const { client_id, redirect_uri, state } = body ?? {}

  if (!client_id)
    throw createError({ statusCode: 400, statusMessage: 'Missing client_id' })
  if (!redirect_uri)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing redirect_uri',
    })

  const client = getOAuthClient(client_id)
  if (!client)
    throw createError({ statusCode: 401, statusMessage: 'Unknown client_id' })
  if (!isRedirectUriAllowed(client, redirect_uri)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'redirect_uri not allowed',
    })
  }

  const code = randomBytes(32).toString('hex')

  await storeAuthCode(code, {
    userId: user.id,
    email: user.email,
    clientId: client_id,
    redirectUri: redirect_uri,
  })

  const params = new URLSearchParams({ code, ...(state ? { state } : {}) })
  return { redirectUrl: `${redirect_uri}?${params.toString()}` }
})
