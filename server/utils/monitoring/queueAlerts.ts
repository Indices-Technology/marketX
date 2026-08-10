/**
 * Alert when a BullMQ job permanently fails (exhausts all its retry
 * attempts) — not on every individual retry, which each queue already logs
 * to console/stderr on its own and which usually just resolves on the next
 * attempt. This is the "nobody is watching the dead-letter set" gap: a job
 * that fails 3/3 times currently just sits in Redis with nothing surfacing
 * it, so a buyer/seller can silently never get an order notification/email
 * and no one finds out unless someone happens to inspect the queue.
 *
 * Wired up once per worker in server/plugins/workers.ts. Fans out through
 * whatever's configured in alerts.ts (Slack/DataDog/PagerDuty env vars),
 * falling back to a console.error so it's at least in the server logs.
 */
import type { Worker } from 'bullmq'
import { sendAlert, type AlertSeverity } from './alerts'

export function alertOnFinalFailure(
  worker: Worker,
  queueName: string,
  severity: AlertSeverity = 'critical',
) {
  worker.on('failed', (job, err) => {
    const attempts = job?.opts?.attempts ?? 1
    // Fires after every failed attempt — only alert once retries are exhausted.
    if (!job || job.attemptsMade < attempts) return

    sendAlert(
      `Job permanently failed in "${queueName}" queue after ${attempts} attempt(s) — job ${job.id}: ${err.message}`,
      severity,
    ).catch(() => {})
  })
}
