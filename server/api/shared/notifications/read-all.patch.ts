// PATCH /api/user/notifications/read-all - Mark all as read
import { requireAuth } from '../../..//layers/shared/middleware/requireAuth'
import { notificationService } from '~~/layers/profile/server/services/notification.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const result = await notificationService.markAllAsRead(user.id)
    return { success: true, data: result }
  } catch (error: unknown) {
    // Pass through H3 errors (e.g. requireAuth 401) — don't bury them as 500
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[PATCH /api/shared/notifications/read-all]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
