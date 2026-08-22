/**
 * Moniepoint disbursement provider — STRUCTURE ONLY, NOT ENABLED.
 *
 * `enabled: false`, so the registry never selects it and no code path can reach
 * a live transfer. Settlement stays manual: an admin reads the payable and sends
 * the money by hand. This file exists so the settlement engine can be built and
 * tested against a real interface before any rail is switched on, and so the
 * shape of the integration is settled while the commercial conversation happens.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BEFORE THIS CAN BE ENABLED
 *
 * Four questions must be answered by Moniepoint, and two of them are blockers:
 *
 *  1. IDEMPOTENCY (blocker). Does the transfer endpoint accept a client-supplied
 *     reference and treat a repeat as the same instruction? Without it, a
 *     request that times out cannot be safely retried, and `transfer()` cannot
 *     honour its contract. If the answer is no, this provider is the wrong
 *     choice regardless of pricing.
 *
 *  2. TRANSFER WEBHOOKS (blocker). Are success / failed / REVERSED pushed? A
 *     reversal that nobody hears about leaves the ledger claiming a seller was
 *     paid when the money came back. If there is no webhook, outcomes must be
 *     polled and `capabilities.webhook` stays false.
 *
 *  3. Transfer OTP. Can it be disabled for programmatic transfers? If every
 *     transfer needs a code from someone's phone, unattended settlement is not
 *     possible and the approval gate is doing that job anyway.
 *
 *  4. Name enquiry, balance, bulk transfer, per-transfer fee, daily caps,
 *     sandbox. These shape the batch design rather than blocking it.
 *
 * ENABLING CHECKLIST — all of these, not some:
 *   [ ] questions 1 and 2 answered yes, in writing
 *   [ ] credentials in env, never in code
 *   [ ] every method below implemented and tested against the sandbox
 *   [ ] transfer webhook route registered and signature verification tested
 *       with a deliberately BAD signature, not only a good one
 *   [ ] recipient codes persisted per provider, raw bank details still the
 *       source of truth (see PayoutRecipient in the settlement design)
 *   [ ] reconciliation job matching settlement deposits to orders
 *   [ ] a kill switch that stops execution without a deploy
 *   [ ] `enabled` flipped LAST, after everything above
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  IDisbursementProvider,
  BankAccountRef,
  TransferInput,
} from '../utils/disbursement.types'

/**
 * Every method throws. This is deliberate: a half-implemented money-sending
 * provider that silently returns a plausible-looking result is far more
 * dangerous than one that refuses to run. If any of these ever executes, routing
 * is wrong and the loud failure is the correct outcome.
 */
function notImplemented(method: string): never {
  throw new Error(
    `[moniepoint] ${method} is not implemented — this provider is structure only. ` +
      `Settlement is manual. See the enabling checklist in this file.`,
  )
}

export const moniepointProvider: IDisbursementProvider = {
  id: 'moniepoint',
  name: 'Moniepoint',

  // The switch. Nothing else in this file matters while this is false.
  enabled: false,

  capabilities: {
    currencies: ['NGN'],
    countries: ['NG'],
    // Both marked false until Moniepoint confirms them. Claiming a capability we
    // have not verified would let the batch design assume a guarantee that does
    // not exist.
    webhook: false,
    bulkTransfer: false,
    nameEnquiry: false,
  },

  /**
   * Correctness boundary, not a preference: a naira balance settles through a
   * Nigerian rail. Returns false unconditionally while disabled, so no routing
   * accident can select it.
   */
  canHandle(ctx: { currency: string; country?: string }): boolean {
    if (!this.enabled) return false
    return ctx.currency === 'NGN' && (!ctx.country || ctx.country === 'NG')
  },

  async resolveAccount(_accountNumber: string, _bankCode: string) {
    // Real implementation: call Moniepoint's name-enquiry endpoint and return the
    // name the BANK holds. The caller compares it against what the seller typed —
    // a mismatch is a risk flag, not something to auto-correct.
    return notImplemented('resolveAccount')
  },

  async createRecipient(_account: BankAccountRef) {
    // Real implementation: register the destination, persist the returned code
    // against (provider, bankAccount). The code is provider-scoped and does not
    // survive a provider switch — raw bank details stay the source of truth.
    return notImplemented('createRecipient')
  },

  async transfer(_input: TransferInput) {
    // Real implementation MUST pass `_input.reference` (the Payout id) as the
    // provider's idempotency key, and MUST map an ambiguous/timeout response to
    // status 'processing' — never to 'failed'. Treating an unknown outcome as a
    // failure and retrying is how a seller gets paid twice.
    return notImplemented('transfer')
  },

  async parseTransferWebhook(
    _rawBody: string,
    _headers: Record<string, string | undefined>,
  ) {
    // Real implementation MUST verify the signature and THROW on an invalid one,
    // so the route rejects it. Returning null on a bad signature would let a
    // forged "transfer succeeded" event mark a payout settled.
    return notImplemented('parseTransferWebhook')
  },

  async getBalance(_currency: string) {
    // Real implementation: pre-flight for a batch. Nigerian settlement is T+1, so
    // an approved batch can legitimately exceed today's balance.
    return notImplemented('getBalance')
  },
}
