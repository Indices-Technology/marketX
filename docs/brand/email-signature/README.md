# MarketX Email Signature

Brand-consistent email signature for the team. Built on the design system tokens in
[tailwind.config.ts](../../../tailwind.config.ts) and the `mx.` mark from
[BrandLogo.vue](../../../layers/ui/app/components/BrandLogo.vue).

## Files

| File | What it is |
|---|---|
| [builder.html](builder.html) | **Start here.** Open in a browser, type your details, click Copy. |
| [signature.html](signature.html) | Full variant — new emails / first contact. Raw template with `{{TOKEN}}` placeholders. |
| [signature-compact.html](signature-compact.html) | Compact variant — replies and threads. No image. |
| [signature.txt](signature.txt) | Plain-text fallback for clients with rich text disabled. |

## Quick start

Open `builder.html` (double-click it — no server needed), fill in the five fields, click
**Copy signature**, then paste into your mail client. If you'd rather edit the raw HTML,
replace these tokens in `signature.html`:

| Token | Example |
|---|---|
| `{{FULL_NAME}}` | Ada Okonkwo |
| `{{ROLE}}` | Head of Seller Growth |
| `{{EMAIL}}` | ada@marketx.africa |
| `{{PHONE}}` | +234 806 683 8217 |
| `{{PHONE_E164}}` | +2348066838217 — `tel:` link, no spaces |
| `{{WHATSAPP}}` | 2348066838217 — `wa.me/` path, no `+`, no spaces |

## Installing

**Gmail (web)** — Settings → See all settings → General → Signature → Create new. Paste with
`Ctrl+V` (not `Ctrl+Shift+V`, which strips formatting). Set the full variant for *new emails*
and the compact one for *reply/forward*. Save changes at the bottom of the page.

**Outlook (web)** — Settings → Mail → Compose and reply → Email signature. Same split:
full for new messages, compact for replies.

**Outlook (Windows desktop)** — File → Options → Mail → Signatures. Paste into the edit box.
Outlook re-renders through Word, so expect a pixel or two of drift on the divider; the layout
itself is Word-safe (tables, no flex, no border-radius that matters).

**Apple Mail (macOS)** — Mail → Settings → Signatures. Uncheck *Always match my default
message font* **before** pasting, or it will flatten the type.

**iOS Mail** — iOS strips rich signatures. Use `signature.txt`.

## Design decisions

- **`mx.` mark, 44px** — the same black plate / white `m` / coral dot lockup as the app.
  Served from `https://marketx.africa/icons/icon-180.png` (transparent rounded corners, so it
  sits cleanly on both light and dark mail backgrounds).
- **Coral appears exactly three times** — the rule under the name, the domain link, and the
  dot inside the mark. Per the style guide, brand red loses meaning past ~3 uses.
- **Trust strip, not a marketing line** — "Trade with trust · Escrow-protected payments"
  states what MarketX guarantees. It's the signature's trust signal, styled as an eyebrow in
  slate rather than coral so it supports the name instead of competing with it.
- **Archivo for the name, Manrope for everything else** — matching the app's display/body
  split. Neither is a system font, so most clients fall back to Segoe UI / Helvetica. That's
  expected and the layout is built for the fallback metrics.
- **No social icon row.** Icon strips are the first thing to break when images are blocked,
  and MarketX's own destinations (store, feed) live behind `marketx.africa` anyway.

## Constraints — read before editing

- **Tables and inline styles only.** No flex, no grid, no `<style>` block — mail clients strip
  head styles and most classes.
- **No SVG.** Gmail and Outlook both drop it. That's why the mark is a hosted PNG.
- **Every link needs an explicit `color:` and `text-decoration:`** or Gmail repaints it blue
  and Outlook underlines it.
- **Don't paste through Word or Google Docs.** They inject `mso-` junk and break the table.
- **Dark mode:** Gmail and Outlook.com force-invert signatures and you can't opt out from a
  pasted fragment. The palette is mid-contrast (slate text, no pure-white fills) so inversion
  degrades gracefully. Check with the *Dark background* toggle in `builder.html`.
- If the logo URL changes, update it in `signature.html` **and** in the `TPL_FULL` string
  inside `builder.html`.

## Optional additions

Some teams need a legal footer. If so, append this inside the identity `<td>`, after the trust
strip — keep it grey and small so it doesn't compete:

```html
<tr><td style="font-size:10px;line-height:14px;color:#CBD5E1;padding:10px 0 0 0;">
  This email and any attachments are confidential and intended solely for the addressee.
</td></tr>
```
