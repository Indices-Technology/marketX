/**
 * GET /sitemap/:file — one page of one sitemap section.
 *
 * `file` is the whole path segment (`products.xml`, `products-2.xml`,
 * `static.xml`) and is parsed here rather than split into route params: a
 * mid-segment route param (`/sitemap-[section].xml`) is not portable across
 * Nitro's router versions, and the section list is validated below anyway.
 *
 * Linked from the sitemap index at /sitemap.xml.
 */
import {
  SITEMAP_PAGE_SIZE,
  SITEMAP_SECTIONS,
  STATIC_ROUTES,
  renderUrlset,
  siteOrigin,
} from '~~/server/utils/sitemap'

/** `products-2.xml` → { section: 'products', page: 2 }; page 1 has no suffix. */
const parseFile = (file: string): { section: string; page: number } | null => {
  const match = /^([a-z]+)(?:-(\d+))?\.xml$/.exec(file)
  if (!match) return null
  const page = match[2] ? Number(match[2]) : 1
  if (!Number.isFinite(page) || page < 1) return null
  return { section: match[1]!, page }
}

export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, 'file') ?? ''
  const parsed = parseFile(file)
  if (!parsed)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const { section, page } = parsed
  const origin = siteOrigin()
  const absolute = (loc: string) => `${origin}${loc}`

  if (section === 'static') {
    if (page !== 1) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=86400')
    return renderUrlset(
      STATIC_ROUTES.map((e) => ({ ...e, loc: absolute(e.loc) })),
    )
  }

  const definition = SITEMAP_SECTIONS[section]
  if (!definition) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  // See the index route for why the cache key carries the host.
  const cacheKey = `sitemap:${new URL(origin).host}:${section}:${page}`
  const xml = await remember(cacheKey, 3600, async () => {
    const entries = await definition.page(
      (page - 1) * SITEMAP_PAGE_SIZE,
      SITEMAP_PAGE_SIZE,
    )
    // Past the last page. The index never links these, but a stale crawler
    // reference should get a 404 rather than a valid-looking empty sitemap —
    // Search Console reports a zero-URL file as an error against the whole set.
    if (entries.length === 0 && page > 1) return null
    return renderUrlset(entries.map((e) => ({ ...e, loc: absolute(e.loc) })))
  })
  if (!xml) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return xml
})
