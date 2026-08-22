/**
 * server/queues/reputation.queue.ts — Reputation evidence ledger domain
 *
 * Producer:  reputationQueue.enqueue(signal)  — call WITHOUT await in any service
 * Consumer:  BullMQ Worker started by server/plugins/workers.ts on boot
 *            (falls back to inline write when QUEUE_REDIS_URL is unset)
 *
 * The worker appends one provenance-stamped ReputationSignal row, idempotent on
 * (sourceRef, signalKey) so replays and retries never double-count. Resilient:
 * writes are swallowed until the ReputationSignal table exists (migration).
 */

import { Queue, Worker, type Job } from 'bullmq'
import { queueConnection } from '../utils/queue'
import { trackQueueWrite } from '../utils/queueFlush'
import { prisma } from '../utils/db'
import type { ReputationSignalInput } from '../../layers/reputation/server/utils/signals'
import { invalidateProfile } from '../../layers/reputation/server/utils/reputationEngine'

const QUEUE_NAME = 'reputation'

/** Append one signal, idempotent on (sourceRef, signalKey). */
async function writeSignal(input: ReputationSignalInput): Promise<void> {
  try {
    const existing = await prisma.reputationSignal.findFirst({
      where: { sourceRef: input.sourceRef, signalKey: input.signalKey },
      select: { id: true },
    })
    if (existing) return

    await prisma.reputationSignal.create({
      data: {
        sellerId: input.sellerId,
        signalKey: input.signalKey,
        dimension: input.dimension,
        tier: input.tier,
        value: input.value as object,
        confidence: input.confidence ?? 1,
        sourceType: input.sourceType,
        sourceRef: input.sourceRef,
        method: input.method,
        verifierId: input.verifierId ?? null,
        observedAt: new Date(input.observedAt),
      },
    })

    // New evidence invalidates the cached ReputationProfile snapshot, so the
    // Trust Card/tab reflect this sale on the next read instead of after the
    // 6h TTL. Only on a real append — the idempotent skip above changed nothing.
    await invalidateProfile(input.sellerId)
  } catch (e) {
    // Resilient: table not migrated yet, or a transient error. Never throw into
    // the caller's request path.
    console.error(
      '[reputation.queue] writeSignal error:',
      (e as Error)?.message,
    )
  }
}

// ─── Producer ────────────────────────────────────────────────────────────────

const _queue = queueConnection
  ? new Queue<ReputationSignalInput>(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    })
  : null

export const reputationQueue = {
  /** Fire-and-forget — never await this. */
  enqueue(data: ReputationSignalInput): Promise<void> {
    if (_queue) {
      return trackQueueWrite(
        _queue
          .add('signal', data)
          .then(() => undefined)
          .catch((e) => console.error('[reputation.queue] enqueue error:', e)),
      )
    }
    // Fallback: write inline when Redis is not configured.
    return Promise.resolve(writeSignal(data)).then(() => undefined)
  },
}

// ─── Consumer (Worker) ───────────────────────────────────────────────────────

export function startReputationWorker() {
  if (!queueConnection) return null

  const worker = new Worker<ReputationSignalInput>(
    QUEUE_NAME,
    async (job: Job<ReputationSignalInput>) => {
      await writeSignal(job.data)
    },
    { connection: queueConnection, concurrency: 10 },
  )

  worker.on('failed', (job, err) =>
    console.error(`[reputation.queue] job ${job?.id} failed:`, err.message),
  )

  return worker
}
