// POST /api/commerce/wallet/withdraw

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { walletService } from '../../../services/wallet.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)
    const { amount, bankAccount, storeSlug } = body

    if (!amount || isNaN(Number(amount)))
      throw new UserError('INVALID_INPUT', 'amount is required', 400)
    if (!bankAccount)
      throw new UserError(
        'INVALID_INPUT',
        'bankAccount details are required',
        400,
      )

    // Resolve which seller's wallet to withdraw from.
    let sellerId: string | null = null

    // Preferred: explicit store (the per-store finance page always sends this).
    // Ownership is enforced by scoping the lookup to the requesting user.
    if (storeSlug) {
      const store = await prisma.sellerProfile.findFirst({
        where: { store_slug: storeSlug, profileId: user.id },
        select: { id: true },
      })
      if (!store)
        throw new UserError('NOT_FOUND', 'Store not found or access denied', 404)
      sellerId = store.id
    }

    // Legacy path: resolve via the bank account record.
    if (!sellerId && bankAccount.accountId) {
      const saved = await prisma.bankAccount.findUnique({
        where: { id: bankAccount.accountId },
        include: { seller: { select: { id: true, profileId: true } } },
      })
      if (saved && saved.seller.profileId === user.id) {
        sellerId = saved.seller.id
      }
    }

    // Fallback: resolve from the user's active seller profiles. If they own more
    // than one store, refuse to guess — an ambiguous fallback could debit the
    // wrong store's wallet. The caller must name the store explicitly.
    if (!sellerId) {
      const stores = await prisma.sellerProfile.findMany({
        where: { profileId: user.id, is_active: true },
        select: { id: true },
      })
      if (!stores.length)
        throw new UserError(
          'SELLER_REQUIRED',
          'No active seller profile found',
          403,
        )
      if (stores.length > 1)
        throw new UserError(
          'STORE_REQUIRED',
          'You have multiple stores — specify which store to withdraw from',
          400,
        )
      sellerId = stores[0]!.id
    }

    // Deduct platform + transfer fees from the requested gross amount
    const gross = Number(amount)
    const { net, platformFee, transferFee, totalFees } = calculatePayout(gross)

    // Reject withdrawals the fees would fully consume — wallet would be
    // debited while the seller receives nothing
    if (net <= 0)
      throw new UserError(
        'AMOUNT_TOO_SMALL',
        `Amount must exceed the ${totalFees / 100} NGN in fees`,
        400,
      )

    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // Withdraw the gross from wallet; seller receives net after fees
    const result = await walletService.withdraw(
      sellerId,
      gross,
      { ...bankAccount, netAmount: net, platformFee, transferFee },
      ipAddress,
      userAgent,
    )

    return {
      success: true,
      data: { ...result, breakdown: { gross, net, platformFee, transferFee } },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[POST /api/commerce/wallet/withdraw]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
