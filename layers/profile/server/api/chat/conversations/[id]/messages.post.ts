// POST /api/chat/conversations/[id]/messages - Send message
import { chatService } from '~~/layers/profile/server/services/chat.service'
import { createMessageSchema } from '~~/layers/profile/server/schemas/chat.schema'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) throw new UserError('INVALID_ID', 'ID is required', 400)

    const body = await readBody(event)
    // Validate: non-empty, ≤5000 chars. Without this, an empty/missing text
    // reaches the required Message.content column and surfaces as a 500.
    const parsed = createMessageSchema.safeParse(body)
    if (!parsed.success) {
      throw new UserError(
        'INVALID_MESSAGE',
        parsed.error.issues[0]?.message || 'Invalid message',
        400,
      )
    }

    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // chatService.sendMessage handles DB write + Soketi real-time push.
    // (Message has no `type` column — the schema field is vestigial and is not
    // forwarded; the 4th/5th args are ipAddress/userAgent.)
    const result = await chatService.sendMessage(
      id,
      user.id,
      parsed.data.text,
      ipAddress,
      userAgent,
    )

    return { success: true, data: result }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[POST /api/chat/conversations/:id/messages]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
