/**
 * server/queues/whatsapp.queue.ts — WhatsApp domain
 *
 * Producer:  whatsappQueue.enqueue(data)  — call without await in any service
 * Consumer:  BullMQ Worker started by server/plugins/workers.ts on boot
 *
 * Sends via Meta's WhatsApp Cloud API using a pre-approved message template —
 * business-initiated sends outside a 24h customer-service window MUST use an
 * approved template (Authentication / Utility / Marketing category).
 *
 * BullMQ guarantees:
 *  - Jobs are persisted in Redis until processed
 *  - Failed jobs retry with exponential backoff (3 attempts)
 *  - If the server crashes mid-job, BullMQ reclaims it on restart (stalled jobs)
 *  - Dead-letter: after 3 failures the job moves to the "failed" set (inspectable)
 */

import { Queue, Worker, type Job } from 'bullmq'
import { queueConnection } from '../utils/queue'

export interface WhatsAppJob {
  /** E.164 format, e.g. +2348012345678 — pass through shared/utils/phone.ts normalizePhone() first */
  to: string
  templateName: string
  languageCode?: string
  /** Body variable substitutions, in template placeholder order (e.g. {{1}}, {{2}}) */
  params?: string[]
  /** Template category — informational only (for logs); the template itself is what Meta actually enforces */
  type: 'AUTHENTICATION' | 'UTILITY' | 'MARKETING'
}

const QUEUE_NAME = 'whatsapp'
const GRAPH_API_VERSION = 'v21.0'

// ─── Producer ────────────────────────────────────────────────────────────────

const _queue = queueConnection
  ? new Queue<WhatsAppJob>(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    })
  : null

export const whatsappQueue = {
  /**
   * Fire-and-forget — never await this.
   *
   * Pass `dedupeKey` to make the enqueue idempotent: BullMQ ignores a second job
   * with a jobId that's still known (waiting/active/retained), so duplicate
   * triggers (webhook races, double-submit) send exactly one message.
   */
  enqueue(data: WhatsAppJob, opts?: { dedupeKey?: string }): void {
    if (_queue) {
      _queue
        .add(
          'send',
          data,
          opts?.dedupeKey ? { jobId: opts.dedupeKey } : undefined,
        )
        .catch((e) => console.error('[whatsapp.queue] enqueue error:', e))
    } else {
      // Fallback: run inline when Redis not configured
      _sendWhatsApp(data).catch((e) =>
        console.error('[whatsapp.queue] inline fallback error:', e),
      )
    }
  },
}

// ─── Shared send helper ───────────────────────────────────────────────────────

async function _sendWhatsApp(data: WhatsAppJob): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) {
    console.warn(
      '[whatsapp.queue] WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID not set — message skipped',
    )
    return
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: data.to,
        type: 'template',
        template: {
          name: data.templateName,
          language: { code: data.languageCode || 'en_US' },
          components: data.params?.length
            ? [
                {
                  type: 'body',
                  parameters: data.params.map((text) => ({
                    type: 'text',
                    text,
                  })),
                },
              ]
            : undefined,
        },
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`WhatsApp send failed (${res.status}): ${body}`)
  }
}

// ─── Consumer (Worker) ───────────────────────────────────────────────────────

export function startWhatsAppWorker() {
  if (!queueConnection) return null

  const worker = new Worker<WhatsAppJob>(
    QUEUE_NAME,
    async (job: Job<WhatsAppJob>) => {
      await _sendWhatsApp(job.data)
    },
    {
      connection: queueConnection,
      concurrency: 5, // lower — external Graph API rate limits
    },
  )

  worker.on('failed', (job, err) =>
    console.error(`[whatsapp.queue] job ${job?.id} failed:`, err.message),
  )

  return worker
}
