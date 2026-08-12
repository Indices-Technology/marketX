// POST /api/media/upload - Upload media to Cloudinary (pure proxy, no DB write)

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { uploadBufferToCloudinary } from '~~/layers/core/server/utils/cloudinaryUpload'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/webm',
  'audio/x-m4a',
]
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)

    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw new UserError('NO_FILE', 'No file provided', 400)
    }

    const fileField = formData.find((f) => f.name === 'file')
    if (!fileField || !fileField.data) {
      throw new UserError('NO_FILE', 'No file field in form data', 400)
    }

    const mimeType = fileField.type || 'image/jpeg'
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new UserError(
        'INVALID_TYPE',
        `File type ${mimeType} not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        400,
      )
    }

    if (fileField.data.length > MAX_SIZE_BYTES) {
      throw new UserError('FILE_TOO_LARGE', 'File must be under 50MB', 400)
    }

    if (!useRuntimeConfig().public.cloudName) {
      throw new UserError('CONFIG_ERROR', 'Cloudinary not configured', 500)
    }

    const result = await uploadBufferToCloudinary(
      Buffer.from(fileField.data),
      mimeType,
      fileField.filename || 'upload',
    )

    // Return Cloudinary result — no DB write. Media is created atomically during post creation.
    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError) {
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    }
    logger.logError('[POST /api/media/upload]', error, { requestId: event.context?.requestId })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload media',
    })
  }
})
