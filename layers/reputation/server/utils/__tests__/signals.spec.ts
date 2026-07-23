import { describe, it, expect } from 'vitest'
import { orderCompletedSignal, reviewSignal, disputeSignal } from '../signals'

describe('reputation signal builders', () => {
  it('orderCompletedSignal → Gold COMMERCE, idempotent on the order', () => {
    const s = orderCompletedSignal({
      sellerId: 'seller-1',
      orderId: 42,
      observedAt: '2026-07-22T00:00:00.000Z',
    })
    expect(s.signalKey).toBe('commerce.order_completed')
    expect(s.dimension).toBe('COMMERCE')
    expect(s.tier).toBe('GOLD')
    expect(s.sourceType).toBe('ESCROW_TRANSACTION')
    expect(s.sourceRef).toBe('Orders:42')
    expect(s.value).toEqual({ orderId: 42, delivered: false, place: null })
    expect(s.sellerId).toBe('seller-1')
    expect(s.observedAt).toBe('2026-07-22T00:00:00.000Z')
  })

  it('reviewSignal carries the rating, dedupes on the review id', () => {
    const s = reviewSignal({
      sellerId: 's',
      reviewId: 'rev-9',
      rating: 5,
      orderId: 7,
      observedAt: 'x',
    })
    expect(s.signalKey).toBe('commerce.review')
    expect(s.tier).toBe('GOLD')
    expect(s.sourceRef).toBe('SellerReview:rev-9')
    expect(s.value).toEqual({ rating: 5, orderId: 7 })
  })

  it('reviewSignal tolerates a missing order', () => {
    const s = reviewSignal({
      sellerId: 's',
      reviewId: 'r',
      rating: 4,
      observedAt: 'x',
    })
    expect(s.value).toEqual({ rating: 4, orderId: null })
  })

  it('disputeSignal records the outcome, dedupes on the ticket', () => {
    const s = disputeSignal({
      sellerId: 's',
      ticketId: 't-3',
      outcome: 'REFUND_BUYER',
      observedAt: 'x',
    })
    expect(s.signalKey).toBe('commerce.dispute_resolved')
    expect(s.sourceRef).toBe('SupportTicket:t-3')
    expect(s.value).toEqual({ outcome: 'REFUND_BUYER' })
  })

  it('leaves confidence unset so the writer applies the default', () => {
    const s = orderCompletedSignal({
      sellerId: 's',
      orderId: 1,
      observedAt: 'x',
    })
    expect(s.confidence).toBeUndefined()
  })
})
