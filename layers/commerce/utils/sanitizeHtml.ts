import { FilterXSS } from 'xss'

/**
 * Shared HTML sanitizer for seller-authored product descriptions.
 *
 * Uses xss (js-xss) — a pure-CommonJS sanitizer with an all-CJS dependency tree
 * (commander, cssfilter). This matters because the Netlify Functions runtime
 * runs an older Node that cannot require() ES modules: DOMPurify pulled in jsdom
 * and sanitize-html pulled in htmlparser2, both ESM-only, and both crashed the
 * serverless bundle with ERR_REQUIRE_ESM. xss has no ESM (or DOM) dependency, so
 * it runs identically on the server (write path + SSR) and in the browser — SSR
 * output matches client output, so v-html stays sanitized with no hydration
 * mismatch and no runtime require(esm).
 *
 * The allowlist mirrors the rich-but-safe subset the previous sanitizers allowed
 * for descriptions, minus anything that can execute script. Non-whitelisted tags
 * are dropped (their text is kept); <script>/<style> are removed with their
 * contents. xss's default safeAttrValue neutralizes javascript:/vbscript: URLs.
 */
const filter = new FilterXSS({
  whiteList: {
    p: [], br: [], hr: [], span: ['class'], div: ['class'],
    b: [], strong: [], i: [], em: [], u: [], s: [], small: [], mark: [], sub: [], sup: [],
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
    ul: [], ol: [], li: [], blockquote: [], pre: [], code: [],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    table: [], thead: [], tbody: [], tfoot: [], tr: [], th: [], td: [],
  },
  stripIgnoreTag: true, // drop tags not in the allowlist, keeping their text
  stripIgnoreTagBody: ['script', 'style'], // and delete their contents entirely
})

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return filter.process(dirty)
}
