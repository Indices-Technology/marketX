/**
 * Order status presentation — labels, progress steps, and what the buyer is
 * allowed to do next.
 *
 * Shared because READY_FOR_PICKUP was added to the schema and the seller UI
 * without any buyer surface learning about it: the buyer's order page fell
 * back to step 0 ("Pending") for an order the seller had already marked ready,
 * and the "Confirm receipt" button — hardcoded to SHIPPED — never appeared, so
 * a pickup order had no buyer-side completion at all. One map here means the
 * next status added shows up everywhere or nowhere, not half-way.
 */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  READY_FOR_PICKUP: 'Ready for pickup',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
  PROCESSING: 'Processing',
}

/** Human label for a raw status enum — falls back to the raw value. */
export const orderStatusLabel = (status?: string | null): string =>
  (status && ORDER_STATUS_LABELS[status]) || status || ''

/**
 * A pickup order never ships (nothing is carried anywhere) and ends in
 * collection, so its third and fourth steps read differently even though the
 * underlying statuses are READY_FOR_PICKUP → DELIVERED.
 */
const DELIVERY_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'] as const
const PICKUP_STEPS = ['Pending', 'Confirmed', 'Ready', 'Collected'] as const

export const orderSteps = (isPickup?: boolean | null): readonly string[] =>
  isPickup ? PICKUP_STEPS : DELIVERY_STEPS

/** SHIPPED and READY_FOR_PICKUP are the same rung of the ladder. */
const STEP_INDEX: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  READY_FOR_PICKUP: 2,
  DELIVERED: 3,
}

export const orderStepIndex = (status?: string | null): number =>
  STEP_INDEX[status ?? ''] ?? 0

/**
 * Statuses from which the buyer may confirm receipt themselves (releasing
 * funds early). Narrower than what confirm-receipt.post.ts accepts — the
 * endpoint also tolerates CONFIRMED for sellers who skip a step, but we don't
 * advertise a "confirm receipt" button on an order that hasn't left the
 * seller's hands.
 */
export const canConfirmReceipt = (status?: string | null): boolean =>
  status === 'SHIPPED' || status === 'READY_FOR_PICKUP'

/** Button/confirmation wording differs for collection vs delivery. */
export const confirmReceiptLabel = (isPickup?: boolean | null): string =>
  isPickup ? "I've collected this order" : 'Confirm receipt'

export const confirmReceiptPrompt = (isPickup?: boolean | null): string =>
  isPickup
    ? 'Confirm you have collected this order? This releases payment to the seller.'
    : 'Confirm you have received this order? This releases payment to the seller.'
