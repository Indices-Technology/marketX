import { z } from 'zod'
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

const schema = z.object({
  role: z.enum(['user', 'moderator', 'admin', 'support_agent']),
})

export default defineEventHandler(async (event) => {
  const actor = await requireAdmin(event)
  const { id } = getRouterParams(event)

  if (id === actor.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot change your own role' })
  }

  const body = await readValidatedBody(event, schema.parse)
  const result = await adminService.setUserRole(id, body.role, actor.id)
  return { data: result }
})
