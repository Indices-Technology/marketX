/**
 * db-cleanup.ts — remove closed-testing cruft, keep the seeded demo world.
 *
 *   Dry run (default, READ-ONLY):  npx tsx scripts/db-cleanup.ts
 *   Execute (DESTRUCTIVE):         npx tsx scripts/db-cleanup.ts --execute --backup-confirmed
 *
 * KEEP  = demo profiles (@peppr.test) + all staff/admin (role ∉ user/buyer/seller)
 *         and everything that hangs off them (stores, products, posts, media…).
 * DELETE= every other profile (real tester signups) and their content, plus a
 *         global wipe of transactional / messaging exhaust (orders, payments,
 *         carts, notifications, chats, reviews) — none of which is demo content.
 *
 * The keep-set is anchored on email + role, NOT on isDemo, so it is correct even
 * if run before the isDemo migration. `bayo@demo.test` is a real admin (role) and
 * is preserved; it is NOT a @peppr.test demo account. See docs/DB_CLEANUP.md.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const DEMO_EMAIL = '@peppr.test'
const NON_STAFF_ROLES = ['user', 'buyer', 'seller']

const EXECUTE = process.argv.includes('--execute')
const BACKUP_OK = process.argv.includes('--backup-confirmed')

const n = (v: number) => v.toString().padStart(6)

async function main() {
  const host = (process.env.DATABASE_URL ?? '').replace(/\/\/[^@]*@/, '//***@')
  console.log(`\nDB: ${host}`)
  console.log(EXECUTE ? '⚠  MODE: EXECUTE (destructive)\n' : '👀 MODE: dry run (no writes)\n')

  // ── Resolve the keep-set (email OR staff role) ──────────────────────────────
  const keep = await prisma.profile.findMany({
    where: {
      OR: [
        { email: { endsWith: DEMO_EMAIL } },
        { role: { notIn: NON_STAFF_ROLES } },
      ],
    },
    select: { id: true, email: true, role: true },
  })
  const keepIds = new Set(keep.map((p) => p.id))

  const del = await prisma.profile.findMany({
    where: {
      email: { not: { endsWith: DEMO_EMAIL } },
      role: { in: NON_STAFF_ROLES },
    },
    select: { id: true },
  })
  const delIds = del.map((p) => p.id)

  // Sellers/products owned by the to-be-deleted profiles (for reporting + follow cleanup)
  const delSellers = await prisma.sellerProfile.findMany({
    where: { profileId: { in: delIds } },
    select: { id: true },
  })
  const delSellerIds = delSellers.map((s) => s.id)
  const delProductCount = await prisma.products.count({
    where: { sellerId: { in: delSellerIds } },
  })
  const delPostCount = await prisma.post.count({ where: { authorId: { in: delIds } } })

  // ── Global-wipe table counts (all rows removed) ─────────────────────────────
  const [
    orders, orderItems, transactions, payouts, buyerTx, carts, reviews,
    notifications, messages, conversations, supportTickets, supportMsgs, podDeliveries,
  ] = await Promise.all([
    prisma.orders.count(), prisma.orderItem.count(), prisma.transaction.count(),
    prisma.payout.count(), prisma.buyerTransaction.count(), prisma.cartItem.count(),
    prisma.review.count(), prisma.notification.count(), prisma.message.count(),
    prisma.conversation.count(), prisma.supportTicket.count(),
    prisma.supportMessage.count(), prisma.podDelivery.count(),
  ])

  console.log('── KEEP (preserved) ─────────────────────────────────')
  console.log(`  profiles           ${n(keep.length)}   (${keep.filter((k) => !NON_STAFF_ROLES.includes(k.role)).length} staff)`)
  console.log('\n── DELETE: tester profiles + cascade ────────────────')
  console.log(`  profiles           ${n(delIds.length)}`)
  console.log(`  their sellers      ${n(delSellerIds.length)}`)
  console.log(`  their products     ${n(delProductCount)}`)
  console.log(`  their posts        ${n(delPostCount)}`)
  console.log('\n── DELETE: global transactional / messaging wipe ────')
  for (const [label, v] of [
    ['orders', orders], ['orderItems', orderItems], ['transactions', transactions],
    ['payouts', payouts], ['buyerTransactions', buyerTx], ['cartItems', carts],
    ['reviews', reviews], ['notifications', notifications], ['messages', messages],
    ['conversations', conversations], ['supportTickets', supportTickets],
    ['supportMessages', supportMsgs], ['podDeliveries', podDeliveries],
  ] as const) {
    console.log(`  ${label.padEnd(18)} ${n(v)}`)
  }

  console.log('\n── Staff accounts preserved ─────────────────────────')
  for (const s of keep.filter((k) => !NON_STAFF_ROLES.includes(k.role)))
    console.log(`  ${s.role.padEnd(14)} ${s.email}`)

  if (!EXECUTE) {
    console.log('\n👀 Dry run complete — nothing was written.')
    console.log('   To execute:  npx tsx scripts/db-cleanup.ts --execute --backup-confirmed\n')
    return
  }
  if (!BACKUP_OK) {
    console.error('\n⛔ Refusing to execute without --backup-confirmed.')
    console.error('   Create a Neon branch/snapshot first, verify you can restore it,')
    console.error('   then re-run with:  --execute --backup-confirmed\n')
    process.exit(1)
  }

  // ── Execute (single transaction) ────────────────────────────────────────────
  console.log('\n⏳ Deleting…')
  await prisma.$transaction(
    async (tx) => {
      // Global exhaust — order matters: clear rows that RESTRICT-reference orders
      // (notifications) before orders themselves.
      await tx.notification.deleteMany({})
      await tx.message.deleteMany({})
      await tx.conversation.deleteMany({})
      await tx.supportMessage.deleteMany({})
      await tx.supportTicket.deleteMany({})
      await tx.podDelivery.deleteMany({})
      await tx.orderItem.deleteMany({})
      await tx.orders.deleteMany({})
      await tx.transaction.deleteMany({})
      await tx.payout.deleteMany({})
      await tx.buyerTransaction.deleteMany({})
      await tx.cartItem.deleteMany({})
      await tx.review.deleteMany({})

      // FK trap: Comment.parent is onDelete:NoAction. If a KEPT user replied to a
      // to-be-deleted user's comment, cascading the parent's delete would be
      // restricted. Detach those replies first (flattens only affected threads).
      await tx.comment.updateMany({
        where: { parent: { authorId: { in: delIds } } },
        data: { parentId: null },
      })

      // Delete the tester profiles — cascades to their sellers, products, posts,
      // media, comments, likes, follows(as follower), sessions, wallets, etc.
      await tx.profile.deleteMany({ where: { id: { in: delIds } } })

      // Follow.followingId is a polymorphic id with no FK — clean dangling rows
      // that pointed at a deleted profile (USER) or deleted store (SELLER).
      await tx.follow.deleteMany({
        where: { followingId: { in: [...delIds, ...delSellerIds] } },
      })

      // Reviews were wiped globally → reset denormalised rating counters so the
      // surviving demo products/stores don't show phantom review totals.
      await tx.products.updateMany({ data: { averageRating: null, totalReviews: 0 } })
      await tx.sellerProfile.updateMany({ data: { averageRating: null, totalReviews: 0 } })

      // Ensure demo markers are set (idempotent with the migration backfill).
      await tx.profile.updateMany({
        where: { email: { endsWith: DEMO_EMAIL } },
        data: { isDemo: true },
      })
    },
    { timeout: 120_000, maxWait: 20_000 },
  )

  // ── Verify ──────────────────────────────────────────────────────────────────
  const [profilesLeft, ordersLeft, demoStores, demoPosts] = await Promise.all([
    prisma.profile.count(),
    prisma.orders.count(),
    prisma.sellerProfile.count({ where: { isDemo: true } }),
    prisma.post.count({ where: { isDemo: true } }),
  ])
  console.log('\n✅ Done.')
  console.log(`   profiles remaining : ${profilesLeft}`)
  console.log(`   orders remaining   : ${ordersLeft} (expect 0)`)
  console.log(`   demo stores        : ${demoStores}`)
  console.log(`   demo posts         : ${demoPosts}\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
