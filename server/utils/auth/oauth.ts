import { getRequestHeader, type H3Event } from 'h3'

type OAuthProvider = 'google' | 'facebook' | 'tiktok'

interface OAuthUserProfile {
  email: string
  name?: string
  avatar?: string
}

/**
 * Resolve the app origin (`scheme://host`) that OAuth redirect URIs are built
 * from.
 *
 * OAuth stores `state` in a cookie scoped to the domain the flow STARTED on and
 * re-reads it on the callback. If the callback lands on a *different* domain the
 * cookie isn't sent → "Invalid OAuth state". So instead of pinning every flow to
 * a single `NUXT_PUBLIC_BASE_URL`, we keep the flow on the domain the request
 * actually arrived on — as long as that host is allow-listed.
 *
 * Allow-list = the configured baseURL host + any hosts in `OAUTH_ALLOWED_HOSTS`
 * (comma-separated). An unknown / spoofed Host header falls back to the
 * configured baseURL, so it can never redirect the flow somewhere unregistered.
 */
export const resolveOAuthAppUrl = (
  event: H3Event,
  fallbackBaseUrl: string,
): string => {
  const fallback = (fallbackBaseUrl || 'http://localhost:3000')
    .trim()
    .replace(/\/$/, '')

  const rawHost = (
    getRequestHeader(event, 'x-forwarded-host') ||
    getRequestHeader(event, 'host') ||
    ''
  )
    .split(',')[0]
    .trim()
    .toLowerCase()
  if (!rawHost) return fallback

  // Trust the proxy's forwarded proto; otherwise assume https for real domains
  // (providers reject non-https redirect URIs) and http only for localhost.
  const isLocal = rawHost.startsWith('localhost') || rawHost.startsWith('127.')
  const proto =
    (getRequestHeader(event, 'x-forwarded-proto') || '')
      .split(',')[0]
      .trim()
      .toLowerCase() || (isLocal ? 'http' : 'https')

  const allowed = new Set<string>()
  try {
    allowed.add(new URL(fallback).host.toLowerCase())
  } catch {
    // fallback isn't a full URL — ignore
  }
  for (const h of (process.env.OAUTH_ALLOWED_HOSTS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)) {
    allowed.add(h)
  }

  return allowed.has(rawHost) ? `${proto}://${rawHost}` : fallback
}

const parseJwtPayload = (token: string) => {
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')

    const decoded = Buffer.from(payload, 'base64').toString('utf8')
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export const getOAuthAuthorizeUrl = (
  provider: OAuthProvider,
  state: string,
  redirectUri: string,
) => {
  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
      access_type: 'offline',
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  if (provider === 'facebook') {
    const params = new URLSearchParams({
      client_id: process.env.OAUTH_FACEBOOK_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,public_profile',
      state,
    })
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  }

  // TikTok
  const params = new URLSearchParams({
    client_key: process.env.OAUTH_TIKTOK_CLIENT_KEY || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'user.info.basic,user.info.email',
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
}

export const exchangeCodeForProfile = async (
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
): Promise<OAuthUserProfile> => {
  if (provider === 'google') {
    const token = await $fetch<{
      access_token: string
    }>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const userInfo = await $fetch<{
      email: string
      name?: string
      picture?: string
    }>('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    })

    return {
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
    }
  }

  if (provider === 'facebook') {
    const token = await $fetch<{
      access_token: string
    }>('https://graph.facebook.com/v19.0/oauth/access_token', {
      query: {
        client_id: process.env.OAUTH_FACEBOOK_CLIENT_ID || '',
        client_secret: process.env.OAUTH_FACEBOOK_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        code,
      },
    })

    const userInfo = await $fetch<{
      email?: string
      name?: string
      picture?: { data?: { url?: string } }
    }>('https://graph.facebook.com/me', {
      query: {
        fields: 'id,name,email,picture.width(256).height(256)',
        access_token: token.access_token,
      },
    })

    if (!userInfo.email) {
      throw new Error(
        'Facebook account did not return an email. Ensure email permission is enabled.',
      )
    }

    return {
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture?.data?.url,
    }
  }

  // TikTok
  const tokenRes = await $fetch<{
    data?: { access_token?: string; open_id?: string }
    error?: { code?: string; message?: string }
  }>('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    body: new URLSearchParams({
      client_key: process.env.OAUTH_TIKTOK_CLIENT_KEY || '',
      client_secret: process.env.OAUTH_TIKTOK_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (tokenRes.error?.code && tokenRes.error.code !== 'ok') {
    throw new Error(`TikTok token error: ${tokenRes.error.message}`)
  }

  const accessToken = tokenRes.data?.access_token
  const openId = tokenRes.data?.open_id
  if (!accessToken || !openId) throw new Error('TikTok did not return an access token')

  const userRes = await $fetch<{
    data?: { user?: { display_name?: string; avatar_url?: string; email?: string } }
    error?: { code?: string; message?: string }
  }>('https://open.tiktokapis.com/v2/user/info/', {
    query: { fields: 'open_id,display_name,avatar_url,email' },
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const tiktokUser = userRes.data?.user

  // email scope requires TikTok approval; fall back to a deterministic placeholder
  const email = tiktokUser?.email || `tiktok_${openId}@tiktok.oauth`

  return {
    email,
    name: tiktokUser?.display_name,
    avatar: tiktokUser?.avatar_url,
  }
}
