import type {
  ModerationStatus,
  ReportStatus,
  ContentType,
  ModerationAction,
  ReportReason,
} from '@prisma/client'

const REPORT_SELECT = {
  id: true,
  contentType: true,
  contentId: true,
  reason: true,
  note: true,
  status: true,
  moderatorNote: true,
  action: true,
  createdAt: true,
  resolvedAt: true,
  reporter: { select: { id: true, username: true, avatar: true } },
  moderator: { select: { id: true, username: true } },
} as const

export const adminRepository = {
  // ── Reports ──────────────────────────────────────────────────────────────

  listReports(opts: {
    status?: ReportStatus
    contentType?: ContentType
    limit: number
    offset: number
  }) {
    const where = {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.contentType ? { contentType: opts.contentType } : {}),
    }
    return prisma.report.findMany({
      where,
      select: REPORT_SELECT,
      orderBy: { createdAt: 'desc' },
      take: opts.limit + 1,
      skip: opts.offset,
    })
  },

  getReport(id: string) {
    return prisma.report.findUnique({ where: { id }, select: REPORT_SELECT })
  },

  resolveReport(
    id: string,
    moderatorId: string,
    action: ModerationAction,
    note?: string,
  ) {
    return prisma.report.update({
      where: { id },
      data: {
        status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
        moderatorId,
        action,
        moderatorNote: note ?? null,
        resolvedAt: new Date(),
      },
      select: REPORT_SELECT,
    })
  },

  countReportsByContent(contentType: ContentType, contentId: string) {
    return prisma.report.count({ where: { contentType, contentId } })
  },

  // Check if a user already filed a report for this exact content
  findExistingReport(reporterId: string, contentType: ContentType, contentId: string) {
    return prisma.report.findFirst({
      where: { reporterId, contentType, contentId },
      select: { id: true },
    })
  },

  createReport(data: {
    reporterId: string
    contentType: ContentType
    contentId: string
    reason: ReportReason
    note?: string
  }) {
    return prisma.report.create({ data, select: REPORT_SELECT })
  },

  // ── Content moderation ───────────────────────────────────────────────────

  moderatePost(id: string, status: ModerationStatus) {
    return prisma.post.update({
      where: { id },
      data: { moderationStatus: status },
      select: { id: true, moderationStatus: true },
    })
  },

  moderateProduct(id: number, status: ModerationStatus) {
    return prisma.products.update({
      where: { id },
      data: { moderationStatus: status },
      select: { id: true, moderationStatus: true },
    })
  },

  moderateComment(id: string, status: ModerationStatus) {
    return prisma.comment.update({
      where: { id },
      data: { moderationStatus: status },
      select: { id: true, moderationStatus: true },
    })
  },

  // ── User moderation ──────────────────────────────────────────────────────

  suspendUser(userId: string, moderatorId: string, reason: string, expiresAt: Date | null) {
    return prisma.$transaction([
      prisma.userSuspension.create({
        data: { userId, moderatorId, reason, expiresAt },
      }),
      prisma.profile.update({
        where: { id: userId },
        data: {
          suspendedUntil: expiresAt,
          ...(expiresAt === null ? { bannedAt: new Date() } : {}),
        },
      }),
    ])
  },

  liftSuspension(userId: string, liftedById: string) {
    return prisma.$transaction([
      prisma.userSuspension.updateMany({
        where: { userId, liftedAt: null },
        data: { liftedAt: new Date(), liftedById },
      }),
      prisma.profile.update({
        where: { id: userId },
        data: { suspendedUntil: null, bannedAt: null },
      }),
    ])
  },

  addStrike(userId: string) {
    return prisma.profile.update({
      where: { id: userId },
      data: { strikeCount: { increment: 1 } },
      select: { id: true, strikeCount: true },
    })
  },

  // ── User/Seller lists ────────────────────────────────────────────────────

  listUsers(opts: {
    search?: string
    status?: 'banned' | 'suspended'
    limit: number
    offset: number
  }) {
    const where: any = {}
    if (opts.search) {
      where.OR = [
        { email: { contains: opts.search, mode: 'insensitive' as const } },
        { username: { contains: opts.search, mode: 'insensitive' as const } },
      ]
    }
    // Status filters run in the DB (not on the loaded page) so the dashboard's
    // "Banned users" link and paging return correct results.
    if (opts.status === 'banned') where.bannedAt = { not: null }
    else if (opts.status === 'suspended')
      where.suspendedUntil = { gt: new Date() }

    return prisma.profile.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        isActive: true,
        strikeCount: true,
        bannedAt: true,
        suspendedUntil: true,
        email_verified: true,
        created_at: true,
        _count: { select: { posts: true, orders: true } },
      },
      orderBy: { created_at: 'desc' },
      take: opts.limit + 1,
      skip: opts.offset,
    })
  },

  setUserRole(userId: string, role: string) {
    return prisma.profile.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    })
  },

  setUserActive(userId: string, isActive: boolean) {
    return prisma.profile.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, isActive: true },
    })
  },

  listSellers(opts: { search?: string; status?: string; limit: number; offset: number }) {
    const where: any = {}
    if (opts.search) {
      where.OR = [
        { store_name: { contains: opts.search, mode: 'insensitive' } },
        { store_slug: { contains: opts.search, mode: 'insensitive' } },
      ]
    }
    if (opts.status === 'pending') where.verification_status = 'PENDING'
    if (opts.status === 'inactive') where.is_active = false

    return prisma.sellerProfile.findMany({
      where,
      select: {
        id: true,
        store_name: true,
        store_slug: true,
        store_logo: true,
        is_active: true,
        is_verified: true,
        verification_status: true,
        followers_count: true,
        created_at: true,
        profile: { select: { id: true, email: true, username: true } },
        _count: { select: { products: true } },
      },
      orderBy: { created_at: 'desc' },
      take: opts.limit + 1,
      skip: opts.offset,
    })
  },

  updateSellerVerification(
    id: string,
    status: 'VERIFIED' | 'REJECTED',
    reason?: string,
  ) {
    return prisma.sellerProfile.update({
      where: { id },
      data: {
        verification_status: status,
        is_verified: status === 'VERIFIED',
        verification_reason: reason ?? null,
      },
      select: { id: true, verification_status: true, is_verified: true },
    })
  },

  // ── Payouts ──────────────────────────────────────────────────────────────

  listPayouts(opts: { status?: string; limit: number; offset: number }) {
    const where = opts.status ? { status: opts.status } : {}
    return prisma.payout.findMany({
      where,
      select: {
        id: true,
        amount: true,
        status: true,
        bank_account: true,
        transaction_ref: true,
        requested_at: true,
        completed_at: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            seller: {
              select: {
                id: true,
                store_name: true,
                store_slug: true,
                store_logo: true,
                profileId: true,
              },
            },
          },
        },
      },
      orderBy: { requested_at: 'desc' }, // most-recent first (queue is filtered to PENDING by default)
      take: opts.limit + 1,
      skip: opts.offset,
    })
  },

  getPayout(id: string) {
    return prisma.payout.findUnique({
      where: { id },
      select: {
        id: true,
        walletId: true,
        amount: true,
        status: true,
        wallet: {
          select: { seller: { select: { profileId: true, store_name: true } } },
        },
      },
    })
  },

  // ── Finance / Orders ───────────────────────────────────────────────────────

  // "Revenue" orders = fully paid (card/PayPal) + POD shipping-confirmed.
  getFinanceOverview(sinceDate: Date) {
    const PAID = ['PAID', 'SHIPPING_PAID'] as const
    return prisma.$transaction([
      prisma.orders.aggregate({
        where: { paymentStatus: { in: PAID as any }, created_at: { gte: sinceDate } },
        _sum: { totalAmount: true, shippingCost: true, affiliateCut: true },
        _count: true,
      }),
      prisma.orders.aggregate({
        where: { paymentStatus: { in: PAID as any } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.orders.groupBy({ by: ['paymentStatus'], _count: true }),
    ])
  },

  listOrders(opts: {
    paymentStatus?: string
    search?: string
    limit: number
    offset: number
  }) {
    const where: any = {}
    if (opts.paymentStatus) where.paymentStatus = opts.paymentStatus
    if (opts.search) {
      const asId = Number(opts.search)
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' as const } },
        ...(Number.isInteger(asId) && asId > 0 ? [{ id: asId }] : []),
      ]
    }
    return prisma.orders.findMany({
      where,
      select: {
        id: true,
        totalAmount: true,
        shippingCost: true,
        paymentStatus: true,
        status: true,
        paymentMethod: true,
        created_at: true,
        name: true,
        affiliateCut: true,
        _count: { select: { orderItem: true } },
      },
      orderBy: { created_at: 'desc' },
      take: opts.limit + 1,
      skip: opts.offset,
    })
  },

  // ── Squares ────────────────────────────────────────────────────────────────

  async listSquares(opts: {
    status?: string
    type?: string
    search?: string
    limit: number
    offset: number
  }) {
    const where: any = {}
    if (opts.status) where.status = opts.status
    if (opts.type) where.type = opts.type
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' as const } },
        { slug: { contains: opts.search, mode: 'insensitive' as const } },
        { city: { contains: opts.search, mode: 'insensitive' as const } },
      ]
    }
    const rows = await prisma.square.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        city: true,
        state: true,
        iconUrl: true,
        memberCount: true,
        postCount: true,
        created_at: true,
        // Real follower count from the actual UserSquareFollow rows — the
        // denormalized followerCount field was polluted by demo seeding.
        _count: { select: { followers: true } },
      },
      orderBy: { created_at: 'desc' },
      take: opts.limit + 1,
      skip: opts.offset,
    })
    return rows.map(({ _count, ...s }) => ({
      ...s,
      followerCount: _count.followers,
    }))
  },

  getSquare(id: string) {
    return prisma.square.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        type: true,
        city: true,
        state: true,
      },
    })
  },

  listSquareFollowerIds(squareId: string) {
    return prisma.userSquareFollow.findMany({
      where: { squareId },
      select: { userId: true },
    })
  },

  // Active sellers located in a square's city/state — candidates to invite when a
  // GEOGRAPHIC square goes live. Capped to keep the fan-out bounded.
  listLocalSellerProfileIds(city: string | null, state: string | null, limit = 500) {
    if (!city && !state) return Promise.resolve([] as { profileId: string }[])
    return prisma.sellerProfile.findMany({
      where: {
        is_active: true,
        ...(city
          ? { city: { equals: city, mode: 'insensitive' as const } }
          : { state: { equals: state, mode: 'insensitive' as const } }),
      },
      select: { profileId: true },
      take: limit,
    })
  },

  setSquareStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return prisma.square.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, slug: true },
    })
  },

  listSquareOfficerProfileIds(squareId: string) {
    return prisma.squareOfficer.findMany({
      where: { squareId },
      select: { profileId: true },
    })
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  listCategories() {
    return prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnailCatUrl: true,
        created_at: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    })
  },

  createCategory(data: { name: string; slug: string; thumbnailCatUrl?: string }) {
    return prisma.category.create({ data })
  },

  updateCategory(
    id: number,
    data: { name?: string; slug?: string; thumbnailCatUrl?: string | null },
  ) {
    return prisma.category.update({ where: { id }, data })
  },

  deleteCategory(id: number) {
    // ProductCategories cascade → products keep, they just lose this tag.
    return prisma.category.delete({ where: { id } })
  },

  // ── Seller verification documents ────────────────────────────────────────────

  listSellerDocuments(sellerProfileId: string) {
    return prisma.verificationDocument.findMany({
      where: { sellerProfileId },
      select: {
        id: true,
        type: true,
        url: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })
  },

  // ── Stats ────────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      pendingReports,
      resolvedToday,
      activeUsers,
      activeSellers,
      bannedUsers,
      flaggedPosts,
      flaggedProducts,
      pendingPayouts,
      payoutLiabilityAgg,
      pendingSquares,
    ] = await prisma.$transaction([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({
        where: { status: 'RESOLVED', resolvedAt: { gte: todayStart } },
      }),
      prisma.profile.count({ where: { bannedAt: null } }),
      prisma.sellerProfile.count({ where: { is_active: true } }),
      prisma.profile.count({ where: { bannedAt: { not: null } } }),
      prisma.post.count({ where: { moderationStatus: { in: ['FLAGGED', 'UNDER_REVIEW'] } } }),
      prisma.products.count({ where: { moderationStatus: { in: ['FLAGGED', 'UNDER_REVIEW'] } } }),
      prisma.payout.count({ where: { status: 'PENDING' } }),
      prisma.payout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.square.count({ where: { status: 'PENDING' } }),
    ])

    return {
      pendingReports,
      resolvedToday,
      activeUsers,
      activeSellers,
      bannedUsers,
      flaggedContent: flaggedPosts + flaggedProducts,
      pendingPayouts,
      // Kobo owed out to sellers in still-pending withdrawal requests.
      payoutLiability: payoutLiabilityAgg._sum.amount ?? 0,
      pendingSquares,
    }
  },
}
