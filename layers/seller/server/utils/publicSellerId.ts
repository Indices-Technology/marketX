/**
 * Public seller ID — the immutable, human-friendly identity for the Share
 * Identity System. Assigned once at store creation and never changed; printed
 * on cards, QR, invoices, receipts, and searchable.
 *
 * Format:  MX-<STATE>-<code>   e.g.  MX-LAG-J8KP
 *          MX-<code>           when the state is unknown
 *
 * Deliberately NOT derived from anything mutable (phone, store name), so it
 * stays correct forever. The <code> uses an unambiguous alphabet (no 0/O/1/I)
 * and is collision-checked at assignment time.
 */

// Nigerian state → 3-letter code. Anything unmapped falls back to the first
// letters of the state name, so new/renamed states still yield a prefix.
const STATE_CODES: Record<string, string> = {
  abia: 'ABI',
  adamawa: 'ADA',
  'akwa ibom': 'AKW',
  anambra: 'ANA',
  bauchi: 'BAU',
  bayelsa: 'BAY',
  benue: 'BEN',
  borno: 'BOR',
  'cross river': 'CRO',
  delta: 'DEL',
  ebonyi: 'EBO',
  edo: 'EDO',
  ekiti: 'EKI',
  enugu: 'ENU',
  gombe: 'GOM',
  imo: 'IMO',
  jigawa: 'JIG',
  kaduna: 'KAD',
  kano: 'KAN',
  katsina: 'KAT',
  kebbi: 'KEB',
  kogi: 'KOG',
  kwara: 'KWA',
  lagos: 'LAG',
  nasarawa: 'NAS',
  niger: 'NIG',
  ogun: 'OGU',
  ondo: 'OND',
  osun: 'OSU',
  oyo: 'OYO',
  plateau: 'PLA',
  rivers: 'RIV',
  sokoto: 'SOK',
  taraba: 'TAR',
  yobe: 'YOB',
  zamfara: 'ZAM',
  fct: 'ABJ',
  abuja: 'ABJ',
  'federal capital territory': 'ABJ',
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1

function randomCode(len: number): string {
  let s = ''
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return s
}

/**
 * Collapse a public seller ID to bare, upper-cased alphanumerics for
 * separator-insensitive lookup: "mx-pla-vdkr", "MX PLA VDKR" and "mxplavdkr"
 * all normalize to "MXPLAVDKR". Used for both the stored shadow column and the
 * incoming search query, so any way a customer types the ID off a card matches.
 */
export function normalizePublicId(input?: string | null): string {
  return (input ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase()
}

/** 3-letter region code for a Nigerian state (empty string when unknown). */
export function stateCode(state?: string | null): string {
  if (!state) return ''
  const key = state.trim().toLowerCase().replace(/\s+state$/, '')
  if (STATE_CODES[key]) return STATE_CODES[key]
  const letters = key.replace(/[^a-z]/g, '')
  return letters ? letters.slice(0, 3).toUpperCase() : ''
}

/** One candidate ID (not uniqueness-checked). */
export function makePublicSellerId(state?: string | null, codeLen = 4): string {
  const sc = stateCode(state)
  return sc ? `MX-${sc}-${randomCode(codeLen)}` : `MX-${randomCode(codeLen)}`
}

/**
 * Generate a unique public seller ID. `taken(id)` must resolve true when the id
 * already exists; widens the random part after repeated collisions.
 */
export async function generatePublicSellerId(
  state: string | null | undefined,
  taken: (id: string) => Promise<boolean>,
): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const id = makePublicSellerId(state, i < 8 ? 4 : 5)
    if (!(await taken(id))) return id
  }
  return makePublicSellerId(state, 7) // vanishingly unlikely to collide
}
