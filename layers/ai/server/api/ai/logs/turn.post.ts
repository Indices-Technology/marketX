// POST /api/ai/logs/turn
// Fire-and-forget — Dassah logs every conversation turn here after responding.
// Does not block the user's response. Failures are caught and logged server-side.
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiDataService } from '../../../services/ai-data.service'

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const body = await readBody(event)
  const {
    userId, sessionId, channel, intent,
    userMessage, assistantResponse, toolsCalled,
    ragHits, tokensPrompt, tokensCompletion,
    latencyMs, modelUsed, guardBlocked,
  } = body ?? {}

  if (!userId || !sessionId || !channel || !userMessage || !assistantResponse) {
    throw createError({ statusCode: 400, statusMessage: 'userId, sessionId, channel, userMessage, assistantResponse are required' })
  }

  // fire-and-forget — response returns immediately
  aiDataService.logTurn({
    userId,
    sessionId,
    channel,
    intent,
    userMessage,
    assistantResponse,
    toolsCalled: Array.isArray(toolsCalled) ? toolsCalled : [],
    ragHits,
    tokensPrompt,
    tokensCompletion,
    latencyMs,
    modelUsed,
    guardBlocked,
  })

  return { success: true }
})
