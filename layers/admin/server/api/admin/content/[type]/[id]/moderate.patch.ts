// PATCH /api/admin/content/:type/:id/moderate — directly moderate any content
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'
import { moderateContentSchema } from '~~/layers/admin/server/schemas/admin.schemas'
import type { ContentType } from '@prisma/client'
import { ZodError } from 'zod'

export default defineEventHandler(async (event) => {
  try {
    await requireModerator(event)
    const type = getRouterParam(event, 'type') as ContentType
    const id = getRouterParam(event, 'id')!
    const body = await readBody(event)
    const { status } = moderateContentSchema.parse(body)

    await adminService.moderateContent(type, id, status)
    return { success: true, data: { type, id, status } }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Validation error', data: error.errors })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[PATCH /api/admin/content/:type/:id/moderate]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to moderate content' })
  }
})
