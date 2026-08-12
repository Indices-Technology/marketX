import { randomBytes } from 'node:crypto'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { affiliateRepository } from '../repositories/affiliate.repository'
import { bust } from '~~/server/utils/cache'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { buildAffiliateWelcomeEmail } from '~~/server/utils/email/emailService'

/** Cache key for GET /api/commerce/affiliate (see index.get.ts). */
export const affiliateStatsKey = (userId: string) => `affiliate:stats:${userId}`

export const affiliateService = {
  async getStats(userId: string) {
    const profile = await affiliateRepository.getProfile(userId)
    if (!profile) throw new UserError('NOT_FOUND', 'Profile not found', 404)

    if (!profile.affiliateCode) {
      return {
        isEnrolled: false,
        affiliateCode: null,
        stats: { totalEarnings: 0, pendingEarnings: 0, totalConversions: 0 },
      }
    }

    const { released, pending } = await affiliateRepository.getEarnings(userId)
    return {
      isEnrolled: true,
      affiliateCode: profile.affiliateCode,
      stats: {
        totalEarnings: (released._sum.affiliateCut ?? 0) / 100,
        pendingEarnings: (pending._sum.affiliateCut ?? 0) / 100,
        totalConversions: released._count.id,
      },
    }
  },

  async enroll(userId: string) {
    const profile = await affiliateRepository.getProfile(userId)
    if (!profile) throw new UserError('NOT_FOUND', 'Profile not found', 404)

    // Already enrolled — idempotent
    if (profile.affiliateCode) {
      return { isEnrolled: true, affiliateCode: profile.affiliateCode }
    }

    // Generate a unique code: username-prefix + 6-char hex
    const base = (profile.username ?? 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 12)

    let code = `${base}_${randomBytes(3).toString('hex')}`
    const collision = await affiliateRepository.findByCode(code)
    if (collision) code = `${base}_${randomBytes(3).toString('hex')}`

    await affiliateRepository.setAffiliateCode(userId, code)

    // The status endpoint caches `getStats` for 60s. Enrollment is the one write
    // that invalidates it, and the client refetches status IMMEDIATELY after this
    // call — without this bust it reads back the pre-enrollment `isEnrolled:false`
    // snapshot and the dashboard stays locked (no link) for up to a minute despite
    // the success toast.
    await bust(affiliateStatsKey(userId))

    // Confirm enrollment off-platform. Deliberately GENERAL, not ORDER: only the
    // ORDER type is WhatsApp-eligible, and enrollment isn't worth a paid template
    // send. The email carries the link so it's reachable without hunting for the
    // dashboard tab — which is the only place it currently lives.
    const baseUrl = useRuntimeConfig().public.baseURL
    const link = `${baseUrl ?? ''}/?ref=${code}`
    notificationQueue.enqueue({
      userId,
      type: 'GENERAL',
      message: `You're now a MarketX affiliate. Share your link to start earning: ${link}`,
    })
    if (profile.email && !profile.email.includes('@checkout.marketx.')) {
      const { subject, html, text } = buildAffiliateWelcomeEmail(link, {
        dashboardUrl: baseUrl
          ? `${baseUrl}/profile/${profile.username ?? ''}?tab=affiliate`
          : undefined,
      })
      emailQueue.enqueue({
        to: profile.email,
        subject,
        html,
        text,
        type: 'GENERAL',
      })
    }

    return { isEnrolled: true, affiliateCode: code }
  },
}
