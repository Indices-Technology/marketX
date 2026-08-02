/**
 * Phone number normalisation — one source of truth for client forms and server
 * schemas. MarketX is Nigeria-first, so a plain local number (0803…, or 803…)
 * is accepted and normalised to E.164 (+234…). International numbers are also
 * accepted as long as they carry their own country code (+ or 00 prefix), so a
 * seller abroad isn't forced into a Nigerian code.
 *
 * The goal is patience-free entry: the user types the number the way they know
 * it, and we do the formatting. Only genuinely un-parseable input is rejected.
 */

/** Default country calling code when the input has no international prefix. */
const DEFAULT_CALLING_CODE = '234' // Nigeria

/** Human-facing message for an unparseable number. */
export const PHONE_ERROR =
  'Enter a valid phone number, e.g. 08012345678 or +2348012345678'

/** E.164: a leading +, a non-zero country digit, then up to 14 more digits. */
const E164_RE = /^\+[1-9]\d{6,14}$/

/**
 * Normalise a raw phone string to E.164 (`+234…`), or return null if it can't
 * be understood. Empty/whitespace input returns '' — callers treat phone as
 * optional and decide whether a value is required.
 *
 * @param raw            what the user typed
 * @param defaultCode    calling code assumed when no + / 00 prefix is present
 */
export function normalizePhone(
  raw: string | null | undefined,
  defaultCode: string = DEFAULT_CALLING_CODE,
): string | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return ''

  // Strip everything that isn't a digit or a leading +.
  const hasPlus = trimmed.startsWith('+')
  let digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  let e164: string
  if (hasPlus) {
    // Already international: keep the country code as given.
    e164 = `+${digits}`
  } else if (digits.startsWith('00')) {
    // 00 is the international dialling prefix → treat rest as +<code>…
    e164 = `+${digits.slice(2)}`
  } else if (digits.startsWith(defaultCode)) {
    // Local user typed the country code without the + (e.g. 2348012345678).
    e164 = `+${digits}`
  } else if (digits.startsWith('0')) {
    // National trunk format (e.g. 08012345678) → drop the 0, add the code.
    e164 = `+${defaultCode}${digits.slice(1)}`
  } else {
    // Bare subscriber number (e.g. 8012345678) → assume the default country.
    e164 = `+${defaultCode}${digits}`
  }

  return E164_RE.test(e164) ? e164 : null
}

/**
 * Validate a phone field for a form. Returns an error message, or null when the
 * value is acceptable (including empty, since phone is optional everywhere it's
 * used). Use `normalizePhone` to get the value to actually submit/store.
 */
export function validatePhone(
  raw: string | null | undefined,
  defaultCode: string = DEFAULT_CALLING_CODE,
): string | null {
  const normalized = normalizePhone(raw, defaultCode)
  if (normalized === '') return null // empty is allowed
  return normalized == null ? PHONE_ERROR : null
}
