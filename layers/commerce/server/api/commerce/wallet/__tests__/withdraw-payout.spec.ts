import 'dotenv/config'
import { test, expect } from '@playwright/test'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { hashPassword } from '../../../../../../../server/utils/auth/auth'

/**
 * A successful withdrawal, end to end, against a real database.
 *
 * Every other wallet spec covers the paths where withdrawal is REFUSED — no
 * auth, no amount, negative, above balance, below the fee floor. None of them
 * ever creates a payout, so the code deciding what a seller is actually owed had
 * no coverage at all: the Payout table was empty on every environment.
 *
 * What must hold when the request succeeds:
 *   - the wallet is debited the GROSS (what the seller asked for)
 *   - the payout records the NET separately (what a bank transfer must send)
 *   - net + platformFee + transferFee reconciles back to the gross
 *   - amountGross mirrors the legacy `amount`, so old and new readers agree
 *   - the legacy bank_account JSON still agrees with the new columns
 *
 * The seller, store and wallet are created per-run and torn down, rather than
 * borrowing seed accounts — the same reasoning as user-ban.spec.ts, and doubly
 * so here because this spec moves money.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const PASSWORD = 'test1234'
const SEED_BALANCE = 5_000_000 // ₦50,000 in kobo — comfortably above the fee floor
const WITHDRAW = 1_000_000 //     ₦10,000 in kobo

let profileId: string
let sellerId: string
let walletId: string
let storeSlug: string
let email: string
let payoutId: string

test.describe('POST /api/commerce/wallet/withdraw — successful payout', () => {
  test.beforeAll(async () => {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    profileId = randomUUID()
    email = `payout_${suffix}@test.local`
    storeSlug = `payout-store-${suffix}`

    await prisma.profile.create({
      data: {
        id: profileId,
        email,
        username: `po_${suffix}`.slice(0, 20),
        password_hash: await hashPassword(PASSWORD),
        role: 'seller',
        // REQUIRE_EMAIL_VERIFICATION is on; an unverified account cannot log in.
        email_verified: true,
        email_verified_at: new Date(),
      },
    })

    const seller = await prisma.sellerProfile.create({
      data: { profileId, store_name: `Payout Test ${suffix}`, store_slug: storeSlug },
      select: { id: true },
    })
    sellerId = seller.id

    const wallet = await prisma.sellerWallet.create({
      data: { sellerId, balance: SEED_BALANCE },
      select: { id: true },
    })
    walletId = wallet.id
  })

  test.afterAll(async () => {
    // Cascades from Profile remove the seller, wallet, payouts and transactions.
    if (profileId) {
      await prisma.profile.deleteMany({ where: { id: profileId } })
    }
    await prisma.$disconnect()
  })

  test('debits the gross, records the net, and reconciles the split', async ({ request }) => {
    const login = await request.post('/api/auth/login', {
      data: { email, password: PASSWORD },
    })
    expect(login.status(), await login.text()).toBe(200)
    const { accessToken } = await login.json()

    const res = await request.post('/api/commerce/wallet/withdraw', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        amount: WITHDRAW,
        storeSlug,
        bankAccount: {
          account_number: '0123456789',
          bank_code: '058',
          name: 'Payout Test Store',
        },
      },
    })

    expect(res.status(), await res.text()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    payoutId = body.data.payout.id as string

    // ── The row a payout executor would read ────────────────────────────────
    const payout = await prisma.payout.findUniqueOrThrow({
      where: { id: payoutId },
      select: {
        amount: true,
        amountGross: true,
        amountNet: true,
        platformFee: true,
        transferFee: true,
        status: true,
        bank_account: true,
      },
    })

    expect(payout.status).toBe('PENDING')
    expect(payout.amount).toBe(WITHDRAW)
    expect(payout.amountGross).toBe(WITHDRAW)

    // The whole point: net is present, strictly smaller than gross, reconciles.
    expect(payout.amountNet).not.toBeNull()
    expect(payout.amountNet!).toBeLessThan(payout.amountGross)
    expect(payout.amountNet! + payout.platformFee! + payout.transferFee!).toBe(
      payout.amountGross,
    )

    // ── The wallet is debited the GROSS, not the net ─────────────────────────
    const wallet = await prisma.sellerWallet.findUniqueOrThrow({
      where: { id: walletId },
      select: { balance: true },
    })
    expect(wallet.balance).toBe(SEED_BALANCE - WITHDRAW)

    // ── The response breakdown agrees with what was persisted ────────────────
    expect(body.data.breakdown.gross).toBe(payout.amountGross)
    expect(body.data.breakdown.net).toBe(payout.amountNet)

    // ── Dual-write: the legacy JSON must agree with the new columns, or the
    //    admin screen's fallback would disagree with the executor's column.
    const json = payout.bank_account as Record<string, unknown>
    expect(json.netAmount).toBe(payout.amountNet)
    expect(json.account_number).toBe('0123456789')
  })

  test('a DEBIT transaction is recorded for the gross', async () => {
    // The ledger must show what left the wallet, not what reached the bank —
    // the fees stay with the platform and are not a separate wallet movement.
    const debit = await prisma.transaction.findFirstOrThrow({
      where: { walletId, type: 'DEBIT' },
      select: { amount: true },
    })
    expect(debit.amount).toBe(WITHDRAW)
  })

  test('rejects a second withdrawal that would exceed the remaining balance', async ({ request }) => {
    // Balance is now SEED_BALANCE - WITHDRAW. Asking for the original amount
    // again must fail rather than drive the wallet negative.
    const login = await request.post('/api/auth/login', {
      data: { email, password: PASSWORD },
    })
    const { accessToken } = await login.json()

    const res = await request.post('/api/commerce/wallet/withdraw', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        amount: SEED_BALANCE,
        storeSlug,
        bankAccount: { account_number: '0123456789', bank_code: '058', name: 'Payout Test Store' },
      },
    })
    expect(res.status()).toBe(400)

    const wallet = await prisma.sellerWallet.findUniqueOrThrow({
      where: { id: walletId },
      select: { balance: true },
    })
    expect(wallet.balance).toBe(SEED_BALANCE - WITHDRAW)
  })
})
