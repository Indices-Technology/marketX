/**
 * db-purge-junk.ts — remove automated-test junk that lives on DEMO accounts.
 *
 *   Dry run (default):  npx tsx scripts/db-purge-junk.ts
 *   Execute:            npx tsx scripts/db-purge-junk.ts --execute
 *
 * Scope is limited to demo content (seller.isDemo / author.isDemo), so staff /
 * owner stores (hausacaps, hadronpower) are never touched. Deletes products &
 * posts whose title/caption is obvious QA scaffolding ("SkuA ms3q…", "Test
 * Product 178…", "PUBLIC probe …", "WallNotif …", "Debug Probe XYZ").
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

// Test-scaffolding vocabulary + random hash/timestamp tokens (e.g. "ms3qno44e22hb",
// "1785108035"). Real product names ("Swiss Voile Lace Fabric (5 yards)") don't match.
const JUNK =
  /\d{6,}|[a-z]*\d[a-z0-9]{5,}|\b(probe|leak|debug|wallnotif|audit|oos|dup|skua?|e2e|qa|sanity|smoke)\b|accept product|offer product|test product|^(good|bad|alpha|beta|test)\s/i

const EXECUTE = process.argv.includes('--execute')

async function main() {
  console.log(EXECUTE ? '⚠  EXECUTE\n' : '👀 dry run (no writes)\n')

  // Demo products / posts only
  const products = await prisma.products.findMany({
    where: { seller: { isDemo: true } },
    select: { id: true, title: true, store_slug: true },
  })
  const posts = await prisma.post.findMany({
    where: { OR: [{ isDemo: true }, { author: { isDemo: true } }] },
    select: { id: true, caption: true, content: true, author: { select: { username: true } } },
  })

  const junkProducts = products.filter((p) => JUNK.test(p.title))
  const junkPosts = posts.filter((p) => JUNK.test(`${p.caption ?? ''} ${p.content ?? ''}`))

  const junkProductIds = junkProducts.map((p) => p.id)
  const junkPostIds = junkPosts.map((p) => p.id)

  // Report what SURVIVES per affected store (so nothing real is silently lost)
  const affected = [...new Set(junkProducts.map((p) => p.store_slug))]
  console.log(`Demo products: ${products.length}  → junk: ${junkProducts.length}`)
  for (const slug of affected) {
    const keep = products.filter((p) => p.store_slug === slug && !JUNK.test(p.title))
    console.log(`\n  ${slug}: deleting ${products.filter((p) => p.store_slug === slug && JUNK.test(p.title)).length}, keeping ${keep.length}:`)
    for (const k of keep) console.log(`     ✓ ${JSON.stringify(k.title)}`)
  }

  console.log(`\nDemo posts: ${posts.length}  → junk: ${junkPosts.length}`)
  for (const p of junkPosts)
    console.log(`     ✗ [${p.author?.username}] ${JSON.stringify((p.caption ?? p.content ?? '').slice(0, 50))}`)

  if (!EXECUTE) {
    console.log('\n👀 Dry run — nothing written. Re-run with --execute to delete.\n')
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.post.deleteMany({ where: { id: { in: junkPostIds } } })
    // Relations to products without ON DELETE CASCADE — clear first so the
    // product delete can't be blocked by a RESTRICT.
    await tx.story.deleteMany({ where: { productId: { in: junkProductIds } } })
    await tx.squareOffer.deleteMany({ where: { productId: { in: junkProductIds } } })
    // Products delete cascades variants, media, tags, likes, comments, analytics.
    await tx.products.deleteMany({ where: { id: { in: junkProductIds } } })
  }, { timeout: 120_000, maxWait: 20_000 })

  const [prodLeft, postLeft] = await Promise.all([
    prisma.products.count({ where: { seller: { isDemo: true } } }),
    prisma.post.count({ where: { author: { isDemo: true } } }),
  ])
  console.log(`\n✅ Deleted ${junkProductIds.length} products, ${junkPostIds.length} posts.`)
  console.log(`   demo products left: ${prodLeft}   demo posts left: ${postLeft}\n`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
