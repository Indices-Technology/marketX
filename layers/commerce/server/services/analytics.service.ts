function startOfToday(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export const analyticsService = {
  async trackView(productId: number) {
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { store_slug: true },
    })
    if (!product) return
    const date = startOfToday()
    await prisma.productAnalytics.upsert({
      where: { productId_date: { productId, date } },
      update: { views: { increment: 1 } },
      create: { productId, storeSlug: product.store_slug, date, views: 1 },
    })
  },

  async trackImpressions(productIds: number[]) {
    if (!productIds.length) return
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, store_slug: true },
    })
    const date = startOfToday()
    await Promise.all(
      products.map((p) =>
        prisma.productAnalytics.upsert({
          where: { productId_date: { productId: p.id, date } },
          update: { impressions: { increment: 1 } },
          create: { productId: p.id, storeSlug: p.store_slug, date, impressions: 1 },
        }),
      ),
    )
  },

  async trackSale(
    productId: number,
    storeSlug: string,
    quantity: number,
    revenue: number,
    affiliatePaid: number,
  ) {
    const date = startOfToday()
    await prisma.productAnalytics.upsert({
      where: { productId_date: { productId, date } },
      update: {
        orders: { increment: 1 },
        unitsSold: { increment: quantity },
        revenue: { increment: revenue },
        affiliatePaid: { increment: affiliatePaid },
      },
      create: { productId, storeSlug, date, orders: 1, unitsSold: quantity, revenue, affiliatePaid },
    })
  },

  async getStoreAnalytics(storeSlug: string, days: number) {
    const from = new Date()
    from.setUTCDate(from.getUTCDate() - days + 1)
    from.setUTCHours(0, 0, 0, 0)

    const rows = await prisma.productAnalytics.findMany({
      where: { storeSlug, date: { gte: from } },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            media: {
              take: 1,
              where: { isBgMusic: false },
              select: { url: true },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    })

    // Summary totals
    const summary = rows.reduce(
      (acc, r) => {
        acc.revenue += r.revenue
        acc.affiliatePaid += r.affiliatePaid
        acc.orders += r.orders
        acc.unitsSold += r.unitsSold
        acc.views += r.views
        acc.impressions += r.impressions
        return acc
      },
      { revenue: 0, affiliatePaid: 0, orders: 0, unitsSold: 0, views: 0, impressions: 0 },
    )

    // Time-series chart: group by date
    type DaySlot = {
      date: string
      revenue: number
      affiliatePaid: number
      orders: number
      unitsSold: number
      views: number
      impressions: number
    }
    const dateMap = new Map<string, DaySlot>()

    // Pre-fill every day in range so chart has no gaps
    for (let i = 0; i < days; i++) {
      const d = new Date(from)
      d.setUTCDate(d.getUTCDate() + i)
      const key = d.toISOString().slice(0, 10)
      dateMap.set(key, { date: key, revenue: 0, affiliatePaid: 0, orders: 0, unitsSold: 0, views: 0, impressions: 0 })
    }
    for (const r of rows) {
      const key = new Date(r.date).toISOString().slice(0, 10)
      const slot = dateMap.get(key)
      if (slot) {
        slot.revenue += r.revenue
        slot.affiliatePaid += r.affiliatePaid
        slot.orders += r.orders
        slot.unitsSold += r.unitsSold
        slot.views += r.views
        slot.impressions += r.impressions
      }
    }
    const chart = Array.from(dateMap.values())

    // Per-product aggregates for top products table
    const productMap = new Map<
      number,
      {
        productId: number
        title: string
        slug: string
        thumbnail: string | null
        revenue: number
        affiliatePaid: number
        orders: number
        unitsSold: number
        views: number
        impressions: number
      }
    >()
    for (const r of rows) {
      const pid = r.productId
      const existing = productMap.get(pid)
      if (existing) {
        existing.revenue += r.revenue
        existing.affiliatePaid += r.affiliatePaid
        existing.orders += r.orders
        existing.unitsSold += r.unitsSold
        existing.views += r.views
        existing.impressions += r.impressions
      } else {
        productMap.set(pid, {
          productId: pid,
          title: r.product.title,
          slug: r.product.slug,
          thumbnail: r.product.media[0]?.url ?? null,
          revenue: r.revenue,
          affiliatePaid: r.affiliatePaid,
          orders: r.orders,
          unitsSold: r.unitsSold,
          views: r.views,
          impressions: r.impressions,
        })
      }
    }
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

    return { summary, chart, topProducts }
  },
}
