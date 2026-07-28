/**
 * db-audit.ts — READ-ONLY snapshot of the live DB before cleanup.
 *
 * Prints how much data is demo (seeded @peppr.test) vs. everything else, so we
 * know the blast radius before deleting anything. Touches nothing.
 *
 * Run: npx tsx scripts/db-audit.ts
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const DEMO_EMAIL = '@peppr.test'

async function main() {
  const host = (process.env.DATABASE_URL ?? '').replace(/\/\/[^@]*@/, '//***@')
  console.log('DB:', host, '\n')

  // Demo (seeded) profiles
  const demoProfiles = await prisma.profile.findMany({
    where: { email: { endsWith: DEMO_EMAIL } },
    select: { id: true, email: true, role: true, username: true },
  })
  const demoIds = demoProfiles.map((p) => p.id)

  const [
    totalProfiles,
    totalSellers,
    demoSellers,
    totalProducts,
    demoProducts,
    totalPosts,
    demoPosts,
    standaloneDemoPosts, // demo posts NOT tied to a product
    totalOrders,
    totalOrderItems,
    totalTransactions,
    totalCartItems,
    totalReviews,
    adminish,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.sellerProfile.count(),
    prisma.sellerProfile.count({ where: { profileId: { in: demoIds } } }),
    prisma.products.count(),
    prisma.products.count({ where: { seller: { profileId: { in: demoIds } } } }),
    prisma.post.count(),
    prisma.post.count({ where: { authorId: { in: demoIds } } }),
    prisma.post.count({
      where: {
        authorId: { in: demoIds },
        isProductPost: false,
        taggedProducts: { none: {} },
      },
    }),
    prisma.orders.count(),
    prisma.orderItem.count(),
    prisma.transaction.count(),
    prisma.cartItem.count(),
    prisma.review.count(),
    prisma.profile.findMany({
      where: { role: { notIn: ['user', 'buyer', 'seller'] } },
      select: { email: true, role: true },
    }),
  ])

  const realProfiles = totalProfiles - demoProfiles.length

  const row = (label: string, val: number | string) =>
    console.log(`  ${label.padEnd(34)} ${val}`)

  console.log('── DEMO (seeded @peppr.test) — KEEP ─────────────────')
  row('demo profiles', demoProfiles.length)
  row('demo sellers', demoSellers)
  row('demo products', demoProducts)
  row('demo posts (total)', demoPosts)
  row('  ↳ standalone posts (no product)', standaloneDemoPosts)
  console.log('\n── NON-DEMO — CANDIDATE FOR DELETION ────────────────')
  row('other profiles', realProfiles)
  row('other sellers', totalSellers - demoSellers)
  row('other products', totalProducts - demoProducts)
  row('other posts', totalPosts - demoPosts)
  console.log('\n── GLOBAL (all deleted per plan) ────────────────────')
  row('orders', totalOrders)
  row('orderItems', totalOrderItems)
  row('transactions', totalTransactions)
  row('cartItems', totalCartItems)
  row('reviews', totalReviews)
  console.log('\n── STAFF / ADMIN accounts (MUST preserve) ───────────')
  if (adminish.length === 0) console.log('  (none found)')
  for (const a of adminish) row(a.role, a.email)

  console.log('\nDemo profile roster:')
  for (const p of demoProfiles)
    console.log(`  ${p.role.padEnd(8)} ${p.username ?? '—'}  <${p.email}>`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
