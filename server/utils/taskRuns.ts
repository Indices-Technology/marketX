/**
 * server/utils/taskRuns.ts
 *
 * Last-run bookkeeping for scheduled tasks.
 *
 * The point is verifiability. docs/JOBS.md and the launch checklist both require
 * confirming that money-critical jobs *actually ran* in production; with logs
 * scattered across ephemeral function invocations that was unanswerable. A tiny
 * Redis record per task turns it into one authenticated GET.
 *
 * Best-effort by design: a failure to record must never fail the task run
 * itself, and no-Redis simply means the status surface reports `null`.
 */
import { redis } from './cache'

/** Long enough that a stopped daily-ish task still shows its last success. */
const RUN_TTL_SECONDS = 14 * 24 * 60 * 60

export interface TaskRunRecord {
  ok: boolean
  durationMs: number
  at: string
  error?: string
}

const key = (name: string) => `tasks:lastrun:${name}`

export async function recordRun(
  name: string,
  run: { ok: boolean; durationMs: number; error?: string },
): Promise<void> {
  if (!redis) return
  const record: TaskRunRecord = { ...run, at: new Date().toISOString() }
  try {
    await redis.set(key(name), record, { ex: RUN_TTL_SECONDS })
  } catch {
    /* bookkeeping only — never let this surface as a task failure */
  }
}

export async function getLastRun(name: string): Promise<TaskRunRecord | null> {
  if (!redis) return null
  try {
    return await redis.get<TaskRunRecord>(key(name))
  } catch {
    return null
  }
}
