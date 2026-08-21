// GET /api/commerce/wallet

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { walletService } from '../../../services/wallet.service'
import { walletRepository } from '../../../repositories/wallet.repository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const sellerProfiles = await walletRepository.getActiveSellerProfiles(user.id)

    if (!sellerProfiles.length) {
      // Non-seller: return empty wallet state
      return {
        success: true,
        data: {
          wallet: { balance: 0, pending_balance: 0 },
          stats: { totalEarned: 0, totalSpent: 0 },
          available: 0,
          held: 0,
          holds: [],
          stores: [],
        },
      }
    }

    // Fetch wallet + stats per store in parallel
    const storeWallets = await Promise.all(
      sellerProfiles.map(async (sp) => {
        const { wallet, stats, available, held, holds } =
          await walletService.getWallet(sp.id)
        return {
          storeId: sp.id,
          storeName: sp.store_name,
          storeSlug: sp.store_slug,
          wallet,
          stats,
          // Per-store, because withdrawal is per-store: an aggregate figure
          // cannot tell a seller which store's money is frozen.
          available,
          held,
          holds,
        }
      }),
    )

    // Aggregate totals across all stores
    const totalBalance = storeWallets.reduce(
      (sum, s) => sum + (s.wallet?.balance ?? 0),
      0,
    )
    const totalPending = storeWallets.reduce(
      (sum, s) => sum + (s.wallet?.pending_balance ?? 0),
      0,
    )
    const totalEarned = storeWallets.reduce(
      (sum, s) => sum + (s.stats?.totalEarned ?? 0),
      0,
    )
    const totalSpent = storeWallets.reduce(
      (sum, s) => sum + (s.stats?.totalSpent ?? 0),
      0,
    )
    // Withdrawable and frozen totals. `balance` on its own is misleading the
    // moment a dispute is open — a seller shown a balance they cannot withdraw
    // has no way to understand the refusal without these.
    const totalAvailable = storeWallets.reduce((sum, s) => sum + (s.available ?? 0), 0)
    const totalHeld = storeWallets.reduce((sum, s) => sum + (s.held ?? 0), 0)
    const allHolds = storeWallets.flatMap((s) =>
      (s.holds ?? []).map((h) => ({ ...h, storeSlug: s.storeSlug })),
    )

    return {
      success: true,
      data: {
        wallet: { balance: totalBalance, pending_balance: totalPending },
        stats: { totalEarned, totalSpent },
        available: totalAvailable,
        held: totalHeld,
        holds: allHolds,
        stores: storeWallets,
      },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[GET /api/commerce/wallet]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
