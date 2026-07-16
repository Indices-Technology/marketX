/**
 * Signed shipping-quote tokens. `/api/shipping/rates` signs each rate's
 * (storeSlug, amountMinor) with a server secret; the client echoes the chosen
 * token back at checkout, and the order re-derives the shipping charge from the
 * verified token instead of trusting the client-sent amount. Stateless — no DB.
 *
 * A token is only ever a shipping AMOUNT for a STORE with a short expiry, so
 * replay within the TTL is harmless (it's the correct amount for that seller).
 */

import jwt from 'jsonwebtoken'

export interface ShippingQuoteClaims {
  /** store_slug the quote is for */
  s: string
  /** amount in minor units (kobo) — what the buyer is charged online */
  a: number
  /** carrier id (informational) */
  c?: string
  /** cash-on-delivery self-shipping fee (kobo) the buyer pays the rider on
   *  arrival — signed so the order records the real amount, not a client value.
   *  Present only for the pay-the-rider option; the platform never collects it. */
  d?: number
}

function secret(): string {
  return process.env.SHIPPING_QUOTE_SECRET || process.env.JWT_SECRET || ''
}

/** Sign a quote. Returns '' when no secret is configured (caller falls back). */
export function signShippingQuote(claims: ShippingQuoteClaims): string {
  const key = secret()
  if (!key) return ''
  return jwt.sign(claims, key, { expiresIn: '45m' })
}

/** Verify a quote token. Returns the claims, or null if invalid/expired/absent. */
export function verifyShippingQuote(
  token: string | undefined | null,
): ShippingQuoteClaims | null {
  const key = secret()
  if (!key || !token) return null
  try {
    const decoded = jwt.verify(token, key) as ShippingQuoteClaims
    if (typeof decoded?.s !== 'string' || typeof decoded?.a !== 'number')
      return null
    return decoded
  } catch {
    return null
  }
}
