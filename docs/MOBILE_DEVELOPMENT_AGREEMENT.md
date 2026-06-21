# Mobile Application Development Agreement — MarketX

> **DRAFT FOR LEGAL REVIEW.** This is a working draft prepared to capture the
> commercial and technical terms discussed. It is **not legal advice** and is
> **not binding** until reviewed by a Nigerian-qualified legal practitioner and
> signed by both parties. Replace all `[BRACKETED]` fields. Terms marked
> *(negotiable)* are starting positions, not fixed demands.

---

## Parties

This Mobile Application Development Agreement (the **"Agreement"**) is made on
`[DATE]` (the **"Effective Date"**) between:

1. **`[CLIENT LEGAL NAME / INDICES TECH ENTITY]`**, of `[ADDRESS]`, represented by
   Joshua Akibu (`[TITLE]`) (the **"Client"**); and
2. **Samuel Odukoya**, of `[ADDRESS]` (the **"Developer"**).

each a **"Party"** and together the **"Parties."**

### Background

A. The Client owns and operates **MarketX**, a social-commerce platform with an
   existing backend API (the **"API"**) and web application.
B. The Developer is an independent software professional engaged to build the
   **MarketX mobile application** (Android and iOS, Flutter/Riverpod) (the **"App"**)
   that consumes the API.
C. The Parties wish to deliver the App as a **milestone-based MVP for closed
   testing**, on the terms set out below.

---

## 1. Definitions

- **"App"** — the MarketX mobile client for Android and iOS built under this Agreement.
- **"Milestone"** — a defined phase of work in **Schedule A**, each with deliverables
  and **Acceptance Criteria**.
- **"Deliverables"** — all source code, builds, configuration, and documentation
  produced under a Milestone.
- **"Acceptance Criteria"** — the written, agreed conditions in **Schedule A / C** a
  Milestone must meet to be accepted.
- **"Client Dependencies"** — items the Client must provide for the Developer to work,
  listed in **Schedule D** (including API readiness, designs, credentials, test data).
- **"Closed Testing"** — distribution to a limited set of internal/invited testers via
  Google Play internal testing and Apple TestFlight; **not** a public store release.
- **"Background IP"** — pre-existing IP a Party owns before, or develops outside,
  this Agreement (including open-source components and the API).
- **"Foreground IP"** — IP created by the Developer specifically in performing this
  Agreement.

---

## 2. Scope of work

2.1 The Developer will design, build, and deliver the App across the **four
Milestones** described in **Schedule A**, each to a practical v1 depth suitable for
Closed Testing.

