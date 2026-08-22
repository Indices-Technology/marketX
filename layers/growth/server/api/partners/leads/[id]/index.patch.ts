// PATCH /api/partners/leads/:id — move a lead through the pipeline (admin only)
import { z, ZodError } from 'zod'
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { partnerLeadService } from '~~/layers/growth/server/services/partnerLead.service'

const schema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'APPROVED', 'REJECTED']),
  notes: z.string().trim().max(5000).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    if (!id)
      throw createError({ statusCode: 400, statusMessage: 'Missing lead id' })

    const body = schema.parse(await readBody(event))
    const lead = await partnerLeadService.updateStatus(
      id,
      body.status,
      body.notes,
    )

    return { success: true, data: lead }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
      })
    logger.logError('[partners/leads:update]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
