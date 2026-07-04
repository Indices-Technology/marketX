import type { INotification } from '~~/layers/profile/app/types/profile.types'

/**
 * Turns a notification into navigable, actor-aware display:
 *  - `segments` — inline text where any segment with `to` renders as a link
 *    (the actor's name → their profile, an order `#id` → the order details).
 *  - `to` — the primary destination for a whole-row click.
 *
 * Social notifications are rebuilt from `type` + `actor` (so we show the real
 * username, not the "Someone …" baked into the stored message). Order/system
 * notifications keep their descriptive message but linkify the `#<id>`.
 */
export interface NotifSegment {
  text: string
  to?: string
}

export interface PresentedNotification {
  segments: NotifSegment[]
  to: string | null
  icon: string
}

const ICON: Record<string, string> = {
  NEW_FOLLOWER: 'mdi:account-plus-outline',
  POST_LIKE: 'mdi:heart',
  COMMENT_LIKE: 'mdi:heart-outline',
  NEW_COMMENT: 'mdi:comment-outline',
  REPLY: 'mdi:comment-text-outline',
  MENTION: 'mdi:at',
  NEW_POST: 'mdi:image-outline',
  ORDER: 'mdi:package-variant-closed',
  PRODUCT: 'mdi:tag-outline',
  PRODUCT_SHARE: 'mdi:share-outline',
  REVIEW: 'mdi:star-outline',
  GENERAL: 'mdi:bell-outline',
  SQUARE_ANNOUNCEMENT: 'mdi:bullhorn-outline',
  SQUARE_REQUEST: 'mdi:hand-wave-outline',
  SQUARE_OFFER: 'mdi:tag-heart-outline',
  WALL_SHOUTOUT: 'mdi:message-star-outline',
  SUPPORT: 'mdi:lifebuoy',
}

// Social types we rebuild as "{actor} {action}".
const ACTION: Record<string, string> = {
  NEW_FOLLOWER: ' started following you',
  POST_LIKE: ' liked your post',
  COMMENT_LIKE: ' liked your comment',
  NEW_COMMENT: ' commented on your post',
  REPLY: ' replied to your comment',
  MENTION: ' mentioned you',
  NEW_POST: ' shared a new post',
}

/** Split an order message so the `#<id>` becomes a link to the order. */
function linkifyOrder(message: string, to: string | null): NotifSegment[] {
  if (!to) return [{ text: message }]
  const m = message.match(/#(\d+)/)
  if (!m || m.index === undefined) return [{ text: message, to }]
  const i = m.index
  const token = m[0]
  const segs: NotifSegment[] = []
  if (i > 0) segs.push({ text: message.slice(0, i) })
  segs.push({ text: token, to })
  const rest = message.slice(i + token.length)
  if (rest) segs.push({ text: rest })
  return segs
}

export function presentNotification(n: INotification): PresentedNotification {
  const icon = ICON[n.type] ?? 'mdi:bell-outline'
  const actorName = n.actor?.username || 'Someone'
  const actorLink = n.actor?.username
    ? `/profile/${n.actor.username}`
    : undefined
  const orderId = n.orderId ?? n.order?.id ?? null
  const productLink = n.product?.slug ? `/product/${n.product.slug}` : null
  const convLink = n.conversation?.id
    ? `/messages/${n.conversation.id}`
    : '/messages'

  if (ACTION[n.type]) {
    return {
      segments: [{ text: actorName, to: actorLink }, { text: ACTION[n.type]! }],
      to: actorLink ?? null,
      icon,
    }
  }

  switch (n.type) {
    case 'ORDER': {
      // Prefer the explicit column. Fall back to the `#<id>` in the message so
      // existing order notifications (created without orderId) still link — but
      // only for buyer-owned ones ("Your order …"); seller "New order …"
      // notices must NOT point at the buyer-scoped order page.
      let oid = orderId
      if (!oid && /your order/i.test(n.message)) {
        const parsed = n.message.match(/#(\d+)/)
        oid = parsed ? Number(parsed[1]) : null
      }
      const oLink = oid ? `/buyer/orders/${oid}` : null
      return { segments: linkifyOrder(n.message, oLink), to: oLink, icon }
    }
    case 'PRODUCT':
    case 'PRODUCT_SHARE':
    case 'REVIEW':
      return {
        segments: [{ text: n.message, to: productLink ?? actorLink }],
        to: productLink ?? actorLink ?? null,
        icon,
      }
    case 'GENERAL': {
      // Messages/conversations carry an actor — surface & link their name.
      if (n.actor?.username) {
        const uname = n.actor.username
        // Message already names them (e.g. "New message from akstar") → just link the row.
        if (n.message.toLowerCase().includes(uname.toLowerCase())) {
          return {
            segments: [{ text: n.message, to: convLink }],
            to: convLink,
            icon,
          }
        }
        // Otherwise prepend the linked actor: "{actor} started a conversation with you".
        const rest = n.message.charAt(0).toLowerCase() + n.message.slice(1)
        return {
          segments: [{ text: uname, to: actorLink }, { text: ' ' + rest }],
          to: convLink,
          icon,
        }
      }
      return {
        segments: [{ text: n.message, to: convLink }],
        to: convLink,
        icon,
      }
    }
    default:
      // Square / Wall / Support / unknown — keep the descriptive message,
      // navigate to the actor's profile when we have one.
      return { segments: [{ text: n.message }], to: actorLink ?? null, icon }
  }
}
