// POST /api/admin/squares/:id/status — approve / suspend / reactivate (admin only)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing square id' })

    const body = await readBody(event)
    const status = body?.status
    if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
      throw createError({
        statusCode: 400,
        statusMessage: 'status must be ACTIVE or SUSPENDED',
      })
    }

    const result = await adminService.setSquareStatus(id, status, admin.id)
    return { success: true, data: result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/squares/:id/status]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to update square' })
  }
})
