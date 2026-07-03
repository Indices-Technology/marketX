/**
 * BYOP — seller self-delivers and collects the cash themselves. GATED
 * (enabled: false): seller-collect is an unprotected "Local delivery" tier, not
 * platform-guaranteed POD (the seller holds the money), and its failed-attempt
 * proof flow (buyer-confirm / dispute-window) isn't wired yet. Registered so the
 * abstraction is typed and exercised; flip `enabled` once we're satisfied.
 */

import type { IPodProvider, PodBookingResult } from '../utils/types'

export const byopPodProvider: IPodProvider = {
  id: 'byop',
  name: 'Seller delivery (Local)',
  enabled: false,
  capabilities: { collectsCash: true, remits: false, trustedAttestation: false },

  canHandle: () => false, // gated — never selected until the proof flow is ready

  async book(): Promise<PodBookingResult> {
    throw new Error('BYOP POD is not enabled yet')
  },

  parseOutcome: () => null,
  parseRemittance: () => null,
}
