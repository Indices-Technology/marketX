// GET /api/growth/connect/google/callback
// Google redirects the browser here after consent. No Bearer token on a redirect,
// so the seller is read from the httpOnly cookie set at start; CSRF is checked via
// the state cookie. Exchanges the code, encrypts the tokens, upserts the
// SocialConnection (platform GOOGLE_GBP), then redirects back to where the seller
// started. Mirrors the TikTok callback.

import { encryptApiKey } from '~~/layers/core/server/services/aiConfig.service'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { exchangeGoogleGbpConnection } from '~~/layers/growth/server/utils/google.oauth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const stateCookie = getCookie(event, 'growth_gg_state')
  const sellerId = getCookie(event, 'growth_gg_seller')
  const redirectRaw = getCookie(event, 'growth_gg_redirect')
  // Re-validate AFTER decoding: the cookie stores the encoded form, so
  // `%2F%2Fevil.com` only becomes the off-origin `//evil.com` at this point.
  const redirectDecoded = redirectRaw ? decodeURIComponent(redirectRaw) : '/'
  const redirectTo = isSafeRedirectPath(redirectDecoded) ? redirectDecoded : '/'

  // One-shot cookies — clear regardless of outcome.
  for (const c of [
    'growth_gg_state',
    'growth_gg_seller',
    'growth_gg_redirect',
  ]) {
    deleteCookie(event, c, { path: '/' })
  }

  const back = (params: string) =>
    sendRedirect(
      event,
      `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}${params}`,
    )
  const fail = (reason: string) =>
    back(`google=error&reason=${encodeURIComponent(reason)}`)

  try {
    if (query.error) return fail(String(query.error_description || query.error))

    const code = typeof query.code === 'string' ? query.code : ''
    const state = typeof query.state === 'string' ? query.state : ''
    if (!code || !state || !stateCookie || state !== stateCookie)
      return fail('invalid_state')
    if (!sellerId) return fail('no_seller')

    const appUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)
    const redirectUri = `${appUrl}/api/growth/connect/google/callback`
    const conn = await exchangeGoogleGbpConnection(code, redirectUri)

    const now = Date.now()
    const expiresAt = conn.expiresIn
      ? new Date(now + conn.expiresIn * 1000)
      : null
    const encRefresh = conn.refreshToken
      ? encryptApiKey(conn.refreshToken)
      : null

    await prisma.socialConnection.upsert({
      where: {
        sellerId_platform_providerUserId: {
          sellerId,
          platform: 'GOOGLE_GBP',
          providerUserId: conn.userId,
        },
      },
      update: {
        displayName: conn.displayName ?? conn.email ?? null,
        avatarUrl: conn.avatarUrl ?? null,
        accessToken: encryptApiKey(conn.accessToken),
        refreshToken: encRefresh,
        scope: conn.scope ?? null,
        expiresAt,
        // Google refresh tokens don't expire on a fixed clock — leave null.
        refreshExpiresAt: null,
        status: 'ACTIVE',
      },
      create: {
        sellerId,
        platform: 'GOOGLE_GBP',
        providerUserId: conn.userId,
        displayName: conn.displayName ?? conn.email ?? null,
        avatarUrl: conn.avatarUrl ?? null,
        accessToken: encryptApiKey(conn.accessToken),
        refreshToken: encRefresh,
        scope: conn.scope ?? null,
        expiresAt,
        refreshExpiresAt: null,
        status: 'ACTIVE',
      },
    })

    return back('google=connected')
  } catch (error) {
    logger.logError('[GET /api/growth/connect/google/callback]', error, {
      requestId: event.context?.requestId,
    })
    return fail('exchange_failed')
  }
})
