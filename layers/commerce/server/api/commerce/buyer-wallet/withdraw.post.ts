// POST /api/commerce/buyer-wallet/withdraw
//
// Cash out affiliate commission earned by a referrer who has no seller profile.
// Sellers withdraw through /api/commerce/wallet/withdraw instead — their
// commission is credited to their seller wallet, not here.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { walletService } from '../../../services/wallet.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)
    const { amount, bankAccount } = body

    if (!amount || isNaN(Number(amount)))
      throw new UserError('INVALID_INPUT', 'amount is required', 400)
    if (!bankAccount?.account_number || !bankAccount?.bank_code)
      throw new UserError(
        'INVALID_INPUT',
        'bankAccount with account_number and bank_code is required',
        400,
      )

    const gross = Number(amount)

    // Preview the split for the caller's benefit and to reject a request the
    // fees would swallow whole. The service recomputes it and owns what is
    // persisted, so this cannot influence the payable.
    const { net, totalFees } = calculatePayout(gross)
    if (net <= 0)
      throw new UserError(
        'AMOUNT_TOO_SMALL',
        `Amount must exceed the ${totalFees / 100} NGN in fees`,
        400,
      )

    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    const result = await walletService.withdrawAffiliateEarnings(
      user.id,
      gross,
      bankAccount,
      ipAddress,
      userAgent,
    )

    return { success: true, data: result }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[POST /api/commerce/buyer-wallet/withdraw]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
