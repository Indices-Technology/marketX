// Nitro task — one-shot backfill of the reputation signal ledger from existing
// history. Not on a cron; run on demand after applying the ReputationSignal
// migration (e.g. `nitro task run reputationBackfill`, or the tasks API). Safe
// to re-run: signal writes are idempotent on (sourceRef, signalKey).

import { runReputationBackfill } from '~~/layers/reputation/server/utils/backfill'

export default defineTask({
  meta: {
    name: 'reputationBackfill',
    description:
      'Replay orders/reviews/disputes into the reputation signal ledger',
  },
  async run() {
    const counts = await runReputationBackfill()
    return { result: { status: 'ok', ...counts } }
  },
})
