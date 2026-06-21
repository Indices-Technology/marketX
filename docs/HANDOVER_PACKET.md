# MarketX Mobile — Engagement Document Packet

> The complete set of documents for the MarketX mobile build with Samuel Odukoya.
> Grouped by purpose: **(A)** to be signed, **(B)** technical reference shared with
> the Developer, **(C)** to finalise before signing.

---

## A. Documents to be signed / executed

| # | Document | Signed by | When | Status |
|---|---|---|---|---|
| 1 | **Mobile Application Development Agreement** (`MOBILE_DEVELOPMENT_AGREEMENT.md`) incl. Schedules A–E | Both Parties | Before work starts | ☐ Draft → lawyer review → sign |
| 2 | **Schedule D decisions** (in scope / de-scoped / Phase 2) — completed inside the Agreement | Both Parties | Before M1 | ☐ To finalise |
| 3 | **Milestone Acceptance Certificate** (`templates/MILESTONE_ACCEPTANCE.md`) | Both Parties | At each Milestone (×4) | ☐ Template ready |
| 4 | **Change Request** (`templates/CHANGE_REQUEST.md`) | Both Parties | As needed | ☐ Template ready |

**Notes on signing:**
- The Agreement **already includes** confidentiality (clause 10) and IP assignment
  (clause 8), so a standalone NDA / IP-assignment deed is **optional**. If you want the
  Developer bound **before** he receives full access, a short **mutual NDA can be signed
  first** — tell me and I'll draft one.
- Have a **Nigerian-qualified lawyer review the Agreement** before signature.

---

## B. Technical reference shared with the Developer (not signed)

| # | Document | Purpose | Status |
|---|---|---|---|
| 1 | `API_STRUCTURE.md` | Route map + auth levels | ✅ Ready |
| 2 | `MOBILE_INTEGRATION.md` | How to consume the API (auth, errors, realtime, base URL) | ✅ Ready |
| 3 | `openapi.json` + live `/_scalar?key=…` | Machine-readable contract for codegen (gated) | ✅ Ready (Auth fully specced; rest rolling out) |
| 4 | `API_READINESS.md` | Milestone-by-milestone readiness + v1 definition | ✅ Ready |
| 5 | `ARCHITECTURE.md` *(optional)* | Backend background | ✅ Available — trim secrets before sharing |

**Access to provide alongside the docs:**
- Staging base URL: `https://marketx.indicestech.com/api`
- Docs secret for `/_scalar` (share privately): `[STAGING OPENAPI_DOCS_SECRET]`
- Test accounts (buyer, seller) + seed data: `[provide]`
- Client GitHub repo invite (App lives here from day 1): `[repo]`
- Designs / Figma: `[link]`

> Do **not** share `SECURITY.md`, `.env`, or production credentials.

---

## C. To finalise before signing

| Item | Where | Decision |
|---|---|---|
| Bracketed facts (names, addresses, repo, bank, dates) | Agreement | `[fill]` |
| Schedule D rows: push / versioning / PayPal / Dasah / block-user / OAuth / analytics | Agreement Sched. D | `[in scope / de-scoped / Phase 2]` |
| Payment structure (on-acceptance vs split per Milestone) | Clause 3.2 / Sched. B | `[choose]` |
| Timeline windows per Milestone | Schedule B | `[set]` |
| Review window & revision rounds | Clauses 4.2 / 4.4 | `[default 7 days / 2 rounds]` |
| Dispute mechanism + venue | Clause 17.2 | `[arbitration/courts; Lagos]` |
| Optional split-payment, non-solicit, portfolio clauses | Various | `[keep / drop]` |

---

## Sequence

1. Finalise **C** (decisions + brackets) → 2. **Lawyer review** → 3. *(optional)* sign
**mutual NDA** → 4. Share **B** (docs + access) → 5. Sign **Agreement (A.1)** with
Schedule D completed → 6. Kick off **Milestone 1** → 7. Sign **Acceptance Certificate**
at each Milestone; use **Change Requests** for any scope change.
