/**
 * Content guard — detects and masks contact information in free-text that
 * users post to each other (square request notes, seller offer messages).
 *
 * The threat: a seller responds to a buyer request with "WhatsApp me 0801..."
 * and the deal leaves the platform. We can't stop two humans who insist on it,
 * but we strip the easy off-ramps: phone numbers, messaging-app handles, bank
 * account numbers, and emails are masked before the text is persisted, and the
 * attempt is logged for abuse monitoring.
 *
 * Policy (v1): mask + allow + log — never hard-block (see SECURITY.md).
 */

const PLACEHOLDER = '[hidden]'

// Each pattern is global + case-insensitive. Order matters only for overlap;
// phone/account first so they aren't half-consumed by looser patterns.
const PATTERNS: Array<{ label: string; re: RegExp }> = [
  // Email
  {
    label: 'email',
    re: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
  },
  // Messaging-app handles / "contact me off-platform" phrases + wa.me/t.me links
  {
    label: 'offplatform',
    re: /\b(?:whats\s?app|wa\.me|t\.me|telegram|tele\s?gram|snapchat|snap\s?chat|instagram|ig\s*[:@]|dm\s+me|call\s+me|text\s+me|reach\s+me\s+on)\b\S*/gi,
  },
  // Phone numbers — Nigerian (0801..., +234801...) and generic 10–14 digit runs
  // tolerant of spaces, dashes, dots, and parentheses between digits.
  {
    label: 'phone',
    re: /(?:\+?234|0)[\s.\-()]*(?:\d[\s.\-()]*){9,12}\d/g,
  },
  // Bank account numbers — a 10-digit run near a bank keyword
  {
    label: 'account',
    re: /\b(?:acc(?:ount)?|gtb|gtbank|access|zenith|uba|first\s?bank|opay|moniepoint|kuda|palmpay|wema|fidelity)\b[^.\n]{0,20}?\b\d{10}\b/gi,
  },
]

export interface ContactScanResult {
  clean: boolean
  matches: string[]
}

/**
 * Scan text for contact-info leakage. Returns whether it is clean and the raw
 * matched fragments (for logging — never shown to users).
 */
export function scanForContact(
  text: string | null | undefined,
): ContactScanResult {
  if (!text) return { clean: true, matches: [] }
  const matches: string[] = []
  for (const { re } of PATTERNS) {
    re.lastIndex = 0
    const found = text.match(re)
    if (found) matches.push(...found)
  }
  return { clean: matches.length === 0, matches }
}

/**
 * Replace any detected contact info with a `[hidden]` placeholder. Safe to
 * persist + display.
 */
export function maskContact(text: string | null | undefined): string {
  if (!text) return ''
  let out = text
  for (const { re } of PATTERNS) {
    re.lastIndex = 0
    out = out.replace(re, PLACEHOLDER)
  }
  return out
}
