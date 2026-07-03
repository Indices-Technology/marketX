// POST /api/commerce/payments/verify
// Called by the client after Paystack redirect to confirm payment.
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { walletService } from '../../../services/wallet.service'
import { orderRepository } from '../../../repositories/order.repository'
import { paymentService } from '~~/layers/payments/server/services/payment.service'
import { squareService } from '~~/layers/square/server/services/square.service'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'

/** Notify every unique seller whose products are in this order */
async function notifySellers(orderId: number, buyerName: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      variant: {
        include: {
          product: {
            include: { seller: { select: { profileId: true } } },
          },
        },
      },
    },
  })

  const seen = new Set<string>()
  for (const item of items) {
    const sellerId = item.variant?.product?.seller?.profileId
    if (!sellerId || seen.has(sellerId)) continue
    seen.add(sellerId)
    notificationQueue.enqueue({
      userId: sellerId,
      type: 'ORDER',
      actorId: sellerId,
      message: `New order #${orderId} received from ${buyerName}`,
    })
  }
}

const schema = z.object({ reference: z.string().min(1) })

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { reference } = schema.parse(await readBody(event))

    // 1. Find all per-seller orders sharing this payment reference
    const orders = await orderRepository.getOrdersByPaymentRef(reference)
    if (!orders.length) throw new UserError('NOT_FOUND', 'Order not found for this reference', 404)
    if (orders.some((o) => o.userId !== user.id)) throw new UserError('FORBIDDEN', 'Access denied', 403)

    const orderIds = orders.map((o) => o.id)

    // 2. Already confirmed — idempotent early return
    if (orders.every((o) => o.paymentStatus === 'PAID')) {
      return { success: true, data: { status: 'already_paid', orderIds } }
    }

    // 3. Money-gate: verify with the provider AND assert the collected amount
    // covers what the group owes (items + shipping), recomputed from the DB —
    // never trusting the client-supplied amounts from checkout.
    const expectedMinor = orders.reduce(
      (s, o) => s + o.totalAmount + (o.shippingCost ?? 0),
      0,
    )
    const confirm = await paymentService.confirmPayment({
      reference,
      expectedMinor,
      expectedCurrency: 'NGN',
    })

    if (confirm.ok) {
      // Per order: atomic flip — only the first caller (vs the webhook) gets
      // count > 0, so side effects run once per order (no double-crediting).
      for (const o of orders) {
        const { count } = await prisma.orders.updateMany({
          where: { id: o.id, paymentStatus: { notIn: ['PAID', 'FAILED'] } },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        })
        if (count > 0) {
          notifySellers(o.id, user.username || user.email || 'a customer')
            .catch((e) => logger.error('Verify: notify sellers failed', { orderId: o.id, error: e?.message ?? e }))
          walletService.creditSellersOnPayment(o.id)
            .catch((e) => logger.error('Verify: wallet credit failed', { orderId: o.id, error: e?.message ?? e }))
          squareService.creditAssociationsForOrder(o.id)
            .catch((e) => logger.error('Verify: association credit failed', { orderId: o.id, error: e?.message ?? e }))
        }
      }
      // One buyer confirmation email for the purchase
      if (user.email && !user.email.includes('@checkout.marketx.app')) {
        const { subject, html, text } = buildOrderStatusEmail(orderIds[0]!, 'CONFIRMED')
        emailQueue.enqueue({ to: user.email, subject, html, text, type: 'ORDER_CONFIRMATION' })
      }
      return { success: true, data: { status: 'paid', orderIds } }
    }

    // Amount/currency mismatch = tampering or a bug — refuse to confirm, leave
    // the orders PENDING for support/reconciliation. Never mark a short payment PAID.
    if (
      confirm.status === 'amount_mismatch' ||
      confirm.status === 'currency_mismatch'
    ) {
      logger.logError(
        '[POST /api/commerce/payments/verify] payment mismatch — refusing to confirm',
        new Error(confirm.reason ?? confirm.status),
        {
          requestId: event.context?.requestId,
          reference,
          expectedMinor,
          actualMinor: confirm.actualMinor,
        },
      )
      throw createError({
        statusCode: 409,
        statusMessage:
          'Payment could not be confirmed (amount mismatch). Please contact support.',
      })
    }

    // Genuine failure — fail + cancel + restore stock (else it leaks, since the
    // expiry cron only reclaims UNPAID). Abandoned/pending is left UNPAID so the
    // buyer can still complete; the cron reclaims it after 30 min.
    if (confirm.status === 'failed') {
      await Promise.all(orders.map((o) => orderRepository.failAndRestore(o.id)))
    }
    return { success: true, data: { status: confirm.status, orderIds } }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[POST /api/commerce/payments/verify]', error, { requestId: event.context?.requestId })
    const msg = error instanceof Error ? (error as Error).message : 'Payment verification failed'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
