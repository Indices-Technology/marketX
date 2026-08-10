import { encryptApiKey } from '~~/layers/core/server/services/aiConfig.service'
import {
  FACEBOOK_CONNECT_SCOPES,
  type FacebookPageConnection,
} from '../utils/facebook.oauth'

/**
 * Connect exactly one Facebook Page per seller. Replaces any existing META_FB
 * connection this seller has that points at a DIFFERENT Page — reconnecting
 * with a different Page swaps it rather than stacking a second row.
 */
export async function connectFacebookPage(
  sellerId: string,
  page: FacebookPageConnection,
): Promise<void> {
  await prisma.socialConnection.deleteMany({
    where: {
      sellerId,
      platform: 'META_FB',
      providerUserId: { not: page.pageId },
    },
  })

  await prisma.socialConnection.upsert({
    where: {
      sellerId_platform_providerUserId: {
        sellerId,
        platform: 'META_FB',
        providerUserId: page.pageId,
      },
    },
    update: {
      displayName: page.displayName ?? null,
      accessToken: encryptApiKey(page.accessToken),
      scope: FACEBOOK_CONNECT_SCOPES,
      status: 'ACTIVE',
    },
    create: {
      sellerId,
      platform: 'META_FB',
      providerUserId: page.pageId,
      displayName: page.displayName ?? null,
      accessToken: encryptApiKey(page.accessToken),
      scope: FACEBOOK_CONNECT_SCOPES,
      status: 'ACTIVE',
    },
  })
}