2.2 **In scope:** the buyer and seller mobile experience across the MarketX feature
surface as detailed in Schedule A. **Out of scope:** admin tooling (web-only) and the
items listed in **Schedule E (Out of Scope / Phase 2)**, including public app-store
launch, store-compliance assets, and any backend/API development (which is the
Client's responsibility under Schedule D unless separately agreed in writing).

2.3 **Definition of "done" for this Agreement.** The engagement is complete when all
four Milestones are accepted and the App passes Closed Testing on both platforms.
Public store launch is expressly a separate, future phase (**Schedule E**).

---

## 3. Milestones, fees & payment

3.1 **Total fee:** **₦2,000,000** (Two Million Naira), payable in four equal Milestone
payments of **₦500,000** each, as set out in **Schedule B**.

3.2 **Payment trigger.** Each Milestone payment becomes due upon the Client's
**Acceptance** of that Milestone under clause 4. *(Negotiable: the Parties may agree a
split per Milestone — e.g. a kickoff portion on Milestone start and the balance on
Acceptance — recorded in Schedule B.)*

3.3 **Invoicing & timing.** The Developer will invoice on Acceptance. The Client will
pay within **`[7]` business days** of a valid invoice *(negotiable)* to the account in
Schedule B.

3.4 **Taxes.** Each Party bears its own taxes. The Developer is responsible for any
income tax, VAT, or statutory levy applicable to the fees. *(Confirm withholding-tax
treatment with the Client's accountant.)*

3.5 **Expenses.** The fee is inclusive. Pre-approved third-party costs (e.g. paid SDKs,
device-testing services) are reimbursable only if agreed in writing in advance.

3.6 **Late payment.** Undisputed invoices unpaid after `[14]` days may, on `[7]` days'
written notice, entitle the Developer to suspend work until paid, with timelines
extended accordingly. *(Negotiable.)*

---

## 4. Acceptance procedure

4.1 On completing a Milestone, the Developer delivers the build, source, and a short
release note describing what was delivered against the Acceptance Criteria.

4.2 The Client has a **review period of `[7] business days`** *(negotiable)* to test
against the Acceptance Criteria and either (a) accept in writing, or (b) reject in
writing with a specific, itemised list of failures against those criteria.

4.3 If the Client does not respond within the review period, the Milestone is **deemed
accepted.**

4.4 **Revisions.** For items that genuinely fail the agreed Acceptance Criteria, the
Developer will remedy them at no extra cost. The Parties allow up to **`[2]` revision
rounds** per Milestone for such failures, each with a reasonable agreed timeframe.

4.5 **Not a failure.** Requests for behaviour, scope, or design **not** in the agreed
Acceptance Criteria are **change requests** under clause 6, not Acceptance failures, and
do not block Acceptance or payment of the Milestone.

4.6 **Partial acceptance.** The Parties may agree in writing to accept a Milestone with
a minor item deferred (with a fix date), so payment is not held hostage to a small
defect.

---

## 5. Client dependencies & responsibilities (the "two tracks")

5.1 The App depends on a working backend. The Client is responsible, **at its own cost
and on its own track**, for delivering the **Client Dependencies in Schedule D** —
including required API endpoints, API documentation, designs, third-party credentials
(test mode), and test accounts/data — **before or in step with** the Milestone that
needs them.

5.2 **Known API-readiness gaps.** The Parties acknowledge the items flagged in the
Client's API Readiness Matrix (`docs/API_READINESS.md`), including **push
notifications (FCM/APNs), API versioning, the block-user endpoint, and confirmation of
PayPal and the AI-assistant endpoint.** For each, Schedule D records whether it is
**(a) Client-delivered before the relevant Milestone, (b) de-scoped, or (c) deferred to
Phase 2.** A feature dependent on an undelivered, in-scope Client Dependency is **not a
Developer Acceptance failure.**

5.3 **Client delay.** If the Client fails to deliver a Client Dependency on time, the
affected Milestone's timeline and (if applicable) the dependent feature's Acceptance are
**extended/relieved** to the extent of the delay, without penalty to the Developer.

5.4 The Client will provide timely feedback, a single primary point of contact
(`[NAME]`), and reasonable access to systems needed for the work.

---

## 6. Change management

6.1 Either Party may request a change to scope, the API contract, designs, or a
Milestone's Acceptance Criteria.

6.2 Changes are handled by a written **Change Request** describing the change and its
impact on **scope, fee, and timeline.** No change is binding until both Parties sign it.

6.3 **API/contract changes.** If the API contract changes during development, the Parties
will review the affected work together and agree, in writing, the rework, cost, and
schedule impact before it proceeds. Rework caused by a Client-side API change that
invalidates already-accepted work is chargeable as agreed in the Change Request.

---

## 7. Timeline

7.1 Indicative schedule (to be confirmed in **Schedule B**):
`[Milestone 1: weeks 1–X; Milestone 2: …; Milestone 3: …; Milestone 4: …]`.

7.2 Dates are good-faith estimates and adjust for Client delays (clause 5.3), agreed
Change Requests (clause 6), and Force Majeure (clause 16).

7.3 *(Optional / negotiable)* Sustained Developer delay beyond `[X]` days against an
agreed date, not caused by the Client or Force Majeure, entitles the Client to the
remedies in clause 13.

---

## 8. Intellectual property

8.1 **Foreground IP.** On **payment** of the relevant Milestone, the Developer
**irrevocably assigns** to the Client all right, title, and interest in the Foreground IP
delivered in that Milestone (including source code, build configuration, and design
assets created for the App). Until a Milestone is paid, its Foreground IP remains the
Developer's, and the Client has no licence to use it.

8.2 **Assistance.** The Developer will, on request and at the Client's reasonable cost,
execute documents needed to perfect or register the assigned IP.

8.3 **Background IP.** Each Party retains its Background IP. The Developer grants the
Client a perpetual, worldwide, royalty-free, non-exclusive licence to use any Developer
Background IP and third-party/open-source components embedded in the Deliverables to the
extent needed to use, operate, maintain, and further develop the App. The Developer will
not embed components whose licences would restrict the Client's ownership or operation of
the App, and will disclose all third-party/open-source components used.

8.4 **Moral rights** are waived to the extent permitted by law.

8.5 **Developer portfolio.** *(Negotiable)* The Developer may reference the engagement
and display non-confidential screenshots in a portfolio after public launch, unless the
Client objects in writing.

---

## 9. Source code, repositories & accounts

9.1 All App source code lives in a **Client-owned repository** (`[GitHub org/repo]`) from
the start. The Developer commits work there regularly (at least per Milestone, ideally
continuously) and does not retain the sole copy.

9.2 **Account ownership.** All store and third-party accounts are registered to and owned
by the **Client** — including the **Apple Developer account, Google Play Console,
Firebase/FCM, Paystack, PayPal**, and any analytics/crash-reporting accounts. The
Developer is granted only the access needed to perform the work, revocable on completion
or termination.

---

## 10. Confidentiality

10.1 Each Party will keep the other's non-public information confidential, use it only
for this Agreement, and protect it with reasonable care. This includes API internals,
business logic, credentials, user data, designs, and commercial terms.

10.2 Exclusions: information that is public (not via breach), independently developed, or
lawfully received from a third party.

10.3 Confidentiality survives termination for `[3] years` *(negotiable)*; trade secrets
and personal data are protected for as long as the law requires.

10.4 On termination the Developer will return or destroy Client confidential information
and credentials on request.

---

## 11. Data protection (NDPR / privacy)

11.1 The Developer will handle any personal data accessed during the engagement in
compliance with the **Nigeria Data Protection Act/Regulation (NDPR)** and applicable law,
only as needed for the work, and will not export, retain, or reuse it otherwise.

11.2 The Developer will use **test/staging data** for development wherever possible and
will not copy production personal data to local or personal devices.

11.3 The Developer will promptly notify the Client of any suspected data breach involving
Client data.

---

## 12. Warranty & defect remedy

12.1 The Developer warrants the Deliverables will **materially conform to the agreed
Acceptance Criteria** and be performed with reasonable skill and care.

12.2 **Defect period.** For **`[30] days`** *(negotiable)* after Acceptance of the final
Milestone, the Developer will fix, at no charge, reproducible defects where the App fails
to meet the agreed Acceptance Criteria. This covers **bug fixes, not new features or
changes**, and excludes faults caused by the API/backend, third-party services, Client
changes, or use outside the agreed environments.

12.3 Except as stated, the Deliverables are provided without other warranties to the
extent permitted by law.

---

## 13. Termination

13.1 **For convenience.** Either Party may terminate on `[14] days'` written notice
*(negotiable)*.

13.2 **For cause.** Either Party may terminate immediately if the other commits a
material breach not cured within `[14] days` of written notice, becomes insolvent, or is
unable to pay its debts.

13.3 **Effect of termination.**
   (a) The Client pays for all **accepted** Milestones, plus a **fair pro-rata amount**
       for work in progress on the current Milestone, assessed against work actually
       delivered.
   (b) On payment under (a), the Foreground IP for the paid work assigns to the Client
       per clause 8, and the Developer hands over all paid Deliverables, source, and
       access.
   (c) Each Party returns the other's confidential information and revokes access.

13.4 Clauses that by nature survive (IP for paid work, confidentiality, data protection,
liability, governing law) continue after termination.

---

## 14. Independent contractor

14.1 The Developer is an **independent contractor**, not an employee, partner, or agent
of the Client. Nothing creates an employment or partnership relationship. The Developer
controls the manner and means of performing the work, subject to the Deliverables and
Acceptance Criteria.

14.2 The Developer is responsible for its own tools, taxes, and statutory contributions.

---

## 15. Liability

15.1 Neither Party is liable for indirect, incidental, or consequential loss, or loss of
profit, data, or business, arising from this Agreement.

15.2 Except for (i) the Developer's IP-assignment and confidentiality obligations,
(ii) breach of data-protection obligations, and (iii) liability that cannot be excluded
by law, each Party's total aggregate liability is capped at the **total fees paid or
payable under this Agreement** (₦2,000,000). *(Negotiable.)*

---

## 16. General

16.1 **Non-solicitation** *(optional/negotiable)*. During the engagement and for
`[6] months` after, neither Party will solicit the other's named staff/contractors
involved in this work, except via general advertising.

16.2 **Force Majeure.** Neither Party is liable for delay caused by events beyond its
reasonable control; the affected Party will mitigate and notify.

16.3 **Assignment.** Neither Party may assign this Agreement without the other's written
consent, except the Client may assign to an affiliate or successor of the MarketX
business.

16.4 **Entire agreement.** This Agreement (with its Schedules) is the entire agreement and
supersedes prior discussions, including the Milestone proposal email of 19 June 2026.

16.5 **Amendments.** Only effective if in writing and signed by both Parties (a signed
Change Request suffices for scope/fee/timeline).

16.6 **Notices.** In writing to the email/addresses in the Parties section.

16.7 **Severability.** If any clause is unenforceable, the rest remains in force.

16.8 **No waiver.** Failure to enforce a right is not a waiver of it.

16.9 **Counterparts / e-signature.** May be signed in counterparts and electronically.

---

## 17. Governing law & disputes

17.1 This Agreement is governed by the laws of the **Federal Republic of Nigeria.**

17.2 The Parties will first try to resolve any dispute by good-faith negotiation between
their representatives. Failing resolution within `[21] days`, the dispute is referred to
**`[mediation / arbitration under the Arbitration and Mediation Act 2023, seated in
[Lagos], one arbitrator, in English]`** *(choose and confirm with counsel)*, or to the
courts of `[Lagos State]`.

---

## Signatures

| Client | Developer |
|---|---|
| Signature: ____________________ | Signature: ____________________ |
| Name: `[CLIENT SIGNATORY]` | Name: Samuel Odukoya |
| Title: `[TITLE]` | Title: Independent Contractor |
| Date: ____________ | Date: ____________ |

---

# Schedule A — Milestones, Deliverables & Acceptance Criteria

> Acceptance Criteria reference the API Readiness Matrix (`docs/API_READINESS.md`).
> Where a feature depends on a Client Dependency not yet delivered (Schedule D), that
> feature's criterion is conditional on delivery and is not a Developer failure.

### Milestone 1 — Foundation, auth & app architecture — ₦500,000

**Deliverables:** project setup and architecture; navigation; API client with session
handling and token refresh (header/body transport); register, login, email verification,
password reset, checkout OTP, OAuth (where available); profile & settings foundation;
app-wide loading/empty/error states.

**Acceptance Criteria (illustrative — finalise before start):**
- A tester can register, verify email, log in, refresh an expired session without
  re-login, reset a password, and log out, against staging.
- App-wide error/empty/loading states render for failed/empty/loading requests.
- Architecture (navigation, API client, state) documented in the repo README.
- Builds run on Android and iOS debug.
- *Conditional:* native OAuth depends on Client confirming the PKCE approach (Schedule D).

### Milestone 2 — Marketplace, discovery & seller storefronts — ₦500,000

**Deliverables:** home/discovery; product catalog & detail; category browse; search
(products/stores/posts/tags); seller storefront; curated rails (deals, fresh drops,
featured, pre-loved); seller suite foundation (store creation/profile, dashboard,
product CRUD/inventory, seller order management, analytics summary, store wall &
shoutouts).

**Acceptance Criteria (illustrative):**
- Browse home/discovery, open product detail, browse categories, run search.
- View a seller storefront and its products and rails.
- As a seller: create/edit a store, CRUD a product, view incoming orders, view the
  analytics summary, post a wall shoutout.
- *Conditional:* analytics-summary depth subject to Client confirming the payload
  (Schedule D).

### Milestone 3 — Commerce, checkout, shipping & money — ₦500,000

**Deliverables:** cart & checkout; saved addresses; Paystack, PayPal, and
Pay-on-Delivery/escrow; orders, order detail, tracking, reviews; shipping quotes &
tracking timeline; buyer/seller wallet views, transactions, withdrawals/payouts, bank
accounts; affiliate (enroll, referrals, commissions, promote).

**Acceptance Criteria (illustrative):**
- Add to cart, checkout, and pay via **Paystack (test)** and **POD/escrow** end-to-end.
- Place, view, and track an order; leave a review.
- View wallet balances and transactions; request a withdrawal; manage a bank account.
- Enroll in and view affiliate referrals/commissions.
- *Conditional:* **PayPal** included only if Client confirms it is production-functional;
  otherwise de-scoped to Paystack + POD (Schedule D/E).

### Milestone 4 — Social, community, messaging, AI, maps, QA — ₦500,000

**Deliverables:** social & following feed; posts (text/image/video, likes, comments,
shares, mentions, hashtags, visibility); reels; stories (24h); follow/unfollow,
followers/following, suggestions, saved/liked; squares (browse, feed, join,
announcements, buyer-request→offer); real-time messaging (buyer↔buyer, buyer↔store,
inbox, unread); **in-app** notifications; **push** notifications *(conditional)*; Dasah
AI assistant *(conditional)*; map-based seller discovery; final QA and Closed Testing
build preparation + handover notes.

**Acceptance Criteria (illustrative):**
- Use the feed, post all media types, like/comment/share/mention; view reels & stories.
- Follow/unfollow; browse and join squares; run the buyer-request→offer flow.
- Real-time chat buyer↔buyer and buyer↔store with inbox and unread state.
- Receive **in-app** notifications for orders/mentions/follows/squares/messages.
- Map seller discovery with location/category/distance filters.
- Final QA pass; signed Android (Play internal) and iOS (TestFlight) Closed-Testing
  builds; handover notes delivered.
- *Conditional:* **push notifications** depend on the Client delivering the FCM/APNs
  backend; **Dasah assistant** depends on the Client confirming the conversational
  endpoint (Schedule D). If undelivered, these are deferred to Phase 2 (Schedule E)
  without affecting Milestone Acceptance.

---

# Schedule B — Payment Schedule & Timeline

| Milestone | Fee | Trigger | Target window |
|---|---|---|---|
| M1 — Foundation & Auth | ₦500,000 | On Acceptance | `[wks 1–X]` |
| M2 — Marketplace & Seller | ₦500,000 | On Acceptance | `[…]` |
| M3 — Commerce & Money | ₦500,000 | On Acceptance | `[…]` |
| M4 — Social, AI, Maps, QA | ₦500,000 | On Acceptance | `[…]` |
| **Total** | **₦2,000,000** | | |

**Payment account:** `[BANK NAME / ACCOUNT NAME / ACCOUNT NUMBER]`.
*(Optional split per Milestone, if agreed: `[e.g. 30% on start / 70% on Acceptance]`.)*

---

# Schedule C — General Acceptance Standards

Applies to every Milestone in addition to its specific criteria:
- Runs on supported Android and iOS versions: `[define min versions]`.
- No crashes in the core flows of the Milestone during the review.
- Meets the agreed designs/UI patterns to a reasonable v1 fidelity.
- Code committed to the Client repo; build instructions current.
- Known issues listed in the release note.

---

# Schedule D — Client Dependencies (the Client's track)

The Client will provide, before/in step with the relevant Milestone:

| Dependency | For | Status / decision |
|---|---|---|
| Staging API base URL + docs (`API_STRUCTURE.md`, `MOBILE_INTEGRATION.md`, `openapi.json`) | All | ✅ provided (`https://marketx.indicestech.com/api`) |
| Test accounts (buyer, seller) + seed data | All | `[provide]` |
| Designs / UI source of truth (Figma) | All | `[provide]` |
| Paystack **test** keys | M3 | `[provide]` |
| **API versioning** scheme | M1+ | `[decide: in scope / N/A]` |
| **Native OAuth (PKCE)** approach + provider credentials | M1 | `[confirm]` |
| **Seller analytics** payload confirmation | M2 | `[confirm]` |
| **PayPal** production-functional confirmation | M3 | `[confirm or de-scope]` |
| **Push notifications** FCM/APNs backend (device-token registration + sender) | M1/M4 | `[in scope / deferred to Phase 2]` |
| **Dasah AI** conversational endpoint | M4 | `[confirm or defer]` |
| **Block-user** endpoint | M4 / Phase 2 | `[in scope / Phase 2]` |

For each `[decide/confirm]` row the Parties will record **in scope / de-scoped /
deferred to Phase 2** before the relevant Milestone begins.

---

# Schedule E — Out of Scope / Phase 2

The following are **not** part of this Agreement and, if required, are a separate
engagement:
- **Public app-store launch** and store-listing assets (privacy-policy URL, app-privacy
  labels, age rating, screenshots, marketing).
- **Store-compliance features** beyond Closed Testing — notably **user blocking**
  (required by Apple/Google for UGC apps), and any moderation UI beyond reporting.
- **Crash reporting / analytics SDK** integration (unless added by Change Request).
- **Deep links / universal links**, localization (i18n) beyond English, and accessibility
  hardening — unless added by Change Request.
- **Backend/API development**, which is the Client's responsibility (Schedule D).
- **Ongoing maintenance/support** after the defect period (clause 12), and the
  **Mobile Lead/CTO** arrangement (to be discussed separately).
