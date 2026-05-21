import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { jwtVerify } from '~~/server/utils/auth/auth'
import { aiConfigService } from '~~/layers/core/server/services/aiConfig.service'

const SUPPORTED_PROVIDERS = ['anthropic', 'openai'] as const
const SUPPORTED_MODELS: Record<string, string[]> = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  openai:    ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
}

/**
 * PUT /api/user/ai-config
 * Body: { provider, model, apiKey }
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

  const { provider, model, apiKey } = await readBody(event)

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw createError({ statusCode: 400, statusMessage: `Unsupported provider. Choose: ${SUPPORTED_PROVIDERS.join(', ')}` })
  }
  if (!model || typeof model !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'model is required' })
  }
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
    throw createError({ statusCode: 400, statusMessage: 'apiKey is required' })
  }

  await aiConfigService.upsert(payload.userId, provider, model, apiKey)

  return { success: true, provider, model }
})
