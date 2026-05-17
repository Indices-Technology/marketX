// FILE PATH: server/layers/user/api/profile.patch.ts

import { defineEventHandler, readBody } from 'h3'

import { ZodError } from 'zod'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { updateProfileSchema } from '../../schemas/profile.schema'
import { profileService } from '../../services/profile.service'
import { UserError } from '../../types/user.types'
import { bust } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const body = await readBody(event)
    const validatedData = updateProfileSchema.parse(body)

    const ipAddress = getClientIP(event)
    const userAgent = event.node.req.headers['user-agent'] || 'Unknown'

    const updated = await profileService.updateProfile(
      user.id,
      validatedData,
      ipAddress,
      userAgent,
    )

    // Bust own-profile cache so next GET reflects the change
    bust(`profile:own:${user.id}`).catch(() => {})

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors,
      })
    }

    if (error instanceof UserError && error.message.includes('UserError')) {
      const userError = error as any
      throw createError({
        statusCode: userError.statusCode || 400,
        statusMessage: error.message,
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
