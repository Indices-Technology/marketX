// POST /api/growth/facebook/import
// Re-uploads a set of Facebook Page-post images to Cloudinary so they can
// seed bulk-import product rows (same StagedMedia shape as a device upload).
// Body: { images: string[] } — URLs the caller got from GET
// /api/growth/facebook/posts, NOT arbitrary input: every URL is checked
// against isAllowedFacebookImageUrl before being fetched server-side, so this
// can't become an open SSRF proxy.

import { z } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { isAllowedFacebookImageUrl } from '~~/layers/growth/server/utils/facebook.import'
import { uploadBufferToCloudinary } from '~~/layers/core/server/utils/cloudinaryUpload'

const MAX_IMAGES = 10
const MAX_IMAGE_BYTES = 15 * 1024 * 1024 // 15MB — generous for a FB CDN photo

const bodySchema = z.object({
  images: z.array(z.string().url()).min(1).max(MAX_IMAGES),
})

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)

    const raw = await readBody(event)
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      throw new UserError(
        'BAD_REQUEST',
        parsed.error.errors[0]?.message ?? 'Invalid input',
        400,
      )
    }

    const media: { url: string; public_id: string; type: 'IMAGE' }[] = []
    for (const imageUrl of parsed.data.images) {
      if (!isAllowedFacebookImageUrl(imageUrl)) {
        throw new UserError('INVALID_SOURCE', 'Image is not from Facebook', 400)
      }

      const res = await $fetch.raw(imageUrl, { responseType: 'arrayBuffer' })
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const buffer = Buffer.from(res._data as ArrayBuffer)
      if (buffer.length > MAX_IMAGE_BYTES) {
        throw new UserError('FILE_TOO_LARGE', 'Image exceeds 15MB', 400)
      }

      const uploaded = await uploadBufferToCloudinary(
        buffer,
        contentType,
        'facebook-import.jpg',
      )
      media.push({ url: uploaded.url, public_id: uploaded.public_id, type: 'IMAGE' })
    }

    return { success: true, data: { media } }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/growth/facebook/import]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to import Facebook images',
    })
  }
})
