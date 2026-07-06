// POST /api/admin/payouts/:id/process — mark a withdrawal PAID or REJECTED
// (admin only — real money; reject refunds the seller's wallet).
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing payout id' })

    const body = await readBody(event)
    const action = body?.action
    if (action !== 'PAID' && action !== 'REJECTED') {
      throw createError({
        statusCode: 400,
        statusMessage: 'action must be PAID or REJECTED',
      })
    }
    const transactionRef =
      typeof body?.transactionRef === 'string'
        ? body.transactionRef.trim() || undefined
        : undefined

    const result = await adminService.processPayout(id, action, {
      transactionRef,
      moderatorId: admin.id,
    })
    return { success: true, data: result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/payouts/:id/process]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to process payout' })
  }
})
