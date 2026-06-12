/**
 * URL scheme safety — defends against `javascript:` / `data:` / `vbscript:`
 * payloads in user-supplied URLs (stored XSS via href bindings).
 *
 * Zod's `.url()` only checks that the string parses as a URL — it ACCEPTS
 * `javascript:alert(1)` because that is a syntactically valid URL. These
 * helpers enforce an http(s)-only allowlist instead.
 *
 * Two layers of use:
 *  - `httpUrlSchema` / `safeHttpUrl()` — input validation in Zod schemas
 *  - `safeExternalUrl()`              — render-time guard on :href bindings
 *    (defense-in-depth; also neutralizes any rows persisted before validation
 *     was tightened)
 */

const SAFE_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:']

/**
 * Returns true when the URL uses an allowlisted, non-script scheme.
 * Relative URLs (no scheme) are treated as safe — they stay on-origin.
 */
export function isSafeUrl(value: string | null | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false

  // Relative URL (in-app link) — safe, no scheme to abuse
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true

  try {
    const parsed = new URL(trimmed)
    return SAFE_SCHEMES.includes(parsed.protocol)
  } catch {
    // Not an absolute URL and not a clean relative path — reject
    return false
  }
}

/**
 * Render-time guard for `:href` bindings sourced from user content.
 * Returns the URL when safe, otherwise `undefined` so the anchor has no href
 * (and cannot execute a script payload).
 */
export function safeExternalUrl(
  value: string | null | undefined,
): string | undefined {
  return isSafeUrl(value) ? value!.trim() : undefined
}

/**
 * Zod refinement for http(s)-only URL inputs. Use INSTEAD of `.url()` on any
 * user-supplied URL that will later be rendered as a link.
 *
 *   store_website: httpUrlSchema().optional()
 */
export function safeHttpUrl(value: string): boolean {
  const trimmed = value.trim()
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
