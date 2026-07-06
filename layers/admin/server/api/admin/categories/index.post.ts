// POST /api/admin/categories — create a category (moderator+)
import { z, ZodError } from 'zod'
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and hyphens'),
  thumbnailCatUrl: z.string().url().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    await requireModerator(event)
    const data = schema.parse(await readBody(event))
    const category = await adminService.createCategory(data)
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: error.errors[0]?.message ?? 'Invalid request' })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/categories]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to create category' })
  }
})
