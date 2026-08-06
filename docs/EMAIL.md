# Email

Two systems share `marketx.africa`. They never overlap, and confusing them is how
mail goes missing.

| | Resend | Private Email (Namecheap) |
|---|---|---|
| Direction | **Outbound only** | **Inbound only** |
| Sends | Everything the app generates | Human mail you type |
| Needs a mailbox? | **No** — signs with domain DKIM | **Yes** — mailbox or alias |
| Configured in | `RESEND_API_KEY`, `SENDER_EMAIL` | Namecheap dashboard |

The consequence that drives the whole design: **a Resend From address can send
without existing.** `notifications@marketx.africa` would deliver fine even if no
mailbox were behind it — but every reply would hard-bounce. So every outbound
email carries a `Reply-To` pointing at a real Private Email inbox.

## Address map

**Send-only (Resend).** No mailbox required.

| Address | Use |
|---|---|
| `notifications@` | `SENDER_EMAIL` — From on every transactional email |

**Inbound (Private Email).** Each must exist as a mailbox or alias.

| Address | Use | Signature |
|---|---|---|
| `joshua.akibu@` | Personal | Full |
| `team@` | Internal / shared, Reply-To on welcome mail | Full |
| `support@` | Reply-To on support tickets and most transactional mail | Full |
| `dispute@` | Reply-To on dispute tickets | Full |
| `info@` | Public enquiries, press, partnerships | Full |
| `privacy@` | Privacy policy + Meta data-deletion contact | Compact |
| `legal@` | Terms of service contact | Compact |

Signature templates live in [docs/brand/email-signature/](brand/email-signature/).

> **`privacy@` and `legal@` do not exist yet.** They are referenced by
> [brand.ts](../layers/core/app/utils/brand.ts) and defaulted in
> [nuxt.config.ts](../nuxt.config.ts), and `privacy@` is the contact on the Meta
> data-deletion flow. Create both as aliases forwarding to `team@`.

## Reply-To routing

Set in [server/utils/email/addresses.ts](../server/utils/email/addresses.ts) —
one file controls all of it.

| Email type | Reply-To |
|---|---|
| `VERIFICATION` | `support@` |
| `PASSWORD_RESET` | `support@` |
| `WELCOME` | `team@` |
| `ORDER_CONFIRMATION` | `support@` |
| `GENERAL` | `support@` |
| Support ticket (`type: SUPPORT`) | `support@` |
| Support ticket (`type: DISPUTE`) | `dispute@` |

Callers may pass an explicit `replyTo` on the job, which always wins. That's how
[support.service.ts](../layers/support/server/services/support.service.ts) splits
disputes from ordinary tickets.

## DNS

DNS for `marketx.africa` is on **Namecheap BasicDNS** (nameservers
`pdns1/pdns2.registrar-servers.com`). Records live at
**Domain List → marketx.africa → Manage → Advanced DNS**, not in this repo.

**Add the domain in Resend first** (Domains → Add Domain), then copy the records
it displays. Resend routes its return-path through a `send.` subdomain, so the
records are normally:

| Type | Host | Purpose |
|---|---|---|
| `MX` | `send` | Bounce and complaint handling |
| `TXT` | `send` | `v=spf1 include:amazonses.com ~all` |
| `TXT` | `resend._domainkey` | DKIM signing key |

**Two things this means:**

- **Do not touch the root SPF record.** Resend's SPF sits on `send.marketx.africa`,
  so `@` keeps `v=spf1 include:spf.privateemail.com ~all` untouched and there is
  no collision. *If* the dashboard instead asks for a TXT on host `@`, then you
  must **edit** the existing record to hold both includes — never add a second
  SPF TXT, because two records make receivers return `permerror` and
  authentication fails for Private Email and Resend at once.
- **The `MX` on host `send` does not affect inbound mail.** The root MX still
  points at `mx1/mx2.privateemail.com`, and that is what receives everything.

Namecheap's Host field takes the bare subdomain: enter `send`, not
`send.marketx.africa`.

**DKIM — no collision.** The two systems use different selectors:

- Private Email: `default._domainkey`
- Resend: `resend._domainkey` (value from the Resend dashboard)

**DMARC — add it, start soft:**

```
Type: TXT   Host: _dmarc
v=DMARC1; p=none; rua=mailto:dmarc@marketx.africa; pct=100
```

Start at `p=none` so nothing is rejected while you watch the reports. Move to
`p=quarantine` and then `p=reject` only after reports show both Private Email and
Resend passing. Tightening DMARC before Resend's DKIM verifies is the fastest way
to send every order confirmation to spam. If you use the `rua` address above,
create `dmarc@` as an alias first.

## Setup checklist

1. Verify `marketx.africa` in the Resend dashboard.
2. Add every record Resend displays, verbatim (normally `MX` + `TXT` on host
   `send`, and the DKIM `TXT` on `resend._domainkey`). Leave the root SPF alone
   unless Resend explicitly asks for a record on host `@`.
3. Add the DMARC record at `p=none`.
4. Create the missing aliases: `privacy@`, `legal@` (and `dmarc@` if using `rua`).
5. Set `SENDER_EMAIL`, `SUPPORT_EMAIL`, `DISPUTE_EMAIL`, `TEAM_EMAIL`,
   `INFO_EMAIL` in the deploy environment.
6. Trigger one email per type and confirm it lands in the inbox, not spam, and
   that hitting Reply targets the right address.

## Notes

- **Volume.** If MarketX later sends bulk marketing, move that traffic to a
  subdomain (`send.marketx.africa`) with its own DKIM so a bad campaign can't
  damage the deliverability of order confirmations. Transactional volume on the
  root domain is fine and keeps the From address recognisable.
- **Templates.** Transactional email HTML in
  [emailService.ts](../server/utils/email/emailService.ts) still uses Arial and
  `#e31837`, neither of which is a brand value. Aligning it with the design
  system tokens is unrelated to this wiring but worth doing.
