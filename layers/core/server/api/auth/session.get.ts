import { defineEventHandler, parseCookies } from 'h3'

/**
 * GET /api/auth/session
 *
 * After an OAuth redirect the access/refresh tokens live in httpOnly cookies
 * set by the callback handler. The client cannot read httpOnly cookies directly,
 * so this endpoint reads them server-side and hands them back as JSON so the
 * client can persist them in the auth store / localStorage.
 *
 * Cookies are NOT deleted — they must remain so that POST /api/auth/refresh-token
 * can read the refreshToken cookie when the access token expires.
 */
defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Read tokens from OAuth cookies (web only)',
    description:
      'Web OAuth bridge: hands the httpOnly tokens set by the OAuth callback ' +
      'back to client JS. **Native clients must not use this** — do native ' +
      'OAuth with PKCE and receive tokens directly instead.',
    responses: {
      200: { description: '{ accessToken, refreshToken } (null when not set)' },
    },
  },
})
export default defineEventHandler((event) => {
  const cookies = parseCookies(event)
  const accessToken = cookies.accessToken ?? null
  const refreshToken = cookies.refreshToken ?? null

  return { accessToken, refreshToken }
})
