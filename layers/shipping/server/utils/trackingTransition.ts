/**
 * Pure carrier-tracking state machine — no I/O, no DB, no carrier API.
 *
 * Given the previously-recorded status, the newest polled status, and the order's
 * current status, decide what should happen. The poller task turns this plan into
 * DB writes + notifications. Kept dependency-free so the state logic is unit-testable.
 */
import type { TrackingStatus } from './types'

/** Monotonic rank — a shipment only ever moves up this ladder. */
export const RANK: Record<TrackingStatus, number> = {
  UNKNOWN: 0,
  PRE_TRANSIT: 1,
  IN_TRANSIT: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  RETURNED: 5,
  FAILURE: 5,
}

/** Carrier statuses we stop polling on (nothing more will change). */
export const TERMINAL_STATUSES: TrackingStatus[] = ['DELIVERED', 'RETURNED', 'FAILURE']

/** Rank at/above which the parcel is physically with the carrier (→ SHIPPED). */
const POSSESSION_RANK = RANK.IN_TRANSIT

export interface TransitionPlan {
  /** The scan moved the shipment forward — persist carrierStatus. */
  changed: boolean
  /** CONFIRMED → SHIPPED (carrier now physically holds the parcel). */
  toShipped: boolean
  /** → DELIVERED (drives fund release, gated on disputes at the call site). */
  toDelivered: boolean
  /** Returned or failed delivery — hold funds, alert the seller. */
  failed: boolean
}

export function planCarrierTransition(
  prev: TrackingStatus,
  next: TrackingStatus,
  orderStatus: string,
): TransitionPlan {
  // Ignore out-of-order / duplicate scans — a shipment only moves up the ladder.
  if (RANK[next] <= RANK[prev]) {
    return { changed: false, toShipped: false, toDelivered: false, failed: false }
  }
  return {
    changed: true,
    toShipped:
      RANK[next] >= POSSESSION_RANK && next !== 'DELIVERED' && orderStatus === 'CONFIRMED',
    toDelivered: next === 'DELIVERED',
    failed: next === 'RETURNED' || next === 'FAILURE',
  }
}
