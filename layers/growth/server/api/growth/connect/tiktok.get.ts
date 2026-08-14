// GET /api/growth/connect/tiktok
// Starts the TikTok POSTING connection (distinct from login OAuth). Called as an
// authenticated fetch: resolves the seller, stashes state + sellerId in httpOnly
// cookies, and returns the authorize URL for the client to navigate to. (We can't
// 302 straight to TikTok because the seller is identified by a Bearer token, which
// a full-page redirect wouldn't carry — so the client redirects after this returns.)

import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { tiktokAuthorizeUrl } from '~~/layers/growth/server/utils/tiktok.oauth'

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 10 * 60,
  path: '/',
}

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const seller = await getAuthSellerProfile(event)
    if (!seller) {
      throw new UserError(
        'SELLER_REQUIRED',
        'A seller profile is required to connect a social account',
        403,
      )
    }
    if (!process.env.OAUTH_TIKTOK_CLIENT_KEY) {
      throw new UserError(
        'NOT_CONFIGURED',
        'TikTok is not configured on the server',
        500,
      )
    }

    const query = getQuery(event)
    // Not just `startsWith('/')` — `//evil.com` passes that and browsers treat
    // it as an absolute cross-origin URL. See isSafeRedirectPath.
    const redirectTo = isSafeRedirectPath(query.redirectTo)
      ? query.redirectTo
      : '/'

    const config = useRuntimeConfig()
    const appUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)
    const redirectUri = `${appUrl}/api/growth/connect/tiktok/callback`
    const state = crypto.randomUUID()

    setCookie(event, 'growth_tt_state', state, COOKIE)
    setCookie(event, 'growth_tt_seller', seller.id, COOKIE)
    setCookie(
      event,
      'growth_tt_redirect',
      encodeURIComponent(redirectTo),
      COOKIE,
    )

    return {
      success: true,
      data: { authorizeUrl: tiktokAuthorizeUrl(state, redirectUri) },
    }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/growth/connect/tiktok]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to start TikTok connection',
    })
  }
})
