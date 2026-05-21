import { defineEventHandler, getQuery, sendRedirect, createError } from 'h3'
import {
  getOAuthClient,
  isRedirectUriAllowed,
} from '~~/server/utils/auth/oauthServer'

/**
 * GET /api/oauth/authorize
 *
 * Entry point for the OAuth 2.0 Authorization Code flow.
 * Validates the client and redirect_uri, then redirects the user-agent
 * to the consent/login UI page (/oauth/authorize) where they log in or
 * approve the request.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { client_id, redirect_uri, response_type, state, scope } =
    query as Record<string, string>

  if (!client_id)
    throw createError({ statusCode: 400, statusMessage: 'Missing client_id' })
  if (response_type !== 'code')
    throw createError({
      statusCode: 400,
      statusMessage: 'Only response_type=code is supported',
    })
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
      statusMessage: 'redirect_uri not allowed for this client',
    })
  }

  // Forward user to the UI consent page — it handles login + approval
  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type,
    ...(state ? { state } : {}),
    ...(scope ? { scope } : {}),
  })
  return sendRedirect(event, `/oauth/authorize?${params.toString()}`, 302)
})
