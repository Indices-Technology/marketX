// POST /api/reports — authenticated users submit a content report
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { adminService } from '~~/layers/admin/server/services/admin.service'
import { submitReportSchema } from '~~/layers/admin/server/schemas/admin.schemas'
import { ZodError } from 'zod'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)
    const data = submitReportSchema.parse(body)

    const report = await adminService.submitReport({ reporterId: user.id, ...data })
    return { success: true, data: report }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Validation error', data: error.errors })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/reports]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to submit report' })
  }
})
