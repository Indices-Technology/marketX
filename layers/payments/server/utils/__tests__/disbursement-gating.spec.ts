import { describe, it, expect } from 'vitest'
import {
  enabledDisbursementProviders,
  resolveDisbursementProvider,
  getDisbursementProviderById,
  isAutomatedSettlementAvailable,
} from '../../providers/disbursement.registry'
import { moniepointProvider } from '../../providers/moniepoint'

/**
 * The Moniepoint provider exists as structure only. These tests are the guard
 * that keeps it that way: if someone flips `enabled` without doing the work in
 * the enabling checklist, these fail loudly rather than money moving quietly.
 */
describe('disbursement is not enabled', () => {
  it('no provider is enabled', () => {
    expect(enabledDisbursementProviders()).toHaveLength(0)
    expect(isAutomatedSettlementAvailable()).toBe(false)
  })

  it('moniepoint is registered but gated', () => {
    expect(getDisbursementProviderById('moniepoint')).toBeDefined()
    expect(moniepointProvider.enabled).toBe(false)
  })

  it('resolves to null for NGN rather than falling back to a default rail', () => {
    // Unlike collection, there is no fallback. Null must mean "cannot pay out",
    // never "use whatever is first in the list".
    expect(resolveDisbursementProvider({ currency: 'NGN', country: 'NG' })).toBeNull()
    expect(resolveDisbursementProvider({ currency: 'KES' })).toBeNull()
  })

  it('canHandle refuses even for its own currency while gated', () => {
    expect(moniepointProvider.canHandle({ currency: 'NGN', country: 'NG' })).toBe(false)
  })

  it('every money-moving method throws rather than returning a plausible result', async () => {
    await expect(
      moniepointProvider.resolveAccount('0123456789', '058'),
    ).rejects.toThrow(/not implemented/i)
    await expect(
      moniepointProvider.createRecipient({
        accountNumber: '0123456789',
        bankCode: '058',
        accountName: 'Test',
      }),
    ).rejects.toThrow(/not implemented/i)
    await expect(
      moniepointProvider.transfer({
        reference: 'payout-1',
        recipientCode: 'RCP_x',
        amountMinor: 100000,
        currency: 'NGN',
      }),
    ).rejects.toThrow(/not implemented/i)
    await expect(moniepointProvider.getBalance('NGN')).rejects.toThrow(
      /not implemented/i,
    )
    await expect(moniepointProvider.parseTransferWebhook('{}', {})).rejects.toThrow(
      /not implemented/i,
    )
  })

  it('does not claim capabilities that have not been confirmed', () => {
    // Claiming a webhook or bulk support we have not verified would let the
    // batch design assume a guarantee that may not exist.
    expect(moniepointProvider.capabilities.webhook).toBe(false)
    expect(moniepointProvider.capabilities.bulkTransfer).toBe(false)
    expect(moniepointProvider.capabilities.nameEnquiry).toBe(false)
  })
})
