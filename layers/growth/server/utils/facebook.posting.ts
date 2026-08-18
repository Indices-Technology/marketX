/**
 * Facebook Graph API — Page photo posting. Simpler than TikTok's posting
 * vertical: no domain-verification dance (Meta just needs the URL to be
 * publicly fetchable, and our existing /growth/cards/:id proxy already is),
 * no mandatory privacy picker (a Page post is public by definition), no
 * async draft/processing step — the photo endpoint publishes synchronously
 * and returns the post id immediately. See docs/GROWTH_ENGINE.md.
 */

// Kept in sync with facebook.oauth.ts / facebook.import.ts — v19.0 was
// retired ("v18.0 and v19.0 calls return 400 errors" as of 2026).
const GRAPH_API_VERSION = 'v25.0'

/**
 * A non-2xx HTTP response makes ofetch throw a FetchError instead of a
 * resolved JSON body — normalize both shapes into a readable message so it
 * doesn't escape as an opaque, Nitro-redacted "Server Error" in prod.
 */
function describeFetchError(e: unknown): string {
  const err = e as {
    data?: { error?: { message?: string; code?: number } }
    statusCode?: number
    status?: number
    statusMessage?: string
    message?: string
  }
  const apiMessage = err?.data?.error?.message
  if (apiMessage) return `Facebook: ${apiMessage}`
  const status = err?.statusCode ?? err?.status
  if (status)
    return `Facebook API request failed (${status} ${err?.statusMessage || ''})`.trim()
  return err?.message || 'Facebook API request failed'
}

export interface PostPhotoArgs {
  pageId: string
  /** The PAGE's own access token (from /me/accounts at connect time), not the user token. */
  pageAccessToken: string
  /** Public image URL — Facebook fetches it server-side. */
  photoUrl: string
  caption: string
}

/**
 * Publish a photo directly to a Page's feed. Graph API params go on the query
 * string (its documented convention, regardless of HTTP method) rather than a
 * JSON body, which the Graph API does not parse.
 */
export async function postPhotoToPage(
  args: PostPhotoArgs,
): Promise<{ postId: string }> {
  let res: { id?: string; post_id?: string; error?: { message?: string } }
  try {
    res = await $fetch<typeof res>(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${args.pageId}/photos`,
      {
        method: 'POST',
        query: {
          url: args.photoUrl,
          caption: args.caption,
          access_token: args.pageAccessToken,
        },
      },
    )
  } catch (e) {
    throw new Error(describeFetchError(e))
  }
  if (res.error) throw new Error(`Facebook: ${res.error.message}`)
  const postId = res.post_id || res.id
  if (!postId) throw new Error('Facebook did not return a post id')
  return { postId }
}
