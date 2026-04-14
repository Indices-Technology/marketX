import { randomBytes } from 'node:crypto'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { affiliateRepository } from '../repositories/affiliate.repository'

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
    return { isEnrolled: true, affiliateCode: code }
  },
}
