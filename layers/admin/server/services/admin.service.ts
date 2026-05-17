import type { ContentType, ModerationAction, ModerationStatus, ReportReason, ReportStatus } from '@prisma/client'
import { adminRepository } from '~~/layers/admin/server/repositories/admin.repository'
import { bust } from '~~/server/utils/cache'

const REPORT_THRESHOLD = 3 // auto-flag at this many reports

export const adminService = {
  // ── Reports ──────────────────────────────────────────────────────────────

  async listReports(opts: {
    status?: ReportStatus
    contentType?: ContentType
    limit: number
    offset: number
  }) {
    const rows = await adminRepository.listReports(opts)
    const hasMore = rows.length > opts.limit
    return {
      items: hasMore ? rows.slice(0, opts.limit) : rows,
      meta: { limit: opts.limit, offset: opts.offset, hasMore },
    }
  },

  getReport: adminRepository.getReport,

  async submitReport(data: {
    reporterId: string
    contentType: ContentType
    contentId: string
    reason: ReportReason
    note?: string
  }) {
    const existing = await adminRepository.findExistingReport(
      data.reporterId,
      data.contentType,
      data.contentId,
    )
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Already reported' })
    }

    const report = await adminRepository.createReport(data)

    // Increment reportCount and auto-flag if threshold is met
    await autoFlagIfThreshold(data.contentType, data.contentId)

    return report
  },

  async resolveReport(
    id: string,
    moderatorId: string,
    action: ModerationAction,
    note?: string,
  ) {
    const report = await adminRepository.getReport(id)
    if (!report) throw createError({ statusCode: 404, statusMessage: 'Report not found' })
    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      throw createError({ statusCode: 400, statusMessage: 'Report already resolved' })
    }

    const resolved = await adminRepository.resolveReport(id, moderatorId, action, note)

    // Apply content action
    if (action === 'HIDE' || action === 'REMOVE') {
      const status: ModerationStatus = action === 'HIDE' ? 'HIDDEN' : 'REMOVED'
      await adminService.moderateContent(report.contentType, report.contentId, status)
    }

    // Add strike on WARN, HIDE, REMOVE
    if (action !== 'DISMISS' && action !== 'REINSTATE') {
      const authorId = await getContentAuthorId(report.contentType, report.contentId)
      if (authorId) await adminRepository.addStrike(authorId)
    }

    return resolved
  },

  // ── Content ──────────────────────────────────────────────────────────────

  async moderateContent(type: ContentType, id: string, status: ModerationStatus) {
    switch (type) {
      case 'POST':
        await adminRepository.moderatePost(id, status)
        bust(`feed:following:user:*`, `feed:home:*`).catch(() => {})
        break
      case 'PRODUCT':
        await adminRepository.moderateProduct(Number(id), status)
        break
      case 'COMMENT':
        await adminRepository.moderateComment(id, status)
        break
    }
  },

  // ── Users ────────────────────────────────────────────────────────────────

  async listUsers(opts: { search?: string; limit: number; offset: number }) {
    const rows = await adminRepository.listUsers(opts)
    const hasMore = rows.length > opts.limit
    return {
      items: hasMore ? rows.slice(0, opts.limit) : rows,
      meta: { limit: opts.limit, offset: opts.offset, hasMore },
    }
  },

  async suspendUser(
    userId: string,
    moderatorId: string,
    reason: string,
    durationDays?: number,
  ) {
    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 86_400_000)
      : null // null = permanent ban
    return adminRepository.suspendUser(userId, moderatorId, reason, expiresAt)
  },

  liftSuspension: adminRepository.liftSuspension,

  setUserRole: adminRepository.setUserRole,

  toggleUserActive(userId: string, isActive: boolean) {
    return adminRepository.setUserActive(userId, isActive)
  },

  // ── Sellers ──────────────────────────────────────────────────────────────

  async listSellers(opts: { search?: string; status?: string; limit: number; offset: number }) {
    const rows = await adminRepository.listSellers(opts)
    const hasMore = rows.length > opts.limit
    return {
      items: hasMore ? rows.slice(0, opts.limit) : rows,
      meta: { limit: opts.limit, offset: opts.offset, hasMore },
    }
  },

  verifySeller: adminRepository.updateSellerVerification,

  // ── Stats ─────────────────────────────────────────────────────────────────

  getDashboardStats: adminRepository.getDashboardStats,
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function autoFlagIfThreshold(contentType: ContentType, contentId: string) {
  const count = await adminRepository.countReportsByContent(contentType, contentId)

  if (count >= REPORT_THRESHOLD) {
    const status: ModerationStatus = 'FLAGGED'
    switch (contentType) {
      case 'POST':
        await adminRepository.moderatePost(contentId, status)
        break
      case 'PRODUCT':
        await adminRepository.moderateProduct(Number(contentId), status)
        break
      case 'COMMENT':
        await adminRepository.moderateComment(contentId, status)
        break
    }
  }

  // Always bump the denormalized count on the content row
  if (contentType === 'POST') {
    await prisma.post.update({
      where: { id: contentId },
      data: { reportCount: { increment: 1 } },
    })
  } else if (contentType === 'PRODUCT') {
    await prisma.products.update({
      where: { id: Number(contentId) },
      data: { reportCount: { increment: 1 } },
    })
  } else if (contentType === 'COMMENT') {
    await prisma.comment.update({
      where: { id: contentId },
      data: { reportCount: { increment: 1 } },
    })
  }
}

async function getContentAuthorId(contentType: ContentType, contentId: string) {
  if (contentType === 'POST') {
    const p = await prisma.post.findUnique({ where: { id: contentId }, select: { authorId: true } })
    return p?.authorId ?? null
  }
  if (contentType === 'PRODUCT') {
    const p = await prisma.products.findUnique({
      where: { id: Number(contentId) },
      select: { seller: { select: { profileId: true } } },
    })
    return p?.seller.profileId ?? null
  }
  if (contentType === 'COMMENT') {
    const c = await prisma.comment.findUnique({ where: { id: contentId }, select: { authorId: true } })
    return c?.authorId ?? null
  }
  return null
}
