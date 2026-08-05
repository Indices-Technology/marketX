/**
 * Buyer checkout-note sanitization — the pure, side-effect-free rules that make a
 * buyer's order note safe to persist as an immutable snapshot:
 *   - trim; empty / whitespace-only → null (no note stored)
 *   - strip contact info (phones, emails, messaging handles, bank accounts) so the
 *     deal can't be pushed off-platform via the note
 *   - cap to the buyerNote DB column length
 *
 * The caller (order.service) wraps this to log a CONTACT_LEAK event when
 * `masked` is true — that logging is a DB side effect and lives outside this pure
 * function so the rules stay unit-testable.
 */
import { maskContact, scanForContact } from './contentGuard'

/** Max stored length of a buyer note — mirrors Orders.buyerNote @db.VarChar(280). */
export const BUYER_NOTE_MAX = 280

export interface SanitizedBuyerNote {
  /** Cleaned note capped to BUYER_NOTE_MAX; null for empty/whitespace-only input. */
  note: string | null
  /** True when contact info was detected and masked. */
  masked: boolean
  /** Raw matched fragments (for abuse logging — never shown to users). */
  matches: string[]
}

export function sanitizeBuyerNote(
  text: string | null | undefined,
): SanitizedBuyerNote {
  const trimmed = text?.trim()
  if (!trimmed) return { note: null, masked: false, matches: [] }
  const { clean, matches } = scanForContact(trimmed)
  const cleaned = clean ? trimmed : maskContact(trimmed)
  return { note: cleaned.slice(0, BUYER_NOTE_MAX), masked: !clean, matches }
}
