/**
 * Google Business Profile connection OAuth (posting / listing / reviews) — distinct
 * from the LOGIN OAuth in server/utils/auth/oauth.ts. Reuses the SAME Google app
 * (OAUTH_GOOGLE_CLIENT_ID/SECRET), but requests the `business.manage` scope and
 * captures the refresh token + expiry that login throws away. See docs/GOOGLE_BUSINESS.md.
 *
 * IMPORTANT — two gates before the connected token can call the GBP APIs:
 *   1. `business.manage` is a SENSITIVE scope: in production the OAuth consent
 *      screen must be verified by Google. Until then the flow works only for
 *      accounts listed as OAuth "test users" (mirror of the TikTok sandbox note).
 *   2. The GBP API project needs Google's access-request approval (~14 days) AND
 *      per-API quota > 0. The OAuth grant here succeeds without it, but the actual
 *      accounts.list / posts / reviews calls (Phase 2/3) 403 until approved.
 */

/**
 * Single scope covers all GBP sub-APIs (Account Management, Business Information,
 * Local Posts, Reviews). Override with GOOGLE_GBP_SCOPES to prove the flow with a
 * narrower/openid-only scope before the sensitive scope is verified.
 */
export const GOOGLE_GBP_CONNECT_SCOPES =
  process.env.GOOGLE_GBP_SCOPES ||
  'https://www.googleapis.com/auth/business.manage openid email profile'

export function googleGbpAuthorizeUrl(
  state: string,
  redirectUri: string,
): string {
  const params = new URLSearchParams({
    client_id: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_GBP_CONNECT_SCOPES,
    state,
    // offline + consent guarantee a refresh_token even on re-consent (Google only
    // returns one on the FIRST grant otherwise).
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export interface GoogleGbpConnection {
  /** Google account subject id (stable per-user handle). */
  userId: string
  accessToken: string
  refreshToken?: string
  scope?: string
  /** Seconds until the access token expires. */
  expiresIn?: number
  displayName?: string
  avatarUrl?: string
  email?: string
}

/**
 * Exchange an authorization code for the token set (access + refresh) and the
 * connecting user's identity for the UI. Google's token endpoint returns fields
 * top-level; userinfo gives us the display name / avatar / email.
 */
export async function exchangeGoogleGbpConnection(
  code: string,
  redirectUri: string,
): Promise<GoogleGbpConnection> {
  const t = await $fetch<{
    access_token?: string
    refresh_token?: string
    scope?: string
    expires_in?: number
    error?: string
    error_description?: string
  }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
      client_secret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (t.error) {
    throw new Error(`Google token error: ${t.error_description || t.error}`)
  }
  if (!t.access_token) {
    throw new Error('Google did not return an access token')
  }

  const user = await $fetch<{
    id?: string
    name?: string
    picture?: string
    email?: string
  }>('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${t.access_token}` },
  })

  if (!user.id) {
    throw new Error('Google did not return a user id')
  }

  return {
    userId: user.id,
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    scope: t.scope,
    expiresIn: t.expires_in,
    displayName: user.name,
    avatarUrl: user.picture,
    email: user.email,
  }
}
