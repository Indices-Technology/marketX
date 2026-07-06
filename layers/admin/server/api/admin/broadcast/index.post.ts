// POST /api/admin/broadcast — send a platform-wide announcement (admin only)
import { z, ZodError } from 'zod'
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

const schema = z.object({
  message: z.string().trim().min(3, 'Message is too short').max(500),
  target: z.enum(['all', 'sellers', 'buyers']).default('all'),
})

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const { message, target } = schema.parse(await readBody(event))

    const result = await adminService.broadcast({
      message,
      target,
      moderatorId: admin.id,
    })
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: error.errors[0]?.message ?? 'Invalid request' })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/broadcast]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to send broadcast' })
  }
})
