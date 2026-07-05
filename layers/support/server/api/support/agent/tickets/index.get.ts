// GET /api/support/agent/tickets — the agent queue (support_agent | admin)
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireSupportAgent } from '~~/server/layers/shared/middleware/requireRole'
import { supportService } from '~~/layers/support/server/services/support.service'

export default defineEventHandler(async (event) => {
  try {
    const agent = await requireSupportAgent(event)
    const q = getQuery(event)
    const limit = Math.min(Number(q.limit) || 25, 100)
    const offset = Math.max(Number(q.offset) || 0, 0)

    return {
      success: true,
      ...(await supportService.listQueue({
        status: typeof q.status === 'string' ? q.status : undefined,
        priority: typeof q.priority === 'string' ? q.priority : undefined,
        type: typeof q.type === 'string' ? q.type : undefined,
        assignedAgentId: q.mine === 'true' ? agent.id : undefined,
        unassigned: q.unassigned === 'true',
        limit,
        offset,
      })),
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    logger.logError('[support/agent:queue]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
