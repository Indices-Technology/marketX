/**
 * GET /robots.txt
 *
 * Generated rather than a static public/ file so the Sitemap line follows the
 * deployed host. The file this replaced advertised `https://styli.app/sitemap.xml`
 * — a domain this app no longer uses, pointing at a sitemap that did not exist.
 *
 * Crawl policy: everything public is open. Disallowed paths are only those that
 * are account-scoped, transactional, or not content — crawling them wastes
 * budget that should go to products and stores.
 *
 * Note `/_nuxt/` is deliberately NOT blocked: Google renders pages with their
 * JS and CSS, and blocking the bundle makes every page look empty.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const origin = (
    (config.public.baseURL as string) || 'https://marketx.africa'
  ).replace(/\/+$/, '')

  const disallow = [
    // Account-scoped surfaces
    '/buyer/',
    '/seller/',
    '/sellers/create',
    '/settings',
    '/messages/',
    '/support/',
    '/admin/',
    '/store/card',
    // Transactional — nothing here should ever be an entry point
    '/checkout',
    '/success',
    // Auth screens (also noindex; listed so they are not even fetched)
    '/user-login',
    '/user-register',
    '/phone-login',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/resend-verification',
    '/oauth/',
    // Not content: short-link redirects, the PWA offline shell.
    //
    // /embed/ is deliberately absent: it duplicates product content and must
    // not be indexed, but a Disallow would stop crawlers ever FETCHING it —
    // and a page they never fetch is a page whose noindex they never read.
    // It is allowed here and blocked by an X-Robots-Tag header instead
    // (routeRules in nuxt.config).
    '/r/',
    '/growth/',
    '/offline',
    // API surface, including the OpenAPI docs
    '/api/',
  ]

  const body = [
    'User-agent: *',
    'Allow: /',
    ...disallow.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return body
})
