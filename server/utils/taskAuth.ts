/**
 * server/utils/taskAuth.ts
 *
 * Shared-secret guard for the internal task endpoints.
 *
 * A plain bearer secret is deliberate: it's the one scheme every scheduler can
 * send (Upstash QStash, GitHub Actions, cron-job.org, systemd timer, curl), which
 * is what keeps the job schedule portable across hosts. Adopting a provider's
 * signature scheme would re-couple the app to that provider.
 */
import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

/**
 * Constant-time comparison. Both sides are hashed first so the operands are
 * always 32 bytes — `timingSafeEqual` throws on a length mismatch, and throwing
 * early on length would itself leak how long the secret is.
 */
function secretMatches(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/**
 * Throws 503 if no secret is configured (fail closed — an unset secret must
 * never mean "anyone may run jobs that move money"), 401 if it doesn't match.
 */
export function assertTaskSecret(event: H3Event, context: string): void {
  const expected = process.env.TASKS_SHARED_SECRET
  if (!expected) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Task runner not configured',
    })
  }

  const provided =
    getRequestHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '') ||
    getRequestHeader(event, 'x-tasks-key')

  if (!provided || !secretMatches(provided, expected)) {
    logger.warn('[task-runner] unauthorized request', {
      context,
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
