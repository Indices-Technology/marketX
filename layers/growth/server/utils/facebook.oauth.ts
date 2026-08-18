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
 * that clears, this only works for tester/role accounts on the app. Only used
 * as a fallback when GROWTH_FACEBOOK_CONFIG_ID isn't set — see below.
 */
export const FACEBOOK_CONNECT_SCOPES =
  process.env.FACEBOOK_SCOPES ||
  'pages_show_list,pages_read_engagement,pages_manage_posts'

// v19.0 was retired (Meta: "v18.0 and v19.0 calls return 400 errors" as of
// 2026) — this silently broke every call in this file. Re-verify against
// developers.facebook.com/docs/graph-api/changelog before bumping further;
// Meta's 2-year-per-version guarantee means this will need updating again.
const GRAPH_API_VERSION = 'v25.0'

/** $fetch errors embed the full request URL (including access_token=...) in
 *  their message — strip it before this can ever reach a log. */
function redactToken(message: string): string {
  return message.replace(/access_token=[^&"\s]+/gi, 'access_token=[redacted]')
}

/**
 * Once an app requests Page permissions, Meta requires it to be a "Facebook
 * Login for Business" app — which authorizes via a Login Configuration
 * (config_id), not the classic `scope=` param. Meta's dialog happily accepts
 * `scope` and shows the Page picker either way, but WITHOUT config_id the
 * resulting token silently doesn't carry the granted Page permission — the
 * connect flow appears to succeed and a Page gets picked, yet /me/accounts
 * comes back empty every time ("no_pages"). Create the configuration under
 * the app → Facebook Login for Business → Configurations, then set its id
 * here. Falls back to classic `scope=` only if that var isn't set yet.
 */
export function facebookAuthorizeUrl(
  state: string,
  redirectUri: string,
): string {
  const configId = process.env.GROWTH_FACEBOOK_CONFIG_ID
  const params = new URLSearchParams({
    client_id: process.env.GROWTH_FACEBOOK_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    // override_default_response_type is documented for SYSTEM-USER token
    // configs only — this Configuration is "User access token" type, so it
    // must be omitted here rather than copied from the System-user example.
    ...(configId
      ? { config_id: configId }
      : { scope: FACEBOOK_CONNECT_SCOPES }),
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

  // Non-fatal if this step errors — fall back to the short-lived token rather
  // than failing the whole connection over it. $fetch throws on a non-2xx
  // response, so this must be caught explicitly for that fallback to hold.
  let longLivedToken: string | undefined
  try {
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
    longLivedToken = longLived.access_token
  } catch {
    longLivedToken = undefined
  }
  const userToken = longLivedToken || shortLived.access_token

  const pagesRes = await $fetch<{
    data?: Array<{
      id: string
      name: string
      access_token: string
      category?: string
    }>
    paging?: unknown
    error?: { message?: string }
  }>(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts`, {
    query: {
      access_token: userToken,
      fields: 'id,name,access_token,category,tasks',
    },
  })
  if (pagesRes.error) {
    throw new Error(`Facebook pages error: ${pagesRes.error.message}`)
  }

  // Diagnostic for the "empty but no error" case — cheap, only fires on the
  // failure path, and turns "no_pages" from a dead end into an answer: was
  // pages_show_list actually granted, and does the token see ANY business
  // portfolio at all (a Business-Login-shared Page may need to be looked up
  // via its Business rather than the classic personal /me/accounts list).
  if (!pagesRes.data || pagesRes.data.length === 0) {
    try {
      const [perms, businesses] = await Promise.all([
        $fetch<{ data?: Array<{ permission: string; status: string }> }>(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/me/permissions`,
          { query: { access_token: userToken } },
        ),
        $fetch<{
          data?: Array<{ id: string; name: string }>
          error?: { message?: string }
        }>(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/businesses`, {
          query: { access_token: userToken },
        }).catch((e) => ({
          data: undefined,
          error: {
            message: redactToken(e instanceof Error ? e.message : String(e)),
          },
        })),
      ])
      logger.warn('[facebook.oauth] /me/accounts returned no pages', {
        rawPagesResponse: pagesRes,
        grantedPermissions: (perms.data || [])
          .filter((p) => p.status === 'granted')
          .map((p) => p.permission),
        declinedPermissions: (perms.data || [])
          .filter((p) => p.status !== 'granted')
          .map((p) => p.permission),
        businesses: businesses.data,
        businessesError: businesses.error,
      })
    } catch (e) {
      logger.warn(
        '[facebook.oauth] /me/accounts returned no pages (and diagnostic checks failed)',
        {
          error: redactToken(e instanceof Error ? e.message : String(e)),
        },
      )
    }
  }

  return (pagesRes.data || []).map((p) => ({
    pageId: p.id,
    accessToken: p.access_token,
    displayName: p.name,
    category: p.category,
  }))
}
