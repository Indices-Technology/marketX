/**
 * Support layer — shared types, state machine, and derivation helpers.
 * See docs/SUPPORT.md.
 */

export type SupportStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING_USER'
  | 'RESOLVED'
  | 'CLOSED'

export type SupportCategory =
  | 'ORDER'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'ACCOUNT'
  | 'SELLER'
  | 'PRODUCT'
  | 'REFUND'
  | 'OTHER'

export type SupportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type SupportTicketType = 'SUPPORT' | 'DISPUTE'
export type SupportSource = 'WEB' | 'EMAIL' | 'CHECKOUT' | 'ORDER'
export type SupportAuthorRole = 'REQUESTER' | 'SELLER' | 'AGENT' | 'SYSTEM'
export type DisputeOutcome =
  | 'REFUND_BUYER'
  | 'RELEASE_SELLER'
  | 'PARTIAL_REFUND'
  | 'REJECTED'

/** Allowed status transitions — no handler may jump states. */
export const SUPPORT_TRANSITIONS: Record<SupportStatus, SupportStatus[]> = {
  OPEN: ['IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['PENDING_USER', 'RESOLVED', 'CLOSED'],
  PENDING_USER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'], // reply within the reopen window bumps back
  CLOSED: [], // terminal
}

export function canTransition(from: SupportStatus, to: SupportStatus): boolean {
  if (from === to) return true
  return SUPPORT_TRANSITIONS[from]?.includes(to) ?? false
}

/** A status the requester/seller can still act on. */
export function isOpenStatus(s: SupportStatus): boolean {
  return s !== 'RESOLVED' && s !== 'CLOSED'
}

/** Category → default priority. Money problems jump the queue. */
export function categoryToPriority(category: SupportCategory): SupportPriority {
  switch (category) {
    case 'PAYMENT':
    case 'REFUND':
      return 'HIGH'
    case 'ORDER':
    case 'DELIVERY':
      return 'NORMAL'
    default:
      return 'NORMAL'
  }
}

/** Human-facing reference, e.g. MX-1042. */
export function ticketRef(ticketNumber: number): string {
  return `MX-${ticketNumber}`
}

/** Max simultaneously-open tickets per requester (spam guard). */
export const MAX_OPEN_TICKETS = 5
