// POST /api/user/conversations - Create conversation

import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { chatService } from '../../services/chat.service'
import { UserError } from '../../types/user.types'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)

    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    // Must target exactly one of: a store (storeId) or another user (targetId).
    if (!body.storeId && !body.targetId)
      throw new UserError('INVALID_TARGET', 'storeId or targetId is required', 400)
    if (body.storeId && !UUID.test(String(body.storeId)))
      throw new UserError('INVALID_TARGET', 'Invalid storeId', 400)
    if (body.targetId && !UUID.test(String(body.targetId)))
      throw new UserError('INVALID_TARGET', 'Invalid targetId', 400)
    // No talking to yourself.
    if (!body.storeId && body.targetId === user.id)
      throw new UserError('INVALID_TARGET', 'Cannot start a conversation with yourself', 400)

    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // storeId  → buyer messaging a store
    // targetId → user messaging another user
    const result = body.storeId
      ? await chatService.createStoreConversation(
          user.id,
          body.storeId,
          body.productId,
          ipAddress,
          userAgent,
        )
      : await chatService.createConversation(
          user.id,
          body.targetId,
          body.productId,
          ipAddress,
          userAgent,
        )
    return { success: true, data: result }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[POST /api/chat/conversations]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
