// GET /api/chat/unread-count — total unread messages for the current user
// (across both the conversations they're a participant in and their store's).
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { chatService } from '../../services/chat.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const count = await chatService.getTotalUnread(user.id)
    return { success: true, data: { count } }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/chat/unread-count]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
