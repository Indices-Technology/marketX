/**
 * POD orchestrator — provider selection, state-machine guard, and the freight /
 * settlement money math. Pure for now (no persistence): the DB writes land once
 * the PodDelivery migration is applied (see docs/POD.md §4). Money amounts are
 * MINOR units (kobo).
 */

import { prisma } from '~~/server/utils/db'
import type { IPodProvider, PodRouteContext, PodState } from '../utils/types'
import { canPodTransition } from '../utils/types'
import { enabledPodProviders, resolvePodProvider } from '../providers/registry'

function pct(envKey: string, fallback: number): number {
  const n = parseFloat(process.env[envKey] ?? '')
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export interface FreightSplit {
  depositMinor: number
  taxMinor: number
  /** Net freight owed as cost-of-freight (deposit − platform tax). */
  netMinor: number
}

export interface SettlementSplit {
  grossMinor: number
  platformFeeMinor: number
  sellerNetMinor: number
}

export const podService = {
  /** All POD providers currently switched on. */
  providers(): IPodProvider[] {
    return enabledPodProviders()
  },

  /** Pick the POD provider for a context (seller opt-in + coverage), or null. */
  selectProvider(ctx: PodRouteContext): IPodProvider | null {
    return resolvePodProvider(ctx)
  },

  /** State-machine guard — reject any transition not in POD_TRANSITIONS. */
  canTransition(from: PodState, to: PodState): boolean {
    return canPodTransition(from, to)
  },

  /**
   * Platform tax on the buyer's freight deposit. POD_FREIGHT_TAX_PCT (percent,
   * default 0). The net is what's owed as cost-of-freight — to the courier on a
   * successful delivery, or to the seller on a proven failed attempt.
   */
  splitFreight(depositMinor: number): FreightSplit {
    const taxMinor = Math.round(
      (depositMinor * pct('POD_FREIGHT_TAX_PCT', 0)) / 100,
    )
    return { depositMinor, taxMinor, netMinor: depositMinor - taxMinor }
  },

  /**
   * Seller settlement from the product cash the courier collected + remitted.
   * PLATFORM_FEE_PERCENT (percent, default 5).
   */
  settleFromCod(grossMinor: number): SettlementSplit {
    const platformFeeMinor = Math.round(
      (grossMinor * pct('PLATFORM_FEE_PERCENT', 5)) / 100,
    )
    return {
      grossMinor,
      platformFeeMinor,
      sellerNetMinor: grossMinor - platformFeeMinor,
    }
  },

  /**
   * Debit the platform fee for confirmed POD orders (transitional seller-collect
   * model: the seller keeps the product cash and pre-pays the platform its cut).
   * Called only AFTER the freight deposit is confirmed — from pod-verify and the
   * webhook. Idempotent per order (skips if a PLATFORM_FEE_DEBIT already exists)
   * and best-effort (a shortfall is logged, not fatal — the buyer has already
   * paid). Superseded later by courier-remittance settlement (settleFromCod).
   */
  async debitSellerPodFees(orderIds: number[]): Promise<void> {
    if (!orderIds.length) return
    const feePct = pct('PLATFORM_FEE_PERCENT', 5)
    const items = await prisma.orderItem.findMany({
      where: { orderId: { in: orderIds } },
      include: {
        variant: {
          include: {
            product: { include: { seller: { select: { id: true } } } },
          },
        },
      },
    })

    // One order = one seller in this model, so track a representative orderId.
    const bySeller = new Map<string, { orderId: number; fee: number }>()
    for (const it of items) {
      const sellerId = it.variant?.product?.seller?.id
      if (!sellerId) continue
      const fee = Math.round((it.price * feePct) / 100)
      const cur = bySeller.get(sellerId) ?? { orderId: it.orderId, fee: 0 }
      cur.fee += fee
      bySeller.set(sellerId, cur)
    }

    for (const [sellerId, { orderId, fee }] of bySeller) {
      if (fee <= 0) continue
      const already = await prisma.transaction.findFirst({
        where: { orderId, type: 'PLATFORM_FEE_DEBIT' },
        select: { id: true },
      })
      if (already) continue
      try {
        await prisma.$transaction(async (tx) => {
          const wallet = await tx.sellerWallet.findUniqueOrThrow({
            where: { sellerId },
          })
          await tx.sellerWallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: fee } },
          })
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              amount: fee,
              type: 'PLATFORM_FEE_DEBIT',
              description: `POD platform fee — Order #${orderId}`,
              orderId,
            },
          })
        })
      } catch (e) {
        console.error('[pod] platform fee debit failed (owed)', {
          sellerId,
          orderId,
          fee,
          error: (e as Error)?.message,
        })
      }
    }
  },
}
