// GET /api/growth/connect/tiktok/callback
// TikTok redirects the browser here after consent. No Bearer token on a redirect,
// so the seller is read from the httpOnly cookie set at start; CSRF is checked via
// the state cookie. Exchanges the code, encrypts the tokens, upserts the
// SocialConnection, then redirects back to where the seller started.

import { encryptApiKey } from '~~/layers/core/server/services/aiConfig.service'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { exchangeTikTokConnection } from '~~/layers/growth/server/utils/tiktok.oauth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const stateCookie = getCookie(event, 'growth_tt_state')
  const sellerId = getCookie(event, 'growth_tt_seller')
  const redirectRaw = getCookie(event, 'growth_tt_redirect')
  const redirectTo = redirectRaw ? decodeURIComponent(redirectRaw) : '/'

  // One-shot cookies — clear regardless of outcome.
  for (const c of ['growth_tt_state', 'growth_tt_seller', 'growth_tt_redirect']) {
    deleteCookie(event, c, { path: '/' })
  }

  const back = (params: string) =>
    sendRedirect(event, `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}${params}`)
  const fail = (reason: string) => back(`tiktok=error&reason=${encodeURIComponent(reason)}`)

  try {
    if (query.error) return fail(String(query.error_description || query.error))

    const code = typeof query.code === 'string' ? query.code : ''
    const state = typeof query.state === 'string' ? query.state : ''
    if (!code || !state || !stateCookie || state !== stateCookie) return fail('invalid_state')
    if (!sellerId) return fail('no_seller')

    const appUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)
    const redirectUri = `${appUrl}/api/growth/connect/tiktok/callback`
    const conn = await exchangeTikTokConnection(code, redirectUri)

    const now = Date.now()
    const expiresAt = conn.expiresIn ? new Date(now + conn.expiresIn * 1000) : null
    const refreshExpiresAt = conn.refreshExpiresIn
      ? new Date(now + conn.refreshExpiresIn * 1000)
      : null
    const encRefresh = conn.refreshToken ? encryptApiKey(conn.refreshToken) : null

    await prisma.socialConnection.upsert({
      where: {
        sellerId_platform_providerUserId: {
          sellerId,
          platform: 'TIKTOK',
          providerUserId: conn.openId,
        },
      },
      update: {
        displayName: conn.displayName ?? null,
        avatarUrl: conn.avatarUrl ?? null,
        accessToken: encryptApiKey(conn.accessToken),
        refreshToken: encRefresh,
        scope: conn.scope ?? null,
        expiresAt,
        refreshExpiresAt,
        status: 'ACTIVE',
      },
      create: {
        sellerId,
        platform: 'TIKTOK',
        providerUserId: conn.openId,
        displayName: conn.displayName ?? null,
        avatarUrl: conn.avatarUrl ?? null,
        accessToken: encryptApiKey(conn.accessToken),
        refreshToken: encRefresh,
        scope: conn.scope ?? null,
        expiresAt,
        refreshExpiresAt,
        status: 'ACTIVE',
      },
    })

    return back('tiktok=connected')
  } catch (error) {
    logger.logError('[GET /api/growth/connect/tiktok/callback]', error, {
      requestId: event.context?.requestId,
    })
    return fail('exchange_failed')
  }
})
