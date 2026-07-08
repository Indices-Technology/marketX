import {
  defineEventHandler,
  getCookie,
  setCookie,
  createError,
  getRequestIP,
  getRequestHeader,
  readBody,
} from 'h3'
import { authService } from '../../services/auth.service'
import { AuthError } from '../../types/auth.types'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Refresh the access token',
    description:
      'Exchanges a valid refresh token for a new access token. The refresh ' +
      'token rotates on every call — the one you send is immediately invalidated. ' +
      '**Web:** sends the httpOnly `refreshToken` cookie; response returns only ' +
      '`accessToken` (rotated token stays in the cookie). **Native:** sends the ' +
      'token via `X-Refresh-Token` header or `{ refreshToken }` body; response ' +
      'returns `{ accessToken, refreshToken }` — persist the new refresh token.',
    parameters: [
      {
        in: 'header',
        name: 'X-Refresh-Token',
        required: false,
        schema: { type: 'string' },
        description: 'Native transport. Omit when sending the cookie (web).',
      },
    ],
    requestBody: {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { refreshToken: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      200: { description: '{ success, accessToken, refreshToken? }' },
      401: { description: 'Missing, invalid, expired, or revoked refresh token' },
      429: { description: 'Too many refresh attempts' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    // 1. Get the refresh token.
    //
    // Two transports are supported, by design (see docs/SECURITY.md §8):
    //   - Web    → httpOnly `refreshToken` cookie. Kept out of reach of
    //              on-origin JS, so a stored-XSS bug cannot read it.
    //   - Native → `X-Refresh-Token` header (or `{ refreshToken }` body) when
    //              no cookie is present. Mobile apps have no cookie jar; they
    //              store the token in Keystore-backed encrypted storage and
    //              replay it here. Not CSRF-reachable (a header/body value is
    //              never auto-attached cross-site like a cookie).
    //
    // `fromCookie` drives the response shape below: cookie callers never get
    // the rotated token back in the body (preserves the httpOnly guarantee);
    // native callers must, because rotation invalidates their old token.
    const cookieToken = getCookie(event, 'refreshToken')
    let refreshToken = cookieToken

    if (!refreshToken) {
      refreshToken =
        getRequestHeader(event, 'x-refresh-token') ||
        (await readBody(event).catch(() => null))?.refreshToken
    }

    const fromCookie = Boolean(cookieToken)

    if (!refreshToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No refresh token provided',
      })
    }

    // 2. Get Client Context
    const ipAddress =
      getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'

    // 3. Call Singleton Service
    // Logic: Validate Token -> Check Expiry/Revocation -> Generate New Access Token -> Audit Log
    const result = await authService.refreshAccessToken(
      refreshToken,
      ipAddress,
      userAgent,
    )

    // 4. Web transport: refresh the rotated tokens back into httpOnly cookies.
    // Skipped for native callers — they hold no cookie and read the body below.
    if (fromCookie) {
      setCookie(event, 'accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
      })
      setCookie(event, 'refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    // 5. Response body.
    // Web (cookie) callers get ONLY the access token — the rotated refresh
    // token stays in the httpOnly cookie, unreadable by JS. Native callers get
    // the rotated refresh token too, because rotation just invalidated the one
    // they sent and they have nowhere else to receive the new one.
    return {
      success: true,
      accessToken: result.accessToken,
      ...(fromCookie ? {} : { refreshToken: result.refreshToken }),
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({ statusCode: error.statusCode, statusMessage: error.message })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/auth/refresh-token]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
