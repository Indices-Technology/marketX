import {
  createError,
  defineEventHandler,
  getQuery,
  sendRedirect,
  setCookie,
} from 'h3'

type OAuthProvider = 'google' | 'facebook' | 'tiktok'

const providers: OAuthProvider[] = ['google', 'facebook', 'tiktok']

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Start an OAuth flow (web only)',
    description:
      'Redirects (302) to the provider consent screen and sets a `state` cookie. ' +
      'Browser-only flow — native clients should use a provider SDK with PKCE.',
    parameters: [
      { in: 'path', name: 'provider', required: true, schema: { type: 'string', enum: ['google', 'facebook', 'tiktok'] } },
      { in: 'query', name: 'redirectTo', required: false, schema: { type: 'string' }, description: 'Relative path to land on after login.' },
    ],
    responses: {
      302: { description: 'Redirect to provider authorize URL' },
      404: { description: 'Provider not supported' },
      500: { description: 'Provider not configured on the server' },
    },
  },
})
export default defineEventHandler(async (event) => {
  const provider = event.context.params?.provider as OAuthProvider | undefined
  if (!provider || !providers.includes(provider)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'OAuth provider not supported',
    })
  }

  const query = getQuery(event)
  const redirectTo =
    typeof query.redirectTo === 'string' && query.redirectTo.startsWith('/')
      ? query.redirectTo
      : '/'

  const clientIdByProvider: Record<OAuthProvider, string | undefined> = {
    google: process.env.OAUTH_GOOGLE_CLIENT_ID,
    facebook: process.env.OAUTH_FACEBOOK_CLIENT_ID,
    tiktok: process.env.OAUTH_TIKTOK_CLIENT_KEY,
  }

  if (!clientIdByProvider[provider]) {
    throw createError({
      statusCode: 500,
      statusMessage: `${provider} OAuth is not configured on the server`,
    })
  }

  const config = useRuntimeConfig()
  // Keep the whole flow on the domain the request arrived on (host-aware), so
  // the `oauth_state` cookie set here is present again on the callback. Falls
  // back to NUXT_PUBLIC_BASE_URL for unknown hosts.
  const appUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)
  const callback = `${appUrl}/api/auth/oauth/${provider}/callback`
  const state = crypto.randomUUID()
  const authorizeUrl = getOAuthAuthorizeUrl(provider, state, callback)

  setCookie(event, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  })

  setCookie(event, 'oauth_redirect', encodeURIComponent(redirectTo), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  })

  return sendRedirect(event, authorizeUrl)
})
