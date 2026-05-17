// GET /api/admin/reports — paginated moderation queue (moderator+)
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'
import type { ReportStatus, ContentType } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    await requireModerator(event)
    const q = getQuery(event)
    const limit = Math.min(Number(q.limit) || 20, 50)
    const offset = Math.max(Number(q.offset) || 0, 0)
    const status = (q.status as ReportStatus) || 'PENDING'
    const contentType = q.contentType as ContentType | undefined

    const result = await adminService.listReports({ status, contentType, limit, offset })
    return { success: true, ...result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/reports]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch reports' })
  }
})
