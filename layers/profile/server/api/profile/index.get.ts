// FILE PATH: server/layers/user/api/profile.get.ts

import { defineEventHandler } from 'h3'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { profileService } from '../../services/profile.service'
import { UserError } from '../../types/user.types'

export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = await requireAuth(event)

    // Get user profile
    const profile = await profileService.getProfile(user.id)

    return {
      success: true,
      data: profile,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
