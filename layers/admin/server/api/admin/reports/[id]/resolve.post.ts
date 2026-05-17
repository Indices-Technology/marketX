// POST /api/admin/reports/:id/resolve — moderator resolves a report
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'
import { resolveReportSchema } from '~~/layers/admin/server/schemas/admin.schemas'
import { ZodError } from 'zod'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireModerator(event)
    const id = getRouterParam(event, 'id')!
    const body = await readBody(event)
    const { action, moderatorNote } = resolveReportSchema.parse(body)

    const resolved = await adminService.resolveReport(id, user.id, action, moderatorNote)
    return { success: true, data: resolved }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Validation error', data: error.errors })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/reports/:id/resolve]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to resolve report' })
  }
})
