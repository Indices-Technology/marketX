// POST /api/admin/sellers/:id/verify — approve or reject seller verification (moderator+)
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'
import { verifySellerSchema } from '~~/layers/admin/server/schemas/admin.schemas'
import { ZodError } from 'zod'

export default defineEventHandler(async (event) => {
  try {
    await requireModerator(event)
    const id = getRouterParam(event, 'id')!
    const body = await readBody(event)
    const { status, reason } = verifySellerSchema.parse(body)

    const seller = await adminService.verifySeller(id, status, reason)
    return { success: true, data: seller }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Validation error', data: error.errors })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/sellers/:id/verify]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to update seller verification' })
  }
})
