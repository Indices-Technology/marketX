// GET /api/partners/leads — partnership / API waitlist pipeline (admin only)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { partnerLeadService } from '~~/layers/growth/server/services/partnerLead.service'
import type { PartnerLeadStatus, PartnerLeadType } from '@prisma/client'

const TYPES = ['PARTNERSHIP', 'API'] as const
const STATUSES = ['NEW', 'CONTACTED', 'APPROVED', 'REJECTED'] as const

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const q = getQuery(event)

    const type = TYPES.includes(q.type as never)
      ? (q.type as PartnerLeadType)
      : undefined
    const status = STATUSES.includes(q.status as never)
      ? (q.status as PartnerLeadStatus)
      : undefined

    const limit = Math.min(Number(q.limit) || 50, 200)
    const offset = Math.max(Number(q.offset) || 0, 0)

    const { items, total } = await partnerLeadService.list({
      type,
      status,
      limit,
      offset,
    })

    return {
      success: true,
      items,
      meta: { limit, offset, total, hasMore: offset + items.length < total },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[partners/leads:list]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
