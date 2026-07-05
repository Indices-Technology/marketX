// POST /api/support/agent/tickets/:id/reply — agent reply or internal note
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireSupportAgent } from '~~/server/layers/shared/middleware/requireRole'
import { supportService } from '~~/layers/support/server/services/support.service'

const schema = z.object({
  body: z.string().trim().min(1).max(5000),
  internalNote: z.boolean().optional(),
  attachments: z
    .array(z.object({ url: z.string().url(), name: z.string().max(200) }))
    .max(6)
    .optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const agent = await requireSupportAgent(event)
    const id = getRouterParam(event, 'id') || ''
    const body = schema.parse(await readBody(event))

    const updated = await supportService.agentReply({
      ticketId: id,
      agent: { id: agent.id },
      body: body.body,
      internalNote: body.internalNote,
      attachments: body.attachments,
    })
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
    logger.logError('[support/agent:reply]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
