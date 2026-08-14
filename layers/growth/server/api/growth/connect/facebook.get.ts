// GET /api/growth/connect/facebook
// Starts the Facebook Page POSTING connection (distinct from login OAuth). Called
// as an authenticated fetch: resolves the seller, stashes state + sellerId in
// httpOnly cookies, and returns the authorize URL for the client to navigate to.
// (We can't 302 straight to Facebook because the seller is identified by a Bearer
// token, which a full-page redirect wouldn't carry — so the client redirects
// after this returns.)

import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { facebookAuthorizeUrl } from '~~/layers/growth/server/utils/facebook.oauth'

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
    if (!process.env.OAUTH_FACEBOOK_CLIENT_ID) {
      throw new UserError(
        'NOT_CONFIGURED',
        'Facebook is not configured on the server',
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
    const redirectUri = `${appUrl}/api/growth/connect/facebook/callback`
    const state = crypto.randomUUID()

    setCookie(event, 'growth_fb_state', state, COOKIE)
    setCookie(event, 'growth_fb_seller', seller.id, COOKIE)
    setCookie(
      event,
      'growth_fb_redirect',
      encodeURIComponent(redirectTo),
      COOKIE,
    )

    return {
      success: true,
      data: { authorizeUrl: facebookAuthorizeUrl(state, redirectUri) },
    }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/growth/connect/facebook]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to start Facebook connection',
    })
  }
})
