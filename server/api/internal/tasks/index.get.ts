/**
 * GET /api/internal/tasks
 *
 * Status surface for the scheduled jobs — the answer to "are the money-critical
 * tasks actually running on this host?", which docs/JOBS.md and the launch
 * checklist both require confirming after every deploy.
 *
 * Reports, per task, when it last ran and whether it succeeded. `stale: true`
 * means the last successful run is older than its cron interval allows, i.e.
 * the scheduler is not reaching this deployment.
 *
 * Auth: same shared secret as the trigger endpoint.
 *   curl https://<host>/api/internal/tasks -H "Authorization: Bearer $TASKS_SHARED_SECRET"
 */
import { SCHEDULED_TASKS } from '../../../utils/taskSchedule'
import { getLastRun } from '../../../utils/taskRuns'
import { assertTaskSecret } from '../../../utils/taskAuth'

/**
 * Expected gap between runs, from the cron expression. Only the two forms the
 * schedule actually uses are parsed (every-N-minutes and every-N-hours);
 * anything else falls back to 24h, which keeps staleness reporting conservative
 * rather than noisy for a schedule shape we don't use.
 */
function expectedIntervalMs(cron: string): number {
  const everyNMinutes = cron.match(/^\*\/(\d+) \* \* \* \*$/)
  if (everyNMinutes) return Number(everyNMinutes[1]) * 60_000
  if (cron === '* * * * *') return 60_000
  const everyNHours = cron.match(/^0 \*\/(\d+) \* \* \*$/)
  if (everyNHours) return Number(everyNHours[1]) * 3_600_000
  return 24 * 3_600_000
}

export default defineEventHandler(async (event) => {
  assertTaskSecret(event, 'status')

  const now = Date.now()
  const tasks = await Promise.all(
    SCHEDULED_TASKS.map(async (def) => {
      const lastRun = await getLastRun(def.name)
      // Grace of 2x the interval — one missed tick is a blip, two is a signal.
      const staleAfterMs = expectedIntervalMs(def.cron) * 2
      const stale = lastRun
        ? now - new Date(lastRun.at).getTime() > staleAfterMs
        : true

      return {
        name: def.name,
        cron: def.cron,
        critical: def.critical,
        purpose: def.purpose,
        lastRun,
        stale,
      }
    }),
  )

  const staleCritical = tasks.filter((t) => t.stale && t.critical)

  return {
    // `healthy: false` with a non-empty staleCritical list is the condition to
    // alert on — it means seller payouts / lost-webhook recovery are not running.
    healthy: staleCritical.length === 0,
    inProcessCronEnabled: process.env.NITRO_INPROCESS_CRON === 'true',
    staleCritical: staleCritical.map((t) => t.name),
    tasks,
  }
})
