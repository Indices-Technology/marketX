/**
 * Scheduled task: prepare a settlement batch.
 *
 * Reads balances and writes proposals. Moves no money, creates no Payout rows,
 * calls no provider — see settlement.service for why that separation exists.
 *
 * While SETTLEMENT_SHADOW is not 'false' (the default), every batch is marked
 * shadow and cannot be approved or executed. The point of running it anyway is
 * to accumulate a record of what the engine WOULD have paid, so the thresholds
 * can be tuned against real balances before anyone is asked to approve anything.
 */
import { settlementService, isShadowMode } from '~~/layers/commerce/server/services/settlement.service'

export default defineTask({
  meta: {
    name: 'prepareSettlementBatch',
    description:
      'Prepare a settlement batch of payable wallets (proposal only — never moves money)',
  },
  async run() {
    const shadow = isShadowMode()
    logger.info('[task:prepareSettlementBatch] fired', {
      at: new Date().toISOString(),
      shadow,
    })

    try {
      const result = await settlementService.prepareBatch()
      if (!result) {
        return { result: 'Nothing payable — no batch written' }
      }

      logger.info('[task:prepareSettlementBatch] batch prepared', result)
      return {
        result:
          `Batch ${result.batchId}${result.shadow ? ' (SHADOW)' : ''}: ` +
          `${result.included} payable, ${result.flagged} flagged for review, ` +
          `net ₦${(result.totalNet / 100).toLocaleString('en-NG')}`,
      }
    } catch (e) {
      // Never throw out of a scheduled task — a failed preparation must not stop
      // the scheduler, and there is no partial state to clean up because the
      // whole batch is written in one transaction.
      logger.logError('[task:prepareSettlementBatch]', e)
      return { result: `Failed: ${(e as Error)?.message}` }
    }
  },
})
