/**
 * TikTok connection OAuth (posting) — distinct from the LOGIN OAuth in
 * server/utils/auth/oauth.ts. Same TikTok app (OAUTH_TIKTOK_CLIENT_KEY/SECRET),
 * but requests POSTING scopes and captures the refresh token + expiry that login
 * throws away. See docs/GROWTH_ENGINE.md.
 */

/**
 * Scopes MUST match what the TikTok app actually holds — requesting an unheld
 * scope fails the OAuth. This app currently has:
 *   • user.info.basic  — identity (open id, avatar, display name)   [Login Kit]
 *   • video.upload     — post to the creator's inbox as a draft;    [Content Posting]
 *                        the creator finishes posting in the app (no audit needed)
 *   • video.publish    — direct post to the creator's timeline.     [Content Posting]
 *                        NOTE: until the app passes TikTok's Content Posting audit,
 *                        direct posts are forced to SELF_ONLY (private). The scope
 *                        grant itself works now; public visibility needs the audit.
 *
 * NOT yet enabled (add in the TikTok console, then append here):
 *   • video.list       — read the creator's videos (for post → product IMPORT)
 *   • user.info.profile / user.info.stats — richer profile + follower/like counts
 *
 * Override with the TIKTOK_SCOPES env var — a TikTok "scope" error means the app
 * (esp. a sandbox) doesn't have one of these enabled; set TIKTOK_SCOPES to exactly
 * what the app allows (start with just `user.info.basic` to prove the flow, then
 * add the video scopes once enabled on the sandbox) without a code redeploy.
 */
export const TIKTOK_CONNECT_SCOPES =
  process.env.TIKTOK_SCOPES || 'user.info.basic,video.upload,video.publish'

export function tiktokAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_key: process.env.OAUTH_TIKTOK_CLIENT_KEY || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: TIKTOK_CONNECT_SCOPES,
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
}

export interface TikTokConnection {
  openId: string
  accessToken: string
  refreshToken?: string
  scope?: string
  /** Seconds until the access token expires. */
  expiresIn?: number
  /** Seconds until the refresh token expires. */
  refreshExpiresIn?: number
  displayName?: string
  avatarUrl?: string
}

/**
 * Exchange an authorization code for the full token set (access + refresh) and
 * the creator's display name/avatar for the UI. Defensive about the response
 * shape — TikTok's v2 token endpoint returns fields top-level, but has historically
 * wrapped them under `data`, so we read either.
 */
export async function exchangeTikTokConnection(
  code: string,
  redirectUri: string,
): Promise<TikTokConnection> {
  const raw = await $fetch<Record<string, unknown>>(
    'https://open.tiktokapis.com/v2/oauth/token/',
    {
      method: 'POST',
      body: new URLSearchParams({
        client_key: process.env.OAUTH_TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.OAUTH_TIKTOK_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  )

  const t = ((raw as { data?: Record<string, unknown> }).data ?? raw) as {
    access_token?: string
    refresh_token?: string
    open_id?: string
    scope?: string
    expires_in?: number
    refresh_expires_in?: number
    error?: string
    error_description?: string
  }

  if (t.error) {
    throw new Error(`TikTok token error: ${t.error_description || t.error}`)
  }
  if (!t.access_token || !t.open_id) {
    throw new Error('TikTok did not return an access token')
  }

  let displayName: string | undefined
  let avatarUrl: string | undefined
  try {
    const userRes = await $fetch<{
      data?: { user?: { display_name?: string; avatar_url?: string } }
    }>('https://open.tiktokapis.com/v2/user/info/', {
      query: { fields: 'open_id,display_name,avatar_url' },
      headers: { Authorization: `Bearer ${t.access_token}` },
    })
    displayName = userRes.data?.user?.display_name
    avatarUrl = userRes.data?.user?.avatar_url
  } catch {
    // Non-fatal — the connection still works without a display name.
  }

  return {
    openId: t.open_id,
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    scope: t.scope,
    expiresIn: t.expires_in,
    refreshExpiresIn: t.refresh_expires_in,
    displayName,
    avatarUrl,
  }
}
