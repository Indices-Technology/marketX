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
}
