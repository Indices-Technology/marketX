/**
 * Short-code generation — pure, DB-free, so it unit-tests in isolation. Used by the
 * shortlink mint service to make AssetDistribution codes.
 */

import { randomBytes } from 'node:crypto'

// URL-safe base62. 7 chars ≈ 62^7 ≈ 3.5e12 codes — collisions are vanishingly rare.
export const SHORTCODE_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/** Random URL-safe short code of `len` base62 characters. */
export function randomShortCode(len = 7): string {
  const bytes = randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++)
    out += SHORTCODE_ALPHABET[bytes[i]! % SHORTCODE_ALPHABET.length]
  return out
}

/** True if a string is a plausible short code (right length, alphabet only). */
export function isShortCode(s: string, len = 7): boolean {
  if (s.length !== len) return false
  for (const ch of s) if (!SHORTCODE_ALPHABET.includes(ch)) return false
  return true
}
