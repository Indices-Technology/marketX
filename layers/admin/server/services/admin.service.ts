import type { ContentType, ModerationAction, ModerationStatus, ReportReason, ReportStatus } from '@prisma/client'
import { adminRepository } from '~~/layers/admin/server/repositories/admin.repository'
import { bust } from '~~/server/utils/cache'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import {
  buildSellerVerificationEmail,
  buildAccountStatusEmail,
  buildContentModerationEmail,
  buildRoleChangeEmail,
  buildSuspensionLiftedEmail,
} from '~~/server/utils/email/emailService'

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
    bust('admin:stats').catch(() => {})

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
    bust('admin:stats').catch(() => {})

    // Apply content action
    if (action === 'HIDE' || action === 'REMOVE') {
      const status: ModerationStatus = action === 'HIDE' ? 'HIDDEN' : 'REMOVED'
      await adminService.moderateContent(report.contentType, report.contentId, status)
    }

    // Add strike + notify content author on WARN, HIDE, REMOVE
    if (action !== 'DISMISS' && action !== 'REINSTATE') {
      const authorId = await getContentAuthorId(report.contentType, report.contentId)
      if (authorId) {
        await adminRepository.addStrike(authorId)

        const actionMap = {
          WARN: 'WARNED',
          HIDE: 'HIDDEN',
          REMOVE: 'REMOVED',
        } as const
        const modAction = actionMap[action as keyof typeof actionMap]
        if (modAction) {
          const contentLabel = report.contentType.toLowerCase()
          const suffix = note ? `: ${note}` : ''
          const modMessage =
            modAction === 'WARNED'
              ? `Your ${contentLabel} has received a warning${suffix}`
              : modAction === 'HIDDEN'
                ? `Your ${contentLabel} has been hidden from public view${suffix}`
                : `Your ${contentLabel} has been removed for violating community guidelines${suffix}`
          notificationQueue.enqueue({
            userId: authorId,
            type: 'GENERAL',
            actorId: moderatorId,
            message: modMessage,
          })
          prisma.profile
            .findUnique({ where: { id: authorId }, select: { email: true } })
            .then((p) => {
              if (!p?.email) return
              const { subject, html, text } = buildContentModerationEmail(
                modAction,
                report.contentType,
                note,
              )
              emailQueue.enqueue({
                to: p.email,
                subject,
                html,
                text,
                type: 'GENERAL',
              })
            })
            .catch(() => {})
        }
      }
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
    // Flagged/hidden counts feed the dashboard — refresh it.
    bust('admin:stats').catch(() => {})
  },

  // ── Users ────────────────────────────────────────────────────────────────

  async listUsers(opts: {
    search?: string
    status?: 'banned' | 'suspended'
    limit: number
    offset: number
  }) {
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
    const result = await adminRepository.suspendUser(
      userId,
      moderatorId,
      reason,
      expiresAt,
    )
    bust('admin:stats').catch(() => {})

    // Notify user — fire-and-forget
    const action = durationDays ? 'SUSPENDED' : 'BANNED'
    const message = durationDays
      ? `Your account has been suspended for ${durationDays} day${durationDays !== 1 ? 's' : ''}: ${reason}`
      : `Your account has been permanently banned: ${reason}`
    notificationQueue.enqueue({ userId, type: 'GENERAL', message })
    prisma.profile
      .findUnique({ where: { id: userId }, select: { email: true } })
      .then((p) => {
        if (!p?.email) return
        const { subject, html, text } = buildAccountStatusEmail(
          action,
          reason,
          durationDays,
        )
        emailQueue.enqueue({ to: p.email, subject, html, text, type: 'GENERAL' })
      })
      .catch(() => {})

    return result
  },

  async liftSuspension(userId: string, liftedById: string) {
    const result = await adminRepository.liftSuspension(userId, liftedById)
    bust('admin:stats').catch(() => {})

    notificationQueue.enqueue({
      userId,
      type: 'GENERAL',
      actorId: liftedById,
      message: 'Your account suspension has been lifted. Welcome back!',
    })
    prisma.profile
      .findUnique({ where: { id: userId }, select: { email: true } })
      .then((p) => {
        if (!p?.email) return
        const { subject, html, text } = buildSuspensionLiftedEmail()
        emailQueue.enqueue({
          to: p.email,
          subject,
          html,
          text,
          type: 'GENERAL',
        })
      })
      .catch(() => {})

    return result
  },

  async setUserRole(userId: string, role: string, moderatorId?: string) {
    const result = await adminRepository.setUserRole(userId, role)

    const roleLabel =
      role === 'moderator' ? 'Moderator'
      : role === 'admin' ? 'Admin'
      : role === 'support_agent' ? 'Support Agent'
      : 'User'
    const isGrant =
      role === 'moderator' || role === 'admin' || role === 'support_agent'
    const message = isGrant
      ? `You have been granted ${roleLabel} access on MarketX`
      : `Your account role has been updated to ${roleLabel}`
    notificationQueue.enqueue({
      userId,
      type: 'GENERAL',
      actorId: moderatorId,
      message,
    })
    prisma.profile
      .findUnique({ where: { id: userId }, select: { email: true } })
      .then((p) => {
        if (!p?.email) return
        const { subject, html, text } = buildRoleChangeEmail(role)
        emailQueue.enqueue({
          to: p.email,
          subject,
          html,
          text,
          type: 'GENERAL',
        })
      })
      .catch(() => {})

    return result
  },

  async toggleUserActive(userId: string, isActive: boolean) {
    const result = await adminRepository.setUserActive(userId, isActive)

    // Notify user — fire-and-forget
    const action = isActive ? 'ENABLED' : 'DISABLED'
    const message = isActive
      ? 'Your account has been re-enabled. Welcome back!'
      : 'Your account has been disabled by an administrator. Contact support if you believe this is an error.'
    notificationQueue.enqueue({ userId, type: 'GENERAL', message })
    prisma.profile
      .findUnique({ where: { id: userId }, select: { email: true } })
      .then((p) => {
        if (!p?.email) return
        const { subject, html, text } = buildAccountStatusEmail(action)
        emailQueue.enqueue({ to: p.email, subject, html, text, type: 'GENERAL' })
      })
      .catch(() => {})

    return result
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

  async verifySeller(
    id: string,
    status: 'VERIFIED' | 'REJECTED',
    reason?: string,
  ) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id },
      select: {
        profileId: true,
        store_name: true,
        profile: { select: { email: true } },
      },
    })

    const result = await adminRepository.updateSellerVerification(
      id,
      status,
      reason,
    )

    if (sellerProfile?.profileId) {
      const isVerified = status === 'VERIFIED'
      const message = isVerified
        ? `Your store "${sellerProfile.store_name}" has been verified! You can now sell on MarketX.`
        : `Your store verification was not approved${reason ? `: ${reason}` : '.'}`
      notificationQueue.enqueue({
        userId: sellerProfile.profileId,
        type: 'GENERAL',
        message,
      })
      if (sellerProfile.profile?.email) {
        const { subject, html, text } = buildSellerVerificationEmail(
          sellerProfile.store_name ?? '',
          status,
          reason,
        )
        emailQueue.enqueue({
          to: sellerProfile.profile.email,
          subject,
          html,
          text,
          type: 'GENERAL',
        })
      }
    }

    return result
  },

  // ── Payouts ──────────────────────────────────────────────────────────────

  async listPayouts(opts: { status?: string; limit: number; offset: number }) {
    const rows = await adminRepository.listPayouts(opts)
    const hasMore = rows.length > opts.limit
    return {
      items: hasMore ? rows.slice(0, opts.limit) : rows,
      meta: { limit: opts.limit, offset: opts.offset, hasMore },
    }
  },

  /**
   * Process a seller withdrawal request. There is no automated transfer — the
   * admin settles the payout via a manual bank transfer, then records it here.
   *  - PAID:     mark completed + store the bank transfer ref. The wallet was
   *              already debited when the withdrawal was requested, so no
   *              balance change.
   *  - REJECTED: mark rejected AND refund the amount to the seller's wallet
   *              (with a reversing CREDIT transaction), since the request debited it.
   * Idempotent: the status flip is a conditional updateMany on PENDING, so a
   * double-submit (or a race) can never pay/refund twice.
   */
  async processPayout(
    payoutId: string,
    action: 'PAID' | 'REJECTED',
    opts: { transactionRef?: string; moderatorId: string },
  ) {
    const payout = await adminRepository.getPayout(payoutId)
    if (!payout)
      throw createError({ statusCode: 404, statusMessage: 'Payout not found' })
    if (payout.status !== 'PENDING')
      throw createError({
        statusCode: 400,
        statusMessage: `Payout already ${payout.status.toLowerCase()}`,
      })

    const sellerProfileId = payout.wallet?.seller?.profileId
    const amountNaira = (payout.amount / 100).toLocaleString('en-NG')

    if (action === 'PAID') {
      const { count } = await prisma.payout.updateMany({
        where: { id: payoutId, status: 'PENDING' },
        data: {
          status: 'PAID',
          completed_at: new Date(),
          transaction_ref: opts.transactionRef ?? null,
        },
      })
      if (count === 0)
        throw createError({ statusCode: 409, statusMessage: 'Payout already processed' })

      if (sellerProfileId) {
        notificationQueue.enqueue({
          userId: sellerProfileId,
          type: 'GENERAL',
          actorId: opts.moderatorId,
          message: `Your withdrawal of ₦${amountNaira} has been paid out${
            opts.transactionRef ? ` (ref: ${opts.transactionRef})` : ''
          }.`,
        })
      }
    } else {
      // REJECTED — flip + refund the wallet atomically.
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.payout.updateMany({
          where: { id: payoutId, status: 'PENDING' },
          data: { status: 'REJECTED', completed_at: new Date() },
        })
        if (count === 0)
          throw createError({ statusCode: 409, statusMessage: 'Payout already processed' })

        await tx.sellerWallet.update({
          where: { id: payout.walletId },
          data: { balance: { increment: payout.amount } },
        })
        await tx.transaction.create({
          data: {
            walletId: payout.walletId,
            amount: payout.amount,
            type: 'CREDIT',
            description: `Withdrawal #${payoutId.slice(0, 8)} rejected — funds returned`,
          },
        })
      })

      if (sellerProfileId) {
        notificationQueue.enqueue({
          userId: sellerProfileId,
          type: 'GENERAL',
          actorId: opts.moderatorId,
          message: `Your withdrawal of ₦${amountNaira} was declined and the funds returned to your wallet.`,
        })
      }
    }

    bust('admin:stats').catch(() => {})
    return { id: payoutId, status: action }
  },

  // ── Finance / Orders ───────────────────────────────────────────────────────

  async getFinanceOverview(days = 30) {
    const since = new Date()
    since.setUTCDate(since.getUTCDate() - days)
    const [windowAgg, allTimeAgg, byStatus] =
      await adminRepository.getFinanceOverview(since)

    const gmv = windowAgg._sum.totalAmount ?? 0
    const orders = windowAgg._count ?? 0

    return {
      days,
      gmv, // kobo
      orders,
      aov: orders > 0 ? Math.round(gmv / orders) : 0,
      shipping: windowAgg._sum.shippingCost ?? 0,
      affiliatePaid: windowAgg._sum.affiliateCut ?? 0,
      allTimeGmv: allTimeAgg._sum.totalAmount ?? 0,
      allTimeOrders: allTimeAgg._count ?? 0,
      byPaymentStatus: Object.fromEntries(
        byStatus.map((r) => [r.paymentStatus, r._count]),
      ),
    }
  },

  async listOrders(opts: {
    paymentStatus?: string
    search?: string
    limit: number
    offset: number
  }) {
    const rows = await adminRepository.listOrders(opts)
    const hasMore = rows.length > opts.limit
    return {
      items: hasMore ? rows.slice(0, opts.limit) : rows,
      meta: { limit: opts.limit, offset: opts.offset, hasMore },
    }
  },

  // ── Squares ────────────────────────────────────────────────────────────────

  async listSquares(opts: {
    status?: string
    type?: string
    search?: string
    limit: number
    offset: number
  }) {
    const rows = await adminRepository.listSquares(opts)
    const hasMore = rows.length > opts.limit
    return {
      items: hasMore ? rows.slice(0, opts.limit) : rows,
      meta: { limit: opts.limit, offset: opts.offset, hasMore },
    }
  },

  async setSquareStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED',
    moderatorId: string,
  ) {
    const square = await adminRepository.getSquare(id)
    if (!square)
      throw createError({ statusCode: 404, statusMessage: 'Square not found' })

    const updated = await adminRepository.setSquareStatus(id, status)

    // Notify the square's officers of the decision.
    const officers = await adminRepository.listSquareOfficerProfileIds(id)
    const message =
      status === 'ACTIVE'
        ? `Your market square "${square.name}" is now live on MarketX.`
        : `Your market square "${square.name}" has been suspended by an administrator.`
    for (const o of officers) {
      notificationQueue.enqueue({
        userId: o.profileId,
        type: 'GENERAL',
        actorId: moderatorId,
        message,
      })
    }

    // Public square directory is cached — refresh it, and the dashboard stat.
    bust('squares:list:*').catch(() => {})
    bust('admin:stats').catch(() => {})
    return updated
  },

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
