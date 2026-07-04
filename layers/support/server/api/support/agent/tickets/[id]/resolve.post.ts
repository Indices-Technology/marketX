// POST /api/support/agent/tickets/:id/resolve — resolve + (for disputes) apply outcome
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireSupportAgent } from '~~/server/layers/shared/middleware/requireRole'
import { supportService } from '~~/layers/support/server/services/support.service'

const schema = z.object({
  resolution: z.string().trim().min(3).max(2000),
  disputeOutcome: z
    .enum(['REFUND_BUYER', 'RELEASE_SELLER', 'PARTIAL_REFUND', 'REJECTED'])
    .optional(),
  refundAmount: z.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const agent = await requireSupportAgent(event)
    const id = getRouterParam(event, 'id') || ''
    const body = schema.parse(await readBody(event))

    if (body.disputeOutcome === 'PARTIAL_REFUND' && !body.refundAmount)
      throw new UserError(
        'AMOUNT_REQUIRED',
        'A refund amount is required for a partial refund',
        400,
      )

    const updated = await supportService.resolveTicket({
      ticketId: id,
      agent: { id: agent.id },
      resolution: body.resolution,
      disputeOutcome: body.disputeOutcome,
      refundAmount: body.refundAmount,
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
    logger.logError('[support/agent:resolve]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
