/**
 * Facebook Graph API — reading a Page's own posts for the bulk-import picker
 * (turn a past post's photos into staged product rows). Read-only counterpart
 * to facebook.posting.ts; same Graph API version, same error normalisation.
 */

// Kept in sync with facebook.oauth.ts / facebook.posting.ts — v19.0 was
// retired ("v18.0 and v19.0 calls return 400 errors" as of 2026).
const GRAPH_API_VERSION = 'v25.0'
const MAX_POSTS = 25
const MAX_IMAGES_PER_POST = 10

function describeFetchError(e: unknown): string {
  const err = e as {
    data?: { error?: { message?: string } }
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

export interface FacebookImportPost {
  id: string
  message: string | null
  createdTime: string
  permalinkUrl: string | null
  images: string[]
}

interface GraphAttachmentMedia {
  image?: { src?: string }
}
interface GraphAttachment {
  media_type?: string
  media?: GraphAttachmentMedia
  subattachments?: { data?: { media?: GraphAttachmentMedia }[] }
}
interface GraphPost {
  id: string
  message?: string
  created_time: string
  permalink_url?: string
  full_picture?: string
  attachments?: { data?: GraphAttachment[] }
}

function extractImages(post: GraphPost): string[] {
  const attachment = post.attachments?.data?.[0]
  if (attachment?.subattachments?.data?.length) {
    return attachment.subattachments.data
      .map((s) => s.media?.image?.src)
      .filter((src): src is string => !!src)
      .slice(0, MAX_IMAGES_PER_POST)
  }
  const single = attachment?.media?.image?.src || post.full_picture
  return single ? [single] : []
}

/**
 * List a Page's recent posts, normalised to their photo(s) — text-only posts
 * (no image) are dropped since they can't seed a product row.
 */
export async function getPagePosts(
  pageId: string,
  pageAccessToken: string,
): Promise<FacebookImportPost[]> {
  let res: { data?: GraphPost[]; error?: { message?: string } }
  try {
    res = await $fetch<typeof res>(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/posts`,
      {
        query: {
          fields:
            'id,message,created_time,permalink_url,full_picture,attachments{media_type,media,subattachments{media}}',
          limit: MAX_POSTS,
          access_token: pageAccessToken,
        },
      },
    )
  } catch (e) {
    throw new Error(describeFetchError(e))
  }
  if (res.error) throw new Error(`Facebook: ${res.error.message}`)

  return (res.data || [])
    .map((post) => ({
      id: post.id,
      message: post.message ?? null,
      createdTime: post.created_time,
      permalinkUrl: post.permalink_url ?? null,
      images: extractImages(post),
    }))
    .filter((post) => post.images.length > 0)
}

/** Hosts Facebook actually serves post images from — a re-upload proxy must
 *  never fetch an arbitrary caller-supplied URL (SSRF), so only these are
 *  allowed through. */
const ALLOWED_IMAGE_HOST_RE = /(^|\.)(fbcdn\.net|fbsbx\.com)$/i

export function isAllowedFacebookImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && ALLOWED_IMAGE_HOST_RE.test(url.hostname)
  } catch {
    return false
  }
}
