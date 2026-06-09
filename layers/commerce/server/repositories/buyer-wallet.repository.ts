export const buyerWalletRepository = {
  async getOrCreate(profileId: string) {
    const existing = await prisma.buyerWallet.findUnique({
      where: { profileId },
    })
    if (existing) return existing
    return prisma.buyerWallet.create({ data: { profileId, balance: 0 } })
  },

  async incrementBalance(walletId: string, amount: number) {
    return prisma.buyerWallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } },
    })
  },

  async decrementBalance(walletId: string, amount: number) {
    return prisma.buyerWallet.update({
      where: { id: walletId },
      data: { balance: { decrement: amount } },
    })
  },

  async createTransaction(
    walletId: string,
    data: {
      amount: number
      type: string
      description: string
      orderId?: number
    },
  ) {
    return prisma.buyerTransaction.create({ data: { walletId, ...data } })
  },

  async getTransactions(walletId: string, limit: number, offset: number) {
    return prisma.buyerTransaction.findMany({
      where: { walletId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    })
  },

  async countTransactions(walletId: string) {
    return prisma.buyerTransaction.count({ where: { walletId } })
  },

  async getStats(walletId: string) {
    const [credits, debits] = await Promise.all([
      prisma.buyerTransaction.aggregate({
        where: {
          walletId,
          type: { in: ['AFFILIATE_CREDIT', 'CREDIT', 'REFUND'] },
        },
        _sum: { amount: true },
      }),
      prisma.buyerTransaction.aggregate({
        where: { walletId, type: 'DEBIT' },
        _sum: { amount: true },
      }),
    ])
    return {
      totalEarned: credits._sum.amount ?? 0,
      totalSpent: debits._sum.amount ?? 0,
    }
  },

  async findExistingCredit(walletId: string, orderId: number, type: string) {
    return prisma.buyerTransaction.findFirst({
      where: { walletId, orderId, type },
    })
  },
}
