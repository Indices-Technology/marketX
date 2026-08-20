// GET /api/growth/connect/facebook/callback
// Facebook redirects the browser here after consent. No Bearer token on a
// redirect, so the seller is read from the httpOnly cookie set at start; CSRF
// is checked via the state cookie. Exchanges the code and walks the Page-token
// chain. If the user administers exactly one Page, connects it immediately;
// if several, stashes the encrypted candidate list in a cookie and sends the
// browser to the picker UI (finalized by POST .../facebook/select).

import { encryptApiKey } from '~~/layers/core/server/services/aiConfig.service'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { exchangeFacebookConnection } from '~~/layers/growth/server/utils/facebook.oauth'
import { connectFacebookPage } from '~~/layers/growth/server/services/facebookConnection.service'

const PENDING_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 10 * 60,
  path: '/',
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const stateCookie = getCookie(event, 'growth_fb_state')
  const sellerId = getCookie(event, 'growth_fb_seller')
  const redirectRaw = getCookie(event, 'growth_fb_redirect')
  // Re-validate AFTER decoding: the cookie stores the encoded form, so
  // `%2F%2Fevil.com` only becomes the off-origin `//evil.com` at this point.
  const redirectDecoded = redirectRaw ? decodeURIComponent(redirectRaw) : '/'
  const redirectTo = isSafeRedirectPath(redirectDecoded) ? redirectDecoded : '/'

  // One-shot cookies — clear regardless of outcome.
  for (const c of [
    'growth_fb_state',
    'growth_fb_seller',
    'growth_fb_redirect',
  ]) {
    deleteCookie(event, c, { path: '/' })
  }

  const back = (params: string) =>
    sendRedirect(
      event,
      `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}${params}`,
    )
  const fail = (reason: string) =>
    back(`facebook=error&reason=${encodeURIComponent(reason)}`)

  try {
    if (query.error) return fail(String(query.error_description || query.error))

    const code = typeof query.code === 'string' ? query.code : ''
    const state = typeof query.state === 'string' ? query.state : ''
    if (!code || !state || !stateCookie || state !== stateCookie)
      return fail('invalid_state')
    if (!sellerId) return fail('no_seller')

    const appUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)
    const redirectUri = `${appUrl}/api/growth/connect/facebook/callback`
    const pages = await exchangeFacebookConnection(code, redirectUri)

    if (pages.length === 0) return fail('no_pages')

    if (pages.length === 1) {
      await connectFacebookPage(sellerId, pages[0]!)
      return back('facebook=connected')
    }

    // Multiple Pages — let the seller choose. Candidates (including their real
    // Page access tokens) are encrypted into a short-lived cookie rather than a
    // server-side store; the select endpoint decrypts, verifies the requesting
    // seller matches, and finalizes the connection for the chosen one.
    setCookie(
      event,
      'growth_fb_pending',
      encryptApiKey(JSON.stringify({ sellerId, pages })),
      PENDING_COOKIE,
    )
    return back('facebook=choose')
  } catch (error) {
    logger.logError('[GET /api/growth/connect/facebook/callback]', error, {
      requestId: event.context?.requestId,
    })
    // Surface the real reason (e.g. "Facebook assigned_pages error: ...")
    // instead of a flat "exchange_failed" — actionable beats generic.
    const reason =
      error instanceof Error && error.message
        ? error.message.slice(0, 200)
        : 'exchange_failed'
    return fail(reason)
  }
})
