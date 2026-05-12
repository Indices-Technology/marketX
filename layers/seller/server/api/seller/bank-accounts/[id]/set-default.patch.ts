// PATCH /api/seller/bank-accounts/[id]/set-default
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) throw new UserError('INVALID', 'Account ID required', 400)

    const account = await prisma.bankAccount.findUnique({
      where: { id },
      include: { seller: { select: { profileId: true } } },
    })
    if (!account)
      throw new UserError('NOT_FOUND', 'Bank account not found', 404)
    if (account.seller.profileId !== user.id)
      throw new UserError('FORBIDDEN', 'Access denied', 403)

    // Unset all defaults for this seller, then set this one
    await prisma.bankAccount.updateMany({
      where: { sellerId: account.sellerId },
      data: { isDefault: false },
    })
    await prisma.bankAccount.update({
      where: { id },
      data: { isDefault: true },
    })

    return { success: true }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[PATCH /api/seller/bank-accounts/:id/set-default]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
