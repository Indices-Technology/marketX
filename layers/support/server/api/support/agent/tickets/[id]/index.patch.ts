// PATCH /api/support/agent/tickets/:id — assign / prioritise / move status
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireSupportAgent } from '~~/server/layers/shared/middleware/requireRole'
import { supportService } from '~~/layers/support/server/services/support.service'

const schema = z.object({
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED'])
    .optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignToMe: z.boolean().optional(),
  assignToId: z.string().uuid().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const agent = await requireSupportAgent(event)
    const id = getRouterParam(event, 'id') || ''
    const body = schema.parse(await readBody(event))

    const updated = await supportService.agentUpdate(id, { id: agent.id }, body)
    return { success: true, data: updated }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
      })
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    logger.logError('[support/agent:update]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
