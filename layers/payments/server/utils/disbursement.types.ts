/**
 * Disbursement provider abstraction — money OUT.
 *
 * Deliberately separate from IPaymentProvider, which is collection-only
 * (initialize / verify / parseWebhook). Collection is multi-provider by design;
 * disbursement is not the same shape and must not be bolted onto it:
 *
 *  - Money is collected by whichever PSP the buyer chose, but it all settles into
 *    ONE account per currency. Paying out through a PSP would mean sweeping funds
 *    back to that PSP first — an extra hop, extra latency, extra reconciliation.
 *  - A disbursement provider needs operations collection has no concept of:
 *    resolving an account name, registering a recipient, checking a balance
 *    before sending, and reacting to a transfer that succeeded then reversed.
 *
 * Routing mirrors the collection registry: one provider per currency/corridor.
 * NGN settles through a Nigerian rail; KES would settle through a Kenyan one.
 * A naira balance can never be paid out through a Kenyan provider, so
 * `canHandle` is a correctness boundary, not a preference.
 *
 * All amounts are MINOR units (kobo for NGN, cents, …), matching the payment
 * side and the ledger.
 */

export type TransferStatus =
  /** Accepted by the provider; final outcome not yet known. */
  | 'processing'
  /** Provider confirmed the money reached the destination. */
  | 'success'
  /** Provider rejected it; nothing left the account. */
  | 'failed'
  /** Succeeded, then bounced back. Funds must be returned to the wallet. */
  | 'reversed'

export interface BankAccountRef {
  /** NUBAN or local equivalent. */
  accountNumber: string
  /** Provider/clearing code for the destination bank. */
  bankCode: string
  /** Name as held by the seller — verified against `resolveAccount`, not trusted. */
  accountName: string
}

export interface ResolvedAccount {
  accountNumber: string
  bankCode: string
  /** The name the BANK holds. Compare against what the user typed. */
  accountName: string
}

export interface RecipientResult {
  /**
   * Provider-scoped identifier. NOT portable: switching providers means
   * re-registering every recipient, which is why the raw bank details remain the
   * source of truth and this is treated as a cache.
   */
  recipientCode: string
  providerId: string
}

export interface TransferInput {
  /**
   * Idempotency key. MUST be the Payout row's id, so a retry after a timeout is
   * recognised by the provider as the same instruction rather than a second one.
   * Without this, a network failure mid-transfer pays the seller twice.
   */
  reference: string
  recipientCode: string
  amountMinor: number
  currency: string
  narration?: string
}

export interface TransferResult {
  reference: string
  status: TransferStatus
  /** Provider's own id for the transfer, for support queries and reconciliation. */
  providerRef?: string
  providerId: string
  raw?: unknown
}

export interface TransferWebhookResult {
  reference: string
  status: TransferStatus
  providerRef?: string
  providerId: string
  eventType: string
}

export interface BalanceResult {
  availableMinor: number
  currency: string
}

export interface DisbursementCapabilities {
  currencies: string[]
  countries: string[]
  /** False means transfer outcomes must be polled rather than pushed. */
  webhook: boolean
  /** False means each transfer is a separate request. */
  bulkTransfer: boolean
  /** False means account names cannot be verified before sending. */
  nameEnquiry: boolean
}

export interface IDisbursementProvider {
  id: string
  name: string
  /**
   * When false the provider is registered for typing and routing tests but is
   * NEVER selected. Same gating pattern as the collection stubs.
   */
  enabled: boolean
  capabilities: DisbursementCapabilities
  canHandle(ctx: { currency: string; country?: string }): boolean

  /** Ask the bank what name holds this account, before trusting user input. */
  resolveAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount>

  /** Register a destination and return the provider-scoped recipient code. */
  createRecipient(account: BankAccountRef): Promise<RecipientResult>

  /**
   * Send money. MUST be idempotent on `reference`.
   *
   * A `processing` result is not a failure and must not be retried as if the
   * money never left — that is the state a timeout produces.
   */
  transfer(input: TransferInput): Promise<TransferResult>

  /**
   * Verify the signature and parse a transfer webhook. Returns null for events
   * we ignore; MUST throw on an invalid signature so the endpoint can reject it.
   */
  parseTransferWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<TransferWebhookResult | null>

  /** Pre-flight check — a batch approved against an empty account will fail. */
  getBalance(currency: string): Promise<BalanceResult>
}
