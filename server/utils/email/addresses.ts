// server/utils/email/addresses.ts
/**
 * Sending identities — SINGLE SOURCE OF TRUTH for who an email comes *from*
 * and where a reply *lands*.
 *
 * Two systems share the marketx.africa domain and they do different jobs:
 *
 *   Resend         → OUTBOUND only. Sends everything the app generates. A From
 *                    address here does NOT need a Private Email mailbox behind
 *                    it; Resend signs with the domain's DKIM key.
 *   Private Email  → INBOUND only (Namecheap). Real mailboxes and aliases.
 *                    This is where a human reply actually arrives.
 *
 * The consequence that matters: every From we send must have a Reply-To that
 * points at an address a human can open, or replies vanish. `notifications@`
 * exists as an alias precisely so a reply to it is recoverable rather than a
 * hard bounce — but the Reply-To below is what we actually want people using.
 *
 * Read from process.env, not useRuntimeConfig(), so this works identically in
 * Nitro request handlers and inside the BullMQ worker.
 */

import type { EmailJob } from '../../queues/email.queue'

const DOMAIN = process.env.NUXT_PUBLIC_BRAND_DOMAIN || 'marketx.africa'
const SITE_NAME = process.env.NUXT_PUBLIC_SITE_NAME || 'MarketX'

/** From address for every app-generated email. Override with SENDER_EMAIL. */
const FROM = process.env.SENDER_EMAIL || `notifications@${DOMAIN}`

/** Human inboxes. Each MUST exist as a Private Email mailbox or alias. */
export const INBOX = {
  support: process.env.NUXT_PUBLIC_SUPPORT_EMAIL || `support@${DOMAIN}`,
  dispute: process.env.DISPUTE_EMAIL || `dispute@${DOMAIN}`,
  team: process.env.TEAM_EMAIL || `team@${DOMAIN}`,
  info: process.env.INFO_EMAIL || `info@${DOMAIN}`,
  privacy: process.env.NUXT_PUBLIC_PRIVACY_EMAIL || `privacy@${DOMAIN}`,
  legal: process.env.NUXT_PUBLIC_LEGAL_EMAIL || `legal@${DOMAIN}`,
} as const

/**
 * Where replies to each email type should land.
 *
 * Order confirmations and password resets generate real replies ("where is my
 * order?", "I didn't request this") — those belong with support, not in a
 * no-reply void. Welcome mail is the one moment a human introduction is worth
 * it, so it points at the team inbox.
 */
const REPLY_TO_BY_TYPE: Record<EmailJob['type'], string> = {
  VERIFICATION: INBOX.support,
  PASSWORD_RESET: INBOX.support,
  WELCOME: INBOX.team,
  ORDER_CONFIRMATION: INBOX.support,
  GENERAL: INBOX.support,
}

/**
 * Build the From header. Recipients and spam filters both prefer a display
 * name over a bare address. If SENDER_EMAIL already carries one ("MarketX
 * <notifications@…>") it is respected as-is.
 */
export function resolveFrom(): string {
  return FROM.includes('<') ? FROM : `${SITE_NAME} <${FROM}>`
}

/**
 * Reply-To for a job. An explicit value from the caller always wins — that's
 * how support tickets and disputes route replies to their own inboxes.
 */
export function resolveReplyTo(
  type?: EmailJob['type'],
  explicit?: string,
): string {
  if (explicit) return explicit
  return (type && REPLY_TO_BY_TYPE[type]) || INBOX.support
}
