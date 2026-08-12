/**
 * Backfill `Orders.deliveredAt` and correct the reputation signals that were
 * frozen at `delivered: false` because of it.
 *
 * Why this exists: `deliveredAt` used to be written ONLY by carrier scans
 * (server/services/carrierProgress.ts). Buyer-confirmed orders — and every
 * pickup order, which has no carrier at all — reached status DELIVERED with a
 * null `deliveredAt`, so `commerce.order_completed` recorded `delivered: false`.
 * Signals are idempotent on (sourceRef, signalKey), so re-running the normal
 * backfill SKIPS those rows: the wrong value would stick forever. The ledger is
 * append-only, so the fix is to supersede, never to edit in place.
 *
 * Three passes, all idempotent — safe to re-run:
 *   1. Orders PAID + COMPLETED/DELIVERED with a null deliveredAt get one, dated
 *      from the best evidence available (see `deliveryTimestamp`).
 *   2. Active order_completed signals holding `delivered: false` for those
 *      orders get a superseding row with `delivered: true`.
 *   3. Affected sellers' cached ReputationProfile snapshots are retired so the
 *      Trust Card/tab recompute on next read instead of after the 6h TTL.
 *
 * Usage:
 *   npx tsx scripts/backfill-delivered-at.ts              # dry run (default)
 *   npx tsx scripts/backfill-delivered-at.ts --apply
 *   npx tsx scripts/backfill-delivered-at.ts --apply --slug=hadronpower
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const APPLY = process.argv.includes('--apply')
const SLUG = process.argv
  .find((a) => a.startsWith('--slug='))
  ?.slice('--slug='.length)

const SIGNAL_KEY = 'commerce.order_completed'

/**
 * When did delivery actually happen? Best evidence first:
 *  1. The signal's observedAt — emitOrderCompleted stamped it at the moment the
 *     buyer confirmed, which is the closest record we have of the real event.
 *  2. Orders.updated_at — when the status last changed, i.e. the confirmation.
 *  3. created_at — floor, so the row is never dated in the future.
 */
function deliveryTimestamp(
  order: { created_at: Date; updated_at: Date },
  signalObservedAt: Date | null,
): Date {
  return signalObservedAt ?? order.updated_at ?? order.created_at
}

async function main() {
  const sellerFilter = SLUG
    ? await prisma.sellerProfile.findFirst({
        where: { store_slug: SLUG },
        select: { id: true, store_name: true },
      })
    : null
  if (SLUG && !sellerFilter) throw new Error(`No seller with slug "${SLUG}"`)

  const orders = await prisma.orders.findMany({
    where: {
      paymentStatus: 'PAID',
      status: { in: ['COMPLETED', 'DELIVERED'] },
      deliveredAt: null,
      ...(sellerFilter
        ? {
            orderItem: {
              some: { variant: { product: { sellerId: sellerFilter.id } } },
            },
          }
        : {}),
    },
    select: {
      id: true,
      created_at: true,
      updated_at: true,
      isPickup: true,
      shipState: true,
      county: true,
      orderItem: {
        take: 1,
        select: {
          variant: { select: { product: { select: { sellerId: true } } } },
        },
      },
    },
    orderBy: { id: 'asc' },
  })

  console.log(
    `${APPLY ? 'APPLY' : 'DRY RUN'} — ${orders.length} order(s) missing deliveredAt` +
      (sellerFilter ? ` for ${sellerFilter.store_name}` : ' (platform-wide)'),
  )

  const touchedSellers = new Set<string>()
  let stamped = 0
  let superseded = 0
  let created = 0

  for (const o of orders) {
    const sellerId = o.orderItem[0]?.variant?.product?.sellerId
    if (!sellerId) {
      console.log(`  #${o.id} — no seller on order items, skipped`)
      continue
    }

    const signal = await prisma.reputationSignal.findFirst({
      where: {
        sourceRef: `Orders:${o.id}`,
        signalKey: SIGNAL_KEY,
        revokedAt: null,
        supersededById: null,
      },
      select: { id: true, observedAt: true, value: true, sellerId: true },
    })

    const at = deliveryTimestamp(o, signal?.observedAt ?? null)
    const value = (signal?.value ?? {}) as Record<string, unknown>
    const alreadyTrue = value.delivered === true

    console.log(
      `  #${o.id}${o.isPickup ? ' (pickup)' : ''} → deliveredAt=${at.toISOString()}` +
        (!signal
          ? ' · no signal, will create'
          : alreadyTrue
            ? ' · signal already delivered:true'
            : ' · will supersede signal'),
    )

    if (!APPLY) {
      touchedSellers.add(sellerId)
      continue
    }

    await prisma.orders.update({ where: { id: o.id }, data: { deliveredAt: at } })
    stamped++
    touchedSellers.add(sellerId)

    if (signal && alreadyTrue) continue

    // Append the corrected observation, then point the old row at it. Order
    // matters: until supersededById is set both rows are active, and a reader
    // landing in that window would double-count this sale.
    const replacement = await prisma.reputationSignal.create({
      data: {
        sellerId: signal?.sellerId ?? sellerId,
        signalKey: SIGNAL_KEY,
        dimension: 'COMMERCE',
        tier: 'GOLD',
        value: {
          orderId: o.id,
          delivered: true,
          place: (value.place as string | null) ?? o.shipState ?? o.county ?? null,
          // Provenance for the correction: this row restates an earlier
          // observation, it is not a second sale.
          correction: 'deliveredAt_backfill',
        },
        confidence: 1,
        sourceType: 'ESCROW_TRANSACTION',
        sourceRef: `Orders:${o.id}`,
        method: 'ORDER_DELIVERED_PAID',
        verifierId: 'system',
        observedAt: at,
      },
      select: { id: true },
    })

    if (signal) {
      await prisma.reputationSignal.update({
        where: { id: signal.id },
        data: { supersededById: replacement.id },
      })
      superseded++
    } else {
      created++
    }
  }

  // Retire cached snapshots so the next read recomputes from the corrected
  // ledger. (In the running app the signal writer does this automatically; a
  // script writing straight to the DB has to do it itself.)
  let retired = 0
  if (APPLY && touchedSellers.size) {
    const res = await prisma.reputationProfile.updateMany({
      where: { sellerId: { in: [...touchedSellers] }, isCurrent: true },
      data: { isCurrent: false },
    })
    retired = res.count
  }

  console.log(
    APPLY
      ? `\nDone — ${stamped} order(s) stamped, ${superseded} signal(s) superseded, ` +
          `${created} signal(s) created, ${retired} snapshot(s) retired ` +
          `across ${touchedSellers.size} seller(s).`
      : `\nDry run — ${orders.length} order(s) across ${touchedSellers.size} seller(s) would change. Re-run with --apply.`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
