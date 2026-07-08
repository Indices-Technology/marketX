// POST /api/commerce/payments/verify
// Called by the client after Paystack redirect to confirm payment.
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { emailQueue } from '~~/server/queues/email.queue'
import { orderRepository } from '../../../repositories/order.repository'
import { cartRepository } from '../../../repositories/cart.repository'
import { paymentService } from '~~/layers/payments/server/services/payment.service'
import { paymentConfirmationService } from '../../../services/paymentConfirmation.service'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'

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
      // Overpayment is tolerated by the money-gate but should never pass silently.
      if (confirm.actualMinor > expectedMinor) {
        logger.warn('[verify] buyer overpaid — collected exceeds owed', {
          reference,
          expectedMinor,
          actualMinor: confirm.actualMinor,
        })
      }
      // Per order: the shared service does the atomic flip — only the first caller
      // (vs the webhook or the reconciliation cron) runs the money side effects.
      const buyerName = user.username || user.email || 'a customer'
      for (const o of orders) {
        await paymentConfirmationService.confirmPaidCardOrder(o.id, {
          sellerMessage: `New order #${o.id} received from ${buyerName}`,
        })
      }
      // Payment confirmed → now it's safe to empty the cart (idempotent).
      await cartRepository.clearCart(user.id).catch(() => {})

      // One buyer confirmation email for the purchase
      if (user.email && !user.email.includes('@checkout.marketx.')) {
        const { subject, html, text } = buildOrderStatusEmail(orderIds[0]!, 'CONFIRMED')
        emailQueue.enqueue(
          { to: user.email, subject, html, text, type: 'ORDER_CONFIRMATION' },
          { dedupeKey: `order-confirm:${reference}` },
        )
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
