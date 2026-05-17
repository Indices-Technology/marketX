import { z } from 'zod'
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

const schema = z.object({
  isActive: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const actor = await requireModerator(event)
  const { id } = getRouterParams(event)

  if (id === actor.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot disable your own account' })
  }

  const body = await readValidatedBody(event, schema.parse)
  const result = await adminService.toggleUserActive(id, body.isActive)
  return { data: result }
})
