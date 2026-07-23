// POST /api/reputation/backfill — replays history into the signal ledger.
// Dev-only trigger (prod backfill runs via the `reputationBackfill` nitro task),
// so it can't be hit by real traffic.

import { runReputationBackfill } from '~~/layers/reputation/server/utils/backfill'

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 403, statusMessage: 'Not available' })
  }
  try {
    const counts = await runReputationBackfill()
    return { success: true, ...counts }
  } catch (error: unknown) {
    logger.logError('[POST /api/reputation/backfill]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Backfill failed',
    })
  }
})
