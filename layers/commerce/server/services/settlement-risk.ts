/**
 * Risk rules for a proposed payout.
 *
 * WHY RULES AND NOT A MODEL
 *
 * Every signal here is deterministic, and deterministic is what this job needs:
 * auditable, testable, cheap, and identical on every run. When a seller asks why
 * their ₦400,000 was held, the answer has to be a rule you can point at — not a
 * model's opinion. A language model earns its place later, summarising a flagged
 * case for the reviewer, but it must never be what decides.
 *
 * WHAT A FLAG MEANS
 *
 * A flag is "a human should look", never "this is fraud". Flagged items default
 * to excluded from a batch, so the safe outcome of any uncertainty is a delayed
 * payout rather than a wrong one. The reviewer opts them back in.
 *
 * THE DESIGN TARGET
 *
 * A batch where nothing is flagged should be approvable in about five seconds.
 * If routine payouts keep getting flagged, the thresholds are wrong and the
 * reviewer will start clicking through without reading — which is worse than no
 * review at all, because it manufactures false assurance.
 */

/** Stable codes. Stored on the batch item, so renaming one is a migration. */
export type RiskFlag =
  /** No payout has ever completed for this payee. */
  | 'FIRST_PAYOUT'
  /** Destination account was added very recently — classic takeover shape. */
  | 'BANK_CHANGED_RECENTLY'
  /** Payee has money frozen by an open dispute. */
  | 'OPEN_DISPUTE'
  /** A dispute claimed more than could be frozen: an unsecured shortfall. */
  | 'UNSECURED_CLAIM'
  /** Absolute size — above the review threshold. */
  | 'LARGE_AMOUNT'
  /** Far above this payee's own history. */
  | 'ABOVE_TYPICAL'
  /** Seller has no established trust tier yet. */
  | 'NO_TRUST_TIER'
  /** Payee has no bank account on file at all — cannot be paid. */
  | 'NO_BANK_ACCOUNT'

export interface RiskInput {
  amountGross: number
  /** Completed payouts for this payee, most recent first, in minor units. */
  priorPayoutAmounts: number[]
  /** Newest destination account age in hours; null when none exists. */
  newestBankAccountAgeHours: number | null
  hasActiveHold: boolean
  /** Any hold that secured less than it claimed. */
  hasUnsecuredClaim: boolean
  /** Null for buyer/affiliate payees, who have no seller trust tier. */
  trustTier: string | null
  isSellerPayee: boolean
}

export interface RiskAssessment {
  flags: RiskFlag[]
  /** Higher is riskier. Ordering aid for the reviewer, not a decision. */
  score: number
  /** True when this item should default to excluded. */
  shouldExclude: boolean
}

/** Weights are ordering hints, not probabilities. Deliberately coarse. */
const WEIGHTS: Record<RiskFlag, number> = {
  NO_BANK_ACCOUNT: 100,
  BANK_CHANGED_RECENTLY: 40,
  OPEN_DISPUTE: 35,
  UNSECURED_CLAIM: 30,
  FIRST_PAYOUT: 20,
  ABOVE_TYPICAL: 20,
  LARGE_AMOUNT: 15,
  NO_TRUST_TIER: 10,
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  const n = raw == null ? NaN : parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** ₦200,000 in kobo. Above this, a person looks. */
export const DEFAULT_LARGE_AMOUNT_KOBO = 20_000_000
/** A payout this many times the payee's median is out of character. */
export const DEFAULT_TYPICAL_MULTIPLE = 4
/** A destination account younger than this is unproven. */
export const DEFAULT_BANK_AGE_HOURS = 72

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

export function assessPayoutRisk(input: RiskInput): RiskAssessment {
  const flags: RiskFlag[] = []

  const largeAmount = envInt('SETTLEMENT_LARGE_AMOUNT_KOBO', DEFAULT_LARGE_AMOUNT_KOBO)
  const typicalMultiple = envInt('SETTLEMENT_TYPICAL_MULTIPLE', DEFAULT_TYPICAL_MULTIPLE)
  const bankAgeHours = envInt('SETTLEMENT_BANK_AGE_HOURS', DEFAULT_BANK_AGE_HOURS)

  // Cannot be paid at all. Worth surfacing loudly rather than failing at
  // execution, where it looks like a provider problem.
  if (input.newestBankAccountAgeHours === null) {
    flags.push('NO_BANK_ACCOUNT')
  } else if (input.newestBankAccountAgeHours < bankAgeHours) {
    // Account-takeover shape: change the destination, then withdraw. The age
    // check is cheap and catches the version of this that isn't patient.
    flags.push('BANK_CHANGED_RECENTLY')
  }

  if (input.hasActiveHold) flags.push('OPEN_DISPUTE')
  if (input.hasUnsecuredClaim) flags.push('UNSECURED_CLAIM')
  if (!input.priorPayoutAmounts.length) flags.push('FIRST_PAYOUT')
  if (input.amountGross > largeAmount) flags.push('LARGE_AMOUNT')

  // Only meaningful against a real history. Two prior payouts is not a pattern,
  // and flagging against one would fire on almost every second payout.
  const typical = median(input.priorPayoutAmounts)
  if (
    typical !== null &&
    input.priorPayoutAmounts.length >= 3 &&
    input.amountGross > typical * typicalMultiple
  ) {
    flags.push('ABOVE_TYPICAL')
  }

  // Buyers/affiliates have no seller trust tier; absence there is normal, not a
  // signal, and flagging it would put every affiliate payout in front of a human.
  if (input.isSellerPayee && !input.trustTier) flags.push('NO_TRUST_TIER')

  const score = flags.reduce((sum, f) => sum + WEIGHTS[f], 0)

  return {
    flags,
    score,
    // Any flag means a human decides. The cost of being wrong in this direction
    // is a delayed payout; the other direction sends money that shouldn't move.
    shouldExclude: flags.length > 0,
  }
}
