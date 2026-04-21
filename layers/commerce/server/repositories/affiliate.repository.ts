export const affiliateRepository = {
  async getProfile(userId: string) {
    return prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, username: true, affiliateCode: true },
    })
  },

  async findByCode(code: string) {
    return prisma.profile.findUnique({
      where: { affiliateCode: code },
      select: { id: true },
    })
  },

  async setAffiliateCode(userId: string, code: string) {
    return prisma.profile.update({
      where: { id: userId },
      data: { affiliateCode: code },
      select: { affiliateCode: true },
    })
  },

  async getEarnings(userId: string) {
    const [released, pending] = await Promise.all([
      prisma.orders.aggregate({
        where: { affiliateUserId: userId, status: 'DELIVERED' },
        _sum: { affiliateCut: true },
        _count: { id: true },
      }),
      prisma.orders.aggregate({
        where: {
          affiliateUserId: userId,
          status: { notIn: ['DELIVERED', 'CANCELLED', 'CANCELED', 'RETURNED'] },
        },
        _sum: { affiliateCut: true },
      }),
    ])
    return { released, pending }
  },

  async getReferrals(userId: string, limit: number, offset: number) {
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where: { affiliateUserId: userId },
        select: {
          id: true,
          created_at: true,
          affiliateCut: true,
          status: true,
          orderItem: {
            take: 3,
            select: {
              variant: {
                select: {
                  product: { select: { title: true, slug: true } },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.orders.count({ where: { affiliateUserId: userId } }),
    ])
    return { orders, total }
  },

  async getPromoters(sellerIds: string[]) {
    if (!sellerIds.length) return []
    return prisma.orders.findMany({
      where: {
        affiliateUserId: { not: null },
        status: { notIn: ['CANCELLED', 'CANCELED', 'RETURNED'] },
        orderItem: {
          some: {
            variant: { product: { sellerId: { in: sellerIds } } },
          },
        },
      },
      select: {
        affiliateUserId: true,
        affiliateCut: true,
        affiliate: {
          select: { id: true, username: true, avatar: true },
        },
      },
    })
  },
}
