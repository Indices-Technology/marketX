import sanitizeHtmlLib from 'sanitize-html'

/**
 * Shared HTML sanitizer for seller-authored product descriptions.
 *
 * Replaces the previous DOMPurify/isomorphic-dompurify implementation, which
 * spun up jsdom on the server and crashed the serverless bundle on Node <20.19
 * (jsdom@28's ESM-only deps couldn't be require()'d). sanitize-html is pure JS
 * (htmlparser2) with no DOM dependency, so it runs identically on the server
 * (write path + SSR) and in the browser — SSR output matches client output, so
 * v-html stays sanitized with no hydration mismatch.
 *
 * The allowlist mirrors the rich-but-safe subset DOMPurify permitted for
 * descriptions, minus anything that can execute script (no <script>, <style>,
 * <iframe>, event handlers, or javascript:/data: URLs).
 */
const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'span', 'div',
    'b', 'strong', 'i', 'em', 'u', 's', 'small', 'mark', 'sub', 'sup',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class'],
  },
  // Links: http(s)/mailto/tel only. Images: http(s) only (blocks data: SVG XSS).
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  // Harden any new-tab links against reverse-tabnabbing / referrer leakage.
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform(
      'a',
      { rel: 'noopener noreferrer nofollow' },
      true,
    ),
  },
}

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return sanitizeHtmlLib(dirty, OPTIONS)
}
