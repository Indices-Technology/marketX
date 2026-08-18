/**
 * Facebook Page connection OAuth (posting) — distinct from the LOGIN OAuth in
 * server/utils/auth/oauth.ts. Uses its OWN Meta app (GROWTH_FACEBOOK_CLIENT_ID/
 * SECRET, "marketx-pages"), NOT the login app's OAUTH_FACEBOOK_CLIENT_ID/SECRET
 * — Meta ties Page-management permissions (pages_show_list etc.) to a
 * "Facebook Login for Business" app, which a plain consumer-login app cannot be
 * upgraded into. Walks the token chain Page access requires: auth code →
 * short-lived user token → long-lived user token → /me/accounts (the Pages the
 * user administers, each with its own Page token). See docs/GROWTH_ENGINE.md.
 */

/**
 * Scopes MUST match what the Meta App is actually approved for — this is
 * gated behind App Review (pages_manage_posts, pages_read_engagement); until
 * that clears, this only works for tester/role accounts on the app.
 */
export const FACEBOOK_CONNECT_SCOPES =
  process.env.FACEBOOK_SCOPES ||
  'pages_show_list,pages_read_engagement,pages_manage_posts'

const GRAPH_API_VERSION = 'v19.0'

export function facebookAuthorizeUrl(
  state: string,
  redirectUri: string,
): string {
  const params = new URLSearchParams({
    client_id: process.env.GROWTH_FACEBOOK_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: FACEBOOK_CONNECT_SCOPES,
    state,
  })
  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`
}

export interface FacebookPageConnection {
  pageId: string
  accessToken: string
  displayName?: string
  category?: string
}

/**
 * Exchange an authorization code for the list of Pages the user administers,
 * each with its own Page access token. Page tokens derived from a long-lived
 * user token inherit that lifetime (no refresh-token dance needed, unlike
 * TikTok) — they stay valid until the user changes their password or revokes
 * the app.
 */
export async function exchangeFacebookConnection(
  code: string,
  redirectUri: string,
): Promise<FacebookPageConnection[]> {
  const shortLived = await $fetch<{
    access_token?: string
    error?: { message?: string }
  }>(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`, {
    query: {
      client_id: process.env.GROWTH_FACEBOOK_CLIENT_ID || '',
      client_secret: process.env.GROWTH_FACEBOOK_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      code,
    },
  })
  if (shortLived.error || !shortLived.access_token) {
    throw new Error(
      `Facebook token error: ${shortLived.error?.message || 'no access token returned'}`,
    )
  }

  const longLived = await $fetch<{
    access_token?: string
    error?: { message?: string }
  }>(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`, {
    query: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.GROWTH_FACEBOOK_CLIENT_ID || '',
      client_secret: process.env.GROWTH_FACEBOOK_CLIENT_SECRET || '',
      fb_exchange_token: shortLived.access_token,
    },
  })
  // Non-fatal if this step errors — fall back to the short-lived token rather
  // than failing the whole connection over it.
  const userToken = longLived.access_token || shortLived.access_token

  const pagesRes = await $fetch<{
    data?: Array<{
      id: string
      name: string
      access_token: string
      category?: string
    }>
    error?: { message?: string }
  }>(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts`, {
    query: { access_token: userToken },
  })
  if (pagesRes.error) {
    throw new Error(`Facebook pages error: ${pagesRes.error.message}`)
  }

  return (pagesRes.data || []).map((p) => ({
    pageId: p.id,
    accessToken: p.access_token,
    displayName: p.name,
    category: p.category,
  }))
}
