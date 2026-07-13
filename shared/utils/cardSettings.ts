/**
 * MarketX Card settings — owner-controlled visibility toggles for the card.
 * These are ONLY display switches: the actual values come from the store's
 * existing fields (store_phone, store_location, store_email), so there is a
 * single source of truth and nothing is re-collected.
 */
export interface CardSettings {
  showRating?: boolean
  showFollowers?: boolean
  showProducts?: boolean
  showDescription?: boolean
  showPhone?: boolean
  showEmail?: boolean
  showAddress?: boolean
}

export const DEFAULT_CARD_SETTINGS: CardSettings = {
  showRating: true,
  showFollowers: true,
  showProducts: true,
  showDescription: true,
  showPhone: false,
  showEmail: false,
  showAddress: false,
}

/** Merge stored toggles over the defaults. */
export function resolveCardSettings(raw: unknown): CardSettings {
  return { ...DEFAULT_CARD_SETTINGS, ...((raw ?? {}) as CardSettings) }
}
