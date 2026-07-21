import { defineEventHandler, readBody, createError } from 'h3'
import { randomBytes } from 'crypto'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import {
  getOAuthClient,
  isRedirectUriAllowed,
  storeAuthCode,
} from '~~/server/utils/auth/oauthServer'

/**
 * POST /api/oauth/code
 *
 * Called by the /oauth/authorize consent page once the user is authenticated
 * and has approved the request.
 *
 * Auth goes through requireAuth, NOT the bare event.context.user the global
 * middleware populates. That context object is only a decoded JWT — it survives
 * both session revocation and an account ban, so trusting it here would let a
 * signed-out or banned user mint an authorization code and trade it for a
 * third-party access token, quietly defeating both. The consent page always
 * sends the token as a Bearer header, which is what requireAuth reads.
 *
 * Body: { client_id, redirect_uri, state? }
 * Returns: { redirect_url } — the client's redirect_uri with ?code=...&state=...
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

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
