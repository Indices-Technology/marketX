/**
 * POST /api/internal/tasks/:name
 *
 * Host-agnostic trigger for the scheduled jobs in `server/tasks/*`.
 *
 * WHY THIS EXISTS
 * Nitro's built-in `scheduledTasks` only fire on a host that runs a long-lived
 * Node process with the schedule runner attached. Serverless/function hosts
 * (Netlify, Vercel, Cloudflare) never start it, so the jobs silently never run —
 * see docs/JOBS.md. Rather than pin the platform, the schedule lives OUTSIDE the
 * app and pokes this endpoint. Any scheduler can drive it (Upstash QStash,
 * GitHub Actions cron, cron-job.org, a systemd timer, `curl` from a VM), so
 * moving hosts means repointing a URL — no code change, no job loss.
 *
 * The task bodies are untouched: this only invokes what `defineTask` already
 * registered, so the same file runs whether it was triggered here or by
 * in-process cron.
 *
 * AUTH
 * `Authorization: Bearer <TASKS_SHARED_SECRET>` (or `x-tasks-key: <secret>`).
 * Fails closed — with no secret configured the endpoint is unavailable rather
 * than open, in every environment. This is the lowest common denominator that
 * every scheduler can send; per-provider signature schemes (e.g. QStash's) would
 * re-couple us to one vendor, which is the thing we're avoiding.
 *
 * USAGE
 *   curl -X POST https://<host>/api/internal/tasks/releaseExpiredOrders \
 *        -H "Authorization: Bearer $TASKS_SHARED_SECRET"
 *
 * RESPONSES
 *   200 { success: true, task, durationMs, result }   ran (result from the task)
 *   200 { success: true, task, skipped: 'locked' }    another run holds the lock
 *   401 unauthorized · 404 unknown task · 500 task threw · 503 secret unset
 */
import { redis } from '../../../utils/cache'
import { recordRun } from '../../../utils/taskRuns'
import { assertTaskSecret } from '../../../utils/taskAuth'

/**
 * Lock lifetime. Only an upper bound on a crashed run blocking the next trigger —
 * it is released in `finally` on the normal path. Longer than the slowest task,
 * shorter than the tightest schedule (`processQueues`, 1 min, is a no-op stub).
 */
const LOCK_TTL_SECONDS = 300

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Task name required' })
  }

  assertTaskSecret(event, `run:${name}`)

  // Cross-instance overlap guard. Every task is idempotent (conditional/atomic
  // writes — see docs/JOBS.md), so this is an efficiency measure, not a
  // correctness one: without it a retrying scheduler or a second app instance
  // would run duplicate scans that do no additional work. Degrades cleanly to
  // "no lock" when Upstash isn't configured.
  const lockKey = `tasks:lock:${name}`
  let holdsLock = false
  if (redis) {
    try {
      const acquired = await redis.set(lockKey, Date.now(), {
        nx: true,
        ex: LOCK_TTL_SECONDS,
      })
      if (!acquired) {
        logger.info('[task-runner] skipped — already running', { task: name })
        return { success: true, task: name, skipped: 'locked' as const }
      }
      holdsLock = true
    } catch {
      /* Redis blip — proceed unlocked rather than skip a money-critical run */
    }
  }

  const startedAt = Date.now()
  try {
    // Throws a 404 h3 error for a name that no `defineTask` registered.
    const result = await runTask(name)
    const durationMs = Date.now() - startedAt

    await recordRun(name, { ok: true, durationMs })
    logger.info('[task-runner] completed', { task: name, durationMs })
    return { success: true, task: name, durationMs, result }
  } catch (error: unknown) {
    // H3 errors first (404 unknown task) so they keep their status.
    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    await recordRun(name, {
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    logger.logError('[task-runner] task failed', error, {
      task: name,
      durationMs: Date.now() - startedAt,
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: `Task '${name}' failed`,
    })
  } finally {
    // Release on both paths so a failed run can be retried immediately rather
    // than waiting out the TTL.
    if (holdsLock) await redis!.del(lockKey).catch(() => {})
  }
})
