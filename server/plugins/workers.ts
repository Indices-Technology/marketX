/**
 * server/plugins/workers.ts
 *
 * Starts all BullMQ domain workers when Nitro boots.
 * Each worker runs in-process and processes jobs as they arrive.
 *
 * PRODUCER vs CONSUMER — why WORKERS_ENABLED exists
 * A BullMQ Worker is a long-lived process that holds a blocking read against
 * Redis. Function hosts (Vercel, Netlify, Cloudflare) freeze the execution
 * environment once the response is sent, so a Worker started there stops pulling
 * mid-flight and the queue never drains — see docs/JOBS.md. But those same
 * instances must still ENQUEUE (an order is paid → a notification job is
 * written), so QUEUE_REDIS_URL stays set everywhere.
 *
 * The two roles therefore split by deployment, not by config of the queue:
 *   - web instance   → QUEUE_REDIS_URL set, WORKERS_ENABLED unset  → produces only
 *   - worker instance → QUEUE_REDIS_URL set, WORKERS_ENABLED=true  → consumes
 *
 * Off by default, deliberately. A short-lived Worker on a function host does not
 * fail loudly — it competes for jobs with the real worker, wins some, then
 * freezes holding them, which looks exactly like "notifications are flaky".
 * Opting IN on the one always-on host is safer than opting out everywhere else.
 *
 * Workers additionally require QUEUE_REDIS_URL; with no Redis at all the queues
 * fall back to inline execution and there is nothing to consume.
 */

import { startAuditWorker } from '../queues/audit.queue'
import { startNotificationWorker } from '../queues/notification.queue'
import { startEmailWorker } from '../queues/email.queue'
import { startPodReminderCron } from '../queues/pod-reminder.queue'
import { startReputationWorker } from '../queues/reputation.queue'
import { startWhatsAppWorker } from '../queues/whatsapp.queue'
import { alertOnFinalFailure } from '../utils/monitoring/queueAlerts'

// Guard against double-start. In dev, Nitro HMR can re-evaluate this plugin
// module and re-run the bootstrap, stacking duplicate Workers on the SHARED
// queue (each pulls jobs → duplicate/mis-typed notifications). A globalThis flag
// survives module re-eval within the same process, so workers start exactly once.
const _g = globalThis as unknown as { __mxWorkersStarted?: boolean }

export default defineNitroPlugin(() => {
  // Role gate — see the PRODUCER vs CONSUMER note above. Only the always-on
  // worker deployment sets this; web instances stay producers.
  if (process.env.WORKERS_ENABLED !== 'true') {
    console.log(
      '[workers] WORKERS_ENABLED not set — this instance produces jobs only, does not consume',
    )
    return
  }

  if (_g.__mxWorkersStarted) return
  _g.__mxWorkersStarted = true

  const audit = startAuditWorker()
  const notification = startNotificationWorker()
  const email = startEmailWorker()
  const reputation = startReputationWorker()
  const whatsapp = startWhatsAppWorker()

  // User-facing delivery queues (a permanent failure here means a real person
  // never got their order update) alert at 'critical'; internal bookkeeping
  // queues alert at 'warning' since nothing customer-visible is blocked.
  if (audit) alertOnFinalFailure(audit, 'audit', 'warning')
  if (notification) alertOnFinalFailure(notification, 'notification')
  if (email) alertOnFinalFailure(email, 'email')
  if (reputation) alertOnFinalFailure(reputation, 'reputation', 'warning')
  if (whatsapp) alertOnFinalFailure(whatsapp, 'whatsapp')

  if (audit || notification || email || reputation || whatsapp) {
    console.log(
      '[workers] BullMQ workers started:',
      [
        audit && 'audit',
        notification && 'notification',
        email && 'email',
        reputation && 'reputation',
        whatsapp && 'whatsapp',
      ]
        .filter(Boolean)
        .join(', '),
    )
  } else {
    console.log(
      '[workers] QUEUE_REDIS_URL not set — workers disabled, jobs run inline',
    )
  }

  // POD reminder cron (setInterval + inline notifications, no Redis needed).
  //
  // Separately opt-in, and OFF by default even on the worker instance. It never
  // actually ran on a function host — setInterval dies with the frozen
  // environment — so its documented spam bug stayed dormant: it dedupes on a
  // floored day count while firing hourly, sending ~24 identical notifications
  // per day for a matching order (docs/JOBS.md, "Still on setInterval").
  //
  // Moving to an always-on host would wake that bug up. Gated here so standing
  // up the worker does not silently start spamming buyers. Turn on only after
  // the dedupe is fixed and POD itself is live.
  if (process.env.POD_REMINDER_ENABLED === 'true') {
    console.log('[workers] POD reminder cron started')
    startPodReminderCron()
  }
})
