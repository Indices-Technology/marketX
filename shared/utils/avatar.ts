/**
 * Local, deterministic initials avatar as an inline SVG data URI.
 *
 * No network call, no external service, no CSP surface — it always renders.
 * Use it as the fallback whenever a user/store has no uploaded avatar, instead
 * of hitting dicebear/liara (which could be blocked, slow, or down).
 */

const PALETTE = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80',
  '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#e879f9',
]

const escapeXml = (s: string): string =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  )

export function initialsAvatar(seed?: string | null): string {
  const name = (seed ?? '').trim()
  const initials =
    escapeXml(
      name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] ?? '')
        .join('')
        .toUpperCase(),
    ) || '?'

  const hash = name
    ? name.split('').reduce((acc, ch) => ch.charCodeAt(0) + ((acc << 5) - acc), 0)
    : 0
  const bg = PALETTE[Math.abs(hash) % PALETTE.length]

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" fill="${bg}"/>` +
    `<text x="48" y="48" dy=".35em" text-anchor="middle" fill="#ffffff" ` +
    `font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" ` +
    `font-size="40" font-weight="600">${initials}</text></svg>`

  // encodeURIComponent (not base64) keeps this SSR-safe — no `btoa` on the server.
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
