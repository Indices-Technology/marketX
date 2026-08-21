import 'dotenv/config'
import { test, expect } from '@playwright/test'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { hashPassword } from '../../../../../../../server/utils/auth/auth'

/**
 * Dispute holds — the property the whole feature exists for.
 *
 * Before WalletHold, a dispute on a DELIVERED order had no wallet effect: the
 * money had already moved to `balance`, reverseOrderCredit found no
 * CREDIT_PENDING rows, and nothing stopped the seller withdrawing it. The only
 * thing standing in the way was that a human sent every payout by hand.
 *
 * These assert the money side directly against the database and the withdrawal
 * endpoint, which is where the guarantee has to hold. The seller and wallet are
 * created and torn down per run.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const PASSWORD = 'test1234'
const BALANCE = 5_000_000 // ₦50,000
const HELD = 3_000_000 //   ₦30,000 frozen by a dispute

let profileId: string
let walletId: string
let storeSlug: string
let email: string

const login = async (request: any) => {
  const res = await request.post('/api/auth/login', { data: { email, password: PASSWORD } })
  const body = await res.json()
  return body.accessToken as string
}

test.describe('wallet — dispute holds', () => {
  test.beforeAll(async () => {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    profileId = randomUUID()
    email = `hold_${suffix}@test.local`
    storeSlug = `hold-store-${suffix}`

    await prisma.profile.create({
      data: {
        id: profileId,
        email,
        username: `hd_${suffix}`.slice(0, 20),
        password_hash: await hashPassword(PASSWORD),
        role: 'seller',
        email_verified: true,
        email_verified_at: new Date(),
      },
    })
    const seller = await prisma.sellerProfile.create({
      data: { profileId, store_name: `Hold Test ${suffix}`, store_slug: storeSlug },
      select: { id: true },
    })
    const wallet = await prisma.sellerWallet.create({
      data: { sellerId: seller.id, balance: BALANCE },
      select: { id: true },
    })
    walletId = wallet.id
  })

  // Each test owns its starting state. Chained tests hide which assertion
  // actually broke when one fails, and this file is asserting money movement.
  test.beforeEach(async () => {
    await prisma.walletHold.deleteMany({ where: { walletId } })
    await prisma.transaction.deleteMany({ where: { walletId } })
    await prisma.payout.deleteMany({ where: { walletId } })
    await prisma.sellerWallet.update({
      where: { id: walletId },
      data: { balance: BALANCE, held_balance: 0 },
    })
  })

  const freeze = async (amount: number, orderId: number) => {
    await prisma.$transaction([
      prisma.sellerWallet.update({
        where: { id: walletId },
        data: { held_balance: amount },
      }),
      prisma.walletHold.create({
        data: {
          walletId,
          orderId,
          ticketId: randomUUID(),
          amount,
          amountRequested: amount,
          reason: `Dispute on order #${orderId}`,
        },
      }),
    ])
  }

  test.afterAll(async () => {
    if (profileId) await prisma.profile.deleteMany({ where: { id: profileId } })
    await prisma.$disconnect()
  })

  test('the database refuses to freeze more than the wallet holds', async () => {
    // SellerWallet_held_not_above_balance is what makes "we froze money that
    // isn't there" unrepresentable rather than merely avoided in code.
    await expect(
      prisma.sellerWallet.update({
        where: { id: walletId },
        data: { held_balance: BALANCE + 1 },
      }),
    ).rejects.toThrow()

    const w = await prisma.sellerWallet.findUniqueOrThrow({
      where: { id: walletId },
      select: { held_balance: true },
    })
    expect(w.held_balance).toBe(0)
  })

  test('a held balance blocks withdrawal of the frozen portion', async ({ request }) => {
    await freeze(HELD, 999_999_001)

    const token = await login(request)
    const bankAccount = { account_number: '0123456789', bank_code: '058', name: 'Hold Test' }

    // Withdrawing more than (balance - held) must be refused, even though the
    // raw balance would cover it.
    const tooMuch = await request.post('/api/commerce/wallet/withdraw', {
      headers: { Authorization: `Bearer ${token}` },
      data: { amount: BALANCE - HELD + 1, storeSlug, bankAccount },
    })
    expect(tooMuch.status()).toBe(400)
    expect(await tooMuch.text()).toContain('hold')

    // The balance must be untouched by the refused attempt.
    const after = await prisma.sellerWallet.findUniqueOrThrow({
      where: { id: walletId },
      select: { balance: true, held_balance: true },
    })
    expect(after.balance).toBe(BALANCE)
    expect(after.held_balance).toBe(HELD)

    // Withdrawing within the unheld portion still works.
    const ok = await request.post('/api/commerce/wallet/withdraw', {
      headers: { Authorization: `Bearer ${token}` },
      data: { amount: BALANCE - HELD, storeSlug, bankAccount },
    })
    expect(ok.status(), await ok.text()).toBe(200)

    const drained = await prisma.sellerWallet.findUniqueOrThrow({
      where: { id: walletId },
      select: { balance: true, held_balance: true },
    })
    // Balance is now exactly the held amount — and held_balance <= balance,
    // the invariant, still holds at the boundary.
    expect(drained.balance).toBe(HELD)
    expect(drained.held_balance).toBe(HELD)
  })

  test('the wallet endpoint reports withdrawable separately from balance', async ({ request }) => {
    // A seller shown ₦30,000 and refused a ₦30,000 withdrawal has no way to
    // understand why unless the held amount is surfaced explicitly.
    await freeze(HELD, 999_999_001)

    const token = await login(request)
    const res = await request.get('/api/commerce/wallet', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const { data } = await res.json()

    expect(data.held).toBe(HELD)
    // Withdrawable is balance minus the frozen portion — not the raw balance,
    // which is the number that would mislead the seller.
    expect(data.available).toBe(BALANCE - HELD)
    expect(data.wallet.balance).toBe(BALANCE)
    expect(data.holds.length).toBeGreaterThan(0)
    expect(data.holds[0].orderId).toBe(999_999_001)
  })

  test('releasing the hold makes the money withdrawable again', async ({ request }) => {
    await freeze(HELD, 999_999_002)
    const hold = await prisma.walletHold.findFirstOrThrow({
      where: { walletId, status: 'ACTIVE' },
      select: { id: true, amount: true },
    })
    await prisma.$transaction([
      prisma.walletHold.update({
        where: { id: hold.id },
        data: { status: 'RELEASED', resolved_at: new Date() },
      }),
      prisma.sellerWallet.update({
        where: { id: walletId },
        data: { held_balance: { decrement: hold.amount } },
      }),
    ])

    const token = await login(request)
    const res = await request.post('/api/commerce/wallet/withdraw', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        amount: HELD,
        storeSlug,
        bankAccount: { account_number: '0123456789', bank_code: '058', name: 'Hold Test' },
      },
    })
    expect(res.status(), await res.text()).toBe(200)

    const w = await prisma.sellerWallet.findUniqueOrThrow({
      where: { id: walletId },
      select: { balance: true, held_balance: true },
    })
    expect(w.balance).toBe(BALANCE - HELD)
    expect(w.held_balance).toBe(0)
  })
})
