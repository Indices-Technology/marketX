/**
 * server/utils/taskSchedule.ts
 *
 * The canonical schedule for everything in `server/tasks/*`.
 *
 * One list, three consumers — so the cron expressions can't drift apart:
 *   1. nuxt.config.ts  → nitro.scheduledTasks (in-process cron, opt-in only)
 *   2. GET /api/internal/tasks → status/verification surface
 *   3. docs/JOBS.md    → the external scheduler's configuration
 *
 * Keep this dependency-free: nuxt.config.ts imports it by relative path during
 * config evaluation, before any alias or auto-import is available.
 */

export interface ScheduledTaskDef {
  /** Must match the `meta.name` in the corresponding server/tasks/*.ts */
  name: string
  /** Standard 5-field cron, UTC */
  cron: string
  /** Why it exists, and what breaks if it stops running */
  purpose: string
  /**
   * true = money or fulfillment depends on this running. These are the ones to
   * alert on when a run goes missing, not just log.
   */
  critical: boolean
}

export const SCHEDULED_TASKS: ScheduledTaskDef[] = [
  {
    name: 'releaseExpiredOrders',
    cron: '*/15 * * * *',
    purpose:
      'Reconciles PENDING/UNPAID orders older than 30 min against Paystack; confirms genuinely-paid ones, cancels the rest and restores stock. Sole backstop for a lost payment webhook.',
    critical: true,
  },
  {
    name: 'releaseShippedOrders',
    cron: '0 */6 * * *',
    purpose:
      'Auto-releases seller funds for orders SHIPPED/READY_FOR_PICKUP 7+ days with no buyer confirmation. Without it sellers are never paid.',
    critical: true,
  },
  {
    name: 'pollCarrierTracking',
    cron: '*/30 * * * *',
    purpose:
      'Pull-only carrier tracking. The only mechanism advancing GIG orders (no delivery webhook) SHIPPED → DELIVERED.',
    critical: true,
  },
  {
    name: 'reputationBackfill',
    cron: '*/20 * * * *',
    purpose:
      'Idempotent reputation reconciliation — replays signals missed by best-effort live emission so a seller is never held below min-evidence.',
    critical: false,
  },
  {
    name: 'processQueues',
    cron: '* * * * *',
    purpose:
      'Health-check stub. Doubles as the "is the scheduler alive?" ping.',
    critical: false,
  },
]

/** Shape Nitro expects: { '<cron>': ['taskA', 'taskB'] } */
export function toNitroScheduledTasks(): Record<string, string[]> {
  return SCHEDULED_TASKS.reduce<Record<string, string[]>>((acc, t) => {
    ;(acc[t.cron] ??= []).push(t.name)
    return acc
  }, {})
}
