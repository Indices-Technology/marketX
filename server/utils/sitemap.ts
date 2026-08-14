/**
 * Sitemap generation — shared shape for /sitemap.xml and /sitemap/:file.
 *
 * Everything is generated from the database at request time (cached), not
 * written to disk: the catalogue changes hourly, and a build-time file would be
 * stale the moment it deployed.
 *
 * Paging: the sitemap spec caps a single file at 50,000 URLs / 50 MB. We chunk
 * far below that (PAGE_SIZE) so each response stays a small, fast query rather
 * than a single request that has to serialise the whole catalogue.
 */

/** URLs per sitemap file. Well under the 50k spec limit — see above. */
export const SITEMAP_PAGE_SIZE = 5000

export type SitemapEntry = {
  loc: string
  lastmod?: Date | string | null
  changefreq?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority?: number
}

/**
 * Origin for absolute sitemap URLs. Sitemaps MUST be absolute and must match
 * the host they are served from, so this reads the deployed base URL rather
 * than the brand constant (staging and production differ).
 */
export const siteOrigin = (): string => {
  const config = useRuntimeConfig()
  const base = (config.public.baseURL as string) || 'https://marketx.africa'
  return base.replace(/\/+$/, '')
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const toW3CDate = (value: Date | string | null | undefined): string | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const renderUrlset = (entries: SitemapEntry[]): string => {
  const urls = entries
    .map((entry) => {
      const lastmod = toW3CDate(entry.lastmod)
      return [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        entry.changefreq
          ? `    <changefreq>${entry.changefreq}</changefreq>`
          : null,
        entry.priority != null
          ? `    <priority>${entry.priority.toFixed(1)}</priority>`
          : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export const renderSitemapIndex = (
  entries: Array<{ loc: string; lastmod?: Date | string | null }>,
): string => {
  const sitemaps = entries
    .map((entry) => {
      const lastmod = toW3CDate(entry.lastmod)
      return [
        '  <sitemap>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        '  </sitemap>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`
}

/**
 * Public routes with no database backing. Kept here so /sitemap.xml and the
 * static child never disagree about what counts as a landing page.
 *
 * Excluded on purpose: anything behind auth (checkout, dashboards, messages,
 * support), the auth screens themselves, /offline, /embed/* and /r/* — none of
 * them are content, and several are noindex.
 */
export const STATIC_ROUTES: SitemapEntry[] = [
  { loc: '/', changefreq: 'hourly', priority: 1.0 },
  { loc: '/discover', changefreq: 'hourly', priority: 0.9 },
  { loc: '/map', changefreq: 'daily', priority: 0.8 },
  { loc: '/sellers', changefreq: 'daily', priority: 0.8 },
  { loc: '/squares', changefreq: 'daily', priority: 0.8 },
  { loc: '/reels', changefreq: 'hourly', priority: 0.7 },
  // Not /thrift or /market — both 301 elsewhere, and a sitemap should list
  // destinations, not redirects.
  { loc: '/deals', changefreq: 'daily', priority: 0.7 },
  { loc: '/fresh-drops', changefreq: 'daily', priority: 0.7 },
  { loc: '/pre-loved', changefreq: 'daily', priority: 0.7 },
  { loc: '/verify', changefreq: 'weekly', priority: 0.8 },
  { loc: '/trust/how-it-works', changefreq: 'monthly', priority: 0.6 },
  { loc: '/about', changefreq: 'monthly', priority: 0.5 },
  { loc: '/help', changefreq: 'monthly', priority: 0.5 },
  { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { loc: '/terms', changefreq: 'yearly', priority: 0.3 },
]

/** A sitemap section — how to count its rows and how to render one page. */
type Section = {
  count: () => Promise<number>
  page: (skip: number, take: number) => Promise<SitemapEntry[]>
}

export const SITEMAP_SECTIONS: Record<string, Section> = {
  products: {
    count: () => prisma.products.count({ where: { status: 'PUBLISHED' } }),
    page: async (skip, take) => {
      const rows = await prisma.products.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updated_at: true },
        orderBy: { id: 'asc' },
        skip,
        take,
      })
      return rows.map((r) => ({
        loc: `/product/${r.slug}`,
        lastmod: r.updated_at,
        changefreq: 'daily' as const,
        priority: 0.8,
      }))
    },
  },

  // Only stores that have something to show. A slug with no published product
  // is a thin page that spends crawl budget and earns nothing.
  stores: {
    count: () =>
      prisma.sellerProfile.count({
        where: { products: { some: { status: 'PUBLISHED' } } },
      }),
    page: async (skip, take) => {
      const rows = await prisma.sellerProfile.findMany({
        where: { products: { some: { status: 'PUBLISHED' } } },
        select: { store_slug: true, updated_at: true },
        orderBy: { store_slug: 'asc' },
        skip,
        take,
      })
      // The vanity URL, not /sellers/profile/{slug} — it is the form sellers
      // hand out (Trust Card, QR, WhatsApp) and therefore the one that earns
      // links, so it is also what the page declares as canonical.
      return rows.map((r) => ({
        loc: `/${r.store_slug}`,
        lastmod: r.updated_at,
        changefreq: 'daily' as const,
        priority: 0.9,
      }))
    },
  },

  categories: {
    count: () => prisma.category.count(),
    page: async (skip, take) => {
      const rows = await prisma.category.findMany({
        select: { slug: true, updated_at: true },
        orderBy: { id: 'asc' },
        skip,
        take,
      })
      return rows.map((r) => ({
        loc: `/category/${r.slug}`,
        lastmod: r.updated_at,
        changefreq: 'daily' as const,
        priority: 0.7,
      }))
    },
  },

  squares: {
    count: () => prisma.square.count({ where: { status: 'ACTIVE' } }),
    page: async (skip, take) => {
      const rows = await prisma.square.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updated_at: true },
        orderBy: { slug: 'asc' },
        skip,
        take,
      })
      return rows.map((r) => ({
        loc: `/squares/${r.slug}`,
        lastmod: r.updated_at,
        changefreq: 'weekly' as const,
        priority: 0.7,
      }))
    },
  },
}
