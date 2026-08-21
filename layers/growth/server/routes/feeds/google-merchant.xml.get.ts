// GET /feeds/google-merchant.xml — MarketX's Google Merchant Center product
// feed. One platform-level Merchant Center account (marketx.africa) lists
// every seller's published products; each item carries `g:external_seller_id`
// so Google attributes it to the correct seller within the multi-seller
// account, per https://support.google.com/merchants/answer/15108683.
//
// Public (no auth) — this is what Google's scheduled fetch calls directly.

const FEED_CACHE_TTL = 3600 // seconds — catalog doesn't need to be real-time; Google re-fetches on its own schedule anyway.

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function money(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = (
    (config.public.baseURL as string) || 'https://marketx.africa'
  ).replace(/\/$/, '')

  const xml = await remember(
    'feeds:google-merchant',
    FEED_CACHE_TTL,
    async () => {
      const products = await prisma.products.findMany({
        where: {
          status: 'PUBLISHED',
          // Google requires a description and an image — products missing
          // either can't produce a valid item, so exclude them at the query
          // level rather than emitting invalid entries.
          description: { not: null },
          bannerImageUrl: { not: null },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          price: true,
          discount: true,
          bannerImageUrl: true,
          isThrift: true,
          SKU: true,
          variants: { select: { stock: true } },
          seller: {
            select: {
              id: true,
              store_name: true,
              store_slug: true,
              default_currency: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      })

      const items = products
        .filter((p) => p.description && p.bannerImageUrl && p.seller)
        .map((p) => {
          const currency = p.seller!.default_currency || 'NGN'
          const effectivePrice =
            p.discount && p.discount > 0
              ? p.price * (1 - p.discount / 100)
              : p.price
          const inStock = p.variants.some((v) => v.stock > 0)
          const brand = p.seller!.store_name || p.seller!.store_slug

          const parts = [
            `    <g:id>${p.id}</g:id>`,
            `    <title>${cdata(p.title.slice(0, 150))}</title>`,
            `    <description>${cdata(p.description!.slice(0, 5000))}</description>`,
            `    <link>${escapeXml(`${baseUrl}/product/${p.slug}`)}</link>`,
            `    <g:image_link>${escapeXml(p.bannerImageUrl!)}</g:image_link>`,
            `    <g:condition>${p.isThrift ? 'used' : 'new'}</g:condition>`,
            `    <g:availability>${inStock ? 'in_stock' : 'out_of_stock'}</g:availability>`,
            `    <g:price>${money(p.price, currency)}</g:price>`,
          ]
          // Discounted price only makes sense as `sale_price` alongside the
          // full `price` above — Google rejects a `sale_price` with no `price`.
          if (p.discount && p.discount > 0) {
            parts.push(
              `    <g:sale_price>${money(effectivePrice, currency)}</g:sale_price>`,
            )
          }
          parts.push(`    <g:brand>${cdata(brand.slice(0, 70))}</g:brand>`)
          // No GTIN in the catalog — MPN is required in its place. SKU is the
          // closest stand-in; fall back to the product id so the field is never empty.
          parts.push(
            `    <g:mpn>${escapeXml((p.SKU || `MX-${p.id}`).slice(0, 70))}</g:mpn>`,
          )
          parts.push(`    <g:identifier_exists>false</g:identifier_exists>`)
          parts.push(
            `    <g:external_seller_id>${escapeXml(p.seller!.id)}</g:external_seller_id>`,
          )

          return `  <item>\n${parts.join('\n')}\n  </item>`
        })
        .join('\n')

      return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
        '<channel>',
        '  <title>MarketX Product Feed</title>',
        `  <link>${escapeXml(baseUrl)}</link>`,
        '  <description>Products from MarketX sellers (marketx.africa)</description>',
        items,
        '</channel>',
        '</rss>',
      ].join('\n')
    },
  )

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', `public, max-age=${FEED_CACHE_TTL}`)
  return xml
})
