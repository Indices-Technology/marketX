/**
 * GET /sitemap.xml — the sitemap index.
 *
 * Lists one child per section per page rather than inlining every URL, so the
 * catalogue can grow past the 50,000-URL / 50 MB per-file limit without this
 * route ever changing shape. Children live at /sitemap/:file (see
 * server/routes/sitemap/[file].get.ts).
 *
 * Advertised to crawlers by /robots.txt.
 */
import {
  SITEMAP_PAGE_SIZE,
  SITEMAP_SECTIONS,
  renderSitemapIndex,
  siteOrigin,
} from '~~/server/utils/sitemap'

export default defineEventHandler(async (event) => {
  const origin = siteOrigin()
  // Keyed by host: staging and production can share one Redis, and the cached
  // body has absolute URLs baked in — a shared key would serve one env's
  // sitemap on the other's domain.
  const cacheKey = `sitemap:index:${new URL(origin).host}`

  const xml = await remember(cacheKey, 3600, async () => {
    const children: Array<{ loc: string }> = [
      { loc: `${origin}/sitemap/static.xml` },
    ]

    for (const [name, section] of Object.entries(SITEMAP_SECTIONS)) {
      const total = await section.count()
      // An empty section is omitted rather than listed as an empty file —
      // Search Console reports a zero-URL child as an error.
      if (total === 0) continue

      const pages = Math.ceil(total / SITEMAP_PAGE_SIZE)
      for (let page = 1; page <= pages; page++) {
        children.push({
          // Page 1 keeps the bare name so the common single-page case reads
          // as /sitemap/products.xml rather than /sitemap/products-1.xml.
          loc: `${origin}/sitemap/${page === 1 ? name : `${name}-${page}`}.xml`,
        })
      }
    }

    return renderSitemapIndex(children)
  })

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return xml
})
