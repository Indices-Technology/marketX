/**
 * TikTok Content Posting API — creator info + photo direct-post + status.
 * See docs/GROWTH_ENGINE.md. Photos are PULL_FROM_URL only (verified domain);
 * we pass our own /growth/cards/:id URL. Unaudited apps ⇒ posts are SELF_ONLY.
 */

const BASE = 'https://open.tiktokapis.com/v2'
const JSON_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json; charset=UTF-8',
})

function ok(res: { error?: { code?: string; message?: string } }) {
  if (res.error && res.error.code && res.error.code !== 'ok') {
    throw new Error(`TikTok: ${res.error.message || res.error.code}`)
  }
}

/**
 * A non-2xx HTTP response (e.g. a scope/permission 403) makes ofetch throw a
 * FetchError instead of resolving into `ok()`'s JSON-body check above. Convert
 * it into a plain Error with a readable message — otherwise it escapes the
 * caller's `'statusCode' in error` passthrough as an un-blessed H3 error and
 * Nitro's prod handler redacts it down to the opaque "Server Error".
 */
function describeFetchError(e: unknown): string {
  const err = e as {
    data?: { error?: { code?: string; message?: string } }
    statusCode?: number
    status?: number
    statusMessage?: string
    message?: string
  }
  const apiMessage = err?.data?.error?.message || err?.data?.error?.code
  if (apiMessage) return `TikTok: ${apiMessage}`
  const status = err?.statusCode ?? err?.status
  if (status) return `TikTok API request failed (${status} ${err?.statusMessage || ''})`.trim()
  return err?.message || 'TikTok API request failed'
}

export interface TikTokCreatorInfo {
  nickname?: string
  username?: string
  avatarUrl?: string
  /** Privacy levels the post may use — the seller must pick one of these. */
  privacyOptions: string[]
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
}

/** Required before any post — also drives the mandatory privacy-picker UX. */
export async function queryCreatorInfo(accessToken: string): Promise<TikTokCreatorInfo> {
  let res: { data?: Record<string, unknown>; error?: { code?: string; message?: string } }
  try {
    res = await $fetch(`${BASE}/post/publish/creator_info/query/`, {
      method: 'POST',
      headers: JSON_HEADERS(accessToken),
      body: {},
    })
  } catch (e) {
    throw new Error(describeFetchError(e))
  }
  ok(res)
  const d = (res.data ?? {}) as Record<string, unknown>
  return {
    nickname: d.creator_nickname as string | undefined,
    username: d.creator_username as string | undefined,
    avatarUrl: d.creator_avatar_url as string | undefined,
    privacyOptions: (d.privacy_level_options as string[]) ?? [],
    commentDisabled: !!d.comment_disabled,
    duetDisabled: !!d.duet_disabled,
    stitchDisabled: !!d.stitch_disabled,
  }
}

export interface InitPhotoArgs {
  accessToken: string
  /** Public image URL on a TikTok-verified domain (our /growth/cards/:id). */
  photoUrl: string
  title?: string
  description?: string
  /** Must be one of creator_info.privacyOptions. Unaudited ⇒ SELF_ONLY. */
  privacyLevel: string
  disableComment?: boolean
}

/** Direct-post a photo. Returns the publish_id to poll for status. */
export async function initPhotoPost(args: InitPhotoArgs): Promise<{ publishId: string }> {
  let res: { data?: { publish_id?: string }; error?: { code?: string; message?: string } }
  try {
    res = await $fetch(`${BASE}/post/publish/content/init/`, {
      method: 'POST',
      headers: JSON_HEADERS(args.accessToken),
      body: {
        post_info: {
          title: args.title ?? '',
          description: args.description ?? '',
          privacy_level: args.privacyLevel,
          disable_comment: args.disableComment ?? false,
          auto_add_music: true,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_cover_index: 0,
          photo_images: [args.photoUrl],
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      },
    })
  } catch (e) {
    throw new Error(describeFetchError(e))
  }
  ok(res)
  const publishId = res.data?.publish_id
  if (!publishId) throw new Error('TikTok did not return a publish_id')
  return { publishId }
}

/** Poll a post's processing status. */
export async function getPostStatus(
  accessToken: string,
  publishId: string,
): Promise<{ status: string; failReason?: string }> {
  let res: { data?: { status?: string; fail_reason?: string }; error?: { code?: string; message?: string } }
  try {
    res = await $fetch(`${BASE}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: JSON_HEADERS(accessToken),
      body: { publish_id: publishId },
    })
  } catch (e) {
    throw new Error(describeFetchError(e))
  }
  ok(res)
  return {
    status: res.data?.status ?? 'UNKNOWN',
    failReason: res.data?.fail_reason,
  }
}
