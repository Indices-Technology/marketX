// GET /api/profile/[username] - Get public profile

import { profileRepository } from '../../../repositories/profile.repository'
import { UserError } from '../../../types/user.types'

function extractWebsiteUrl(links: any): string | null {
  if (!links || !Array.isArray(links)) return null
  const website = links.find((l: any) => l.type === 'website')
  return website?.url ?? null
}

export default defineEventHandler(async (event) => {
  try {
    const username = getRouterParam(event, 'username')
    if (!username) {
      throw new UserError('INVALID_USERNAME', 'Username is required', 400)
    }
    const profile = await profileRepository.findByUsername(username)

    if (!profile) {
      throw new UserError('USER_NOT_FOUND', `User @${username} not found`, 404)
    }

    // Whitelist public seller fields. The repository loads the full
    // sellerProfile row, which includes private data (raw GPS lat/long that
    // must honor `hideLocation` ghost-mode, shipFrom origin address/phone,
    // internal verification_status/reason). Never spread it wholesale.
    const seller = profile.sellerProfile?.[0] ?? null
    const publicSeller = seller
      ? {
          id: seller.id,
          store_name: seller.store_name,
          store_slug: seller.store_slug,
          store_description: seller.store_description,
          store_logo: seller.store_logo,
          store_banner: seller.store_banner,
          store_website: seller.store_website,
          store_socials: seller.store_socials,
          is_verified: seller.is_verified,
          is_active: seller.is_active,
          isPremium: seller.isPremium,
          followers_count: seller.followers_count,
          averageRating: seller.averageRating,
          totalReviews: seller.totalReviews,
          default_currency: seller.default_currency,
          // Coarse, opt-in location only — never raw lat/long, and only when
          // the seller has not enabled ghost mode.
          locationLabel: seller.hideLocation ? null : seller.locationLabel,
          city: seller.hideLocation ? null : seller.city,
          state: seller.hideLocation ? null : seller.state,
        }
      : null

    // Return a sanitized public profile (no password_hash, email, etc.)
    const publicProfile = {
      id: profile.id,
      username: profile.username,
      bio: profile.bio,
      avatar: profile.avatar,
      role: profile.role,
      location: profile.location,
      stateOfResidence: profile.location, // alias used by ProfileHeader
      links: profile.links,
      profileUrl: extractWebsiteUrl(profile.links),
      sellerProfile: publicSeller,
      created_at: profile.created_at,
    }

    return { success: true, data: publicProfile }
  } catch (error: any) {
    if (error instanceof UserError) {
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    }
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
