import { defineEventHandler, getHeader, createError } from 'h3'
import { jwtVerify } from '~~/server/utils/auth/auth'
import { aiConfigService } from '~~/layers/core/server/services/aiConfig.service'

/**
 * DELETE /api/user/ai-config
 * Removes the user's AI config — reverts to platform default model.
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Missing Bearer token' })
  }

  const token = authHeader.slice(7)
  let payload
  try {
    payload = jwtVerify(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }

  await aiConfigService.delete(payload.userId)
  return { success: true }
})
