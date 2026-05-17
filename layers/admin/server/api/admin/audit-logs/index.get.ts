// GET /api/admin/audit-logs — platform audit trail (admin only)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const q = getQuery(event)
    const limit = Math.min(Number(q.limit) || 50, 200)
    const offset = Math.max(Number(q.offset) || 0, 0)
    const userId = q.userId as string | undefined
    const eventType = q.eventType as string | undefined

    const rows = await prisma.auditLog.findMany({
      where: {
        ...(userId ? { user_id: userId } : {}),
        ...(eventType ? { event_type: eventType } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: limit + 1,
      skip: offset,
      select: {
        id: true,
        event_type: true,
        user_id: true,
        email: true,
        ip_address: true,
        success: true,
        reason: true,
        metadata: true,
        created_at: true,
      },
    })

    const hasMore = rows.length > limit
    return {
      success: true,
      items: hasMore ? rows.slice(0, limit) : rows,
      meta: { limit, offset, hasMore },
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/audit-logs]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch audit logs' })
  }
})
