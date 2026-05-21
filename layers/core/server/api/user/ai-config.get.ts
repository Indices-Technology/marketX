import { defineEventHandler, getHeader, createError } from 'h3'
import { jwtVerify } from '~~/server/utils/auth/auth'
import { aiConfigService } from '~~/layers/core/server/services/aiConfig.service'

/**
 * GET /api/user/ai-config
 *
 * Returns the user's AI provider config.
 * - Called from the Dassah UI to show settings state (hasKey only, no raw key).
 * - Called from the Dassah API server with X-Dassah-Internal header to get
 *   the decrypted key for LLM calls.
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

  // Internal server-to-server call from Dassah — return decrypted key
  const isInternal = getHeader(event, 'x-dassah-internal') === process.env.MARKETX_API_KEY
  if (isInternal) {
    const config = await aiConfigService.getDecrypted(payload.userId)
    if (!config) return { configured: false }
    return { configured: true, ...config }
  }

  // Browser UI call — never expose the raw key
  const config = await aiConfigService.get(payload.userId)
  if (!config) return { configured: false }
  return { configured: true, provider: config.provider, model: config.model, hasKey: true }
})
