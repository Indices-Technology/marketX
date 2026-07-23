/**
 * server/plugins/workers.ts
 *
 * Starts all BullMQ domain workers when Nitro boots.
 * Each worker runs in-process and processes jobs as they arrive.
 *
 * Workers only start when QUEUE_REDIS_URL is set.
 * If Redis is not configured, queues fall back to inline execution automatically.
 */

import { startAuditWorker } from '../queues/audit.queue'
import { startNotificationWorker } from '../queues/notification.queue'
import { startEmailWorker } from '../queues/email.queue'
import { startPodReminderCron } from '../queues/pod-reminder.queue'
import { startReputationWorker } from '../queues/reputation.queue'

// Guard against double-start. In dev, Nitro HMR can re-evaluate this plugin
// module and re-run the bootstrap, stacking duplicate Workers on the SHARED
// queue (each pulls jobs → duplicate/mis-typed notifications). A globalThis flag
// survives module re-eval within the same process, so workers start exactly once.
const _g = globalThis as unknown as { __mxWorkersStarted?: boolean }

export default defineNitroPlugin(() => {
  if (_g.__mxWorkersStarted) return
  _g.__mxWorkersStarted = true

  const audit = startAuditWorker()
  const notification = startNotificationWorker()
  const email = startEmailWorker()
  const reputation = startReputationWorker()

  if (audit || notification || email || reputation) {
    console.log(
      '[workers] BullMQ workers started:',
      [
        audit && 'audit',
        notification && 'notification',
        email && 'email',
        reputation && 'reputation',
      ]
        .filter(Boolean)
        .join(', '),
    )
  } else {
    console.log(
      '[workers] QUEUE_REDIS_URL not set — workers disabled, jobs run inline',
    )
  }

  // POD reminder cron runs regardless of Redis (uses setInterval + inline notifications)
  startPodReminderCron()
})
