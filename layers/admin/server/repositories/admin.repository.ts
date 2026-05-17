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

  listUsers(opts: { search?: string; limit: number; offset: number }) {
    const where = opts.search
      ? {
          OR: [
            { email: { contains: opts.search, mode: 'insensitive' as const } },
            { username: { contains: opts.search, mode: 'insensitive' as const } },
          ],
        }
      : {}
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
    ])

    return {
      pendingReports,
      resolvedToday,
      activeUsers,
      activeSellers,
      bannedUsers,
      flaggedContent: flaggedPosts + flaggedProducts,
    }
  },
}
