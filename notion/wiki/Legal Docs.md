# Legal Docs

> Read-only for all team members. Edits by CEO only.
> All documents governed under Nigerian law unless otherwise stated.

---

## Intellectual Property

**Owner:** Indices Technology Ltd
**Scope:** All code, design, copy, strategy, data, brand assets, and AI-generated output produced for or by MarketX

This applies to:
- All work produced during active engagement with the team
- Work produced outside contracted hours if it relates to MarketX's product or business
- Contributions from advisors, volunteers, fellows, and contractors

No team member may use MarketX intellectual property for personal or third-party projects. All IP remains with Indices Technology Ltd unless a separate written agreement signed by the CEO states otherwise.

---

## Non-Disclosure Agreement (NDA)

All team members, advisors, contractors, and fellows must sign an NDA before receiving access to any of the following:

- Codebase or system architecture
- Product roadmap or unreleased features
- Financial data or investor discussions
- User data or seller data
- AI system design or Dassa architecture

**NDA covers:**
- Confidentiality of all internal information during and after engagement
- Prohibition on using MarketX information to benefit a competitor
- Prohibition on disclosing user or seller data to any third party

**Status tracking:**

| Name | NDA Signed | Date | Format |
|---|---|---|---|
| Joshua Akibu | N/A — Founder | — | — |
| Mapida Ishaya | | | |
| Esther Abah | | | |
| Godson Gilam | | | |
| Ebenezer Fakiyesi | | | |
| Opeyemi Makinde | | | |
| Obed Malua | | | |
| Ikemdi Samuel | | | |
| Israel Eze | | | |

---

## Terms of Service

**Status:** Draft — not yet published
**Covers:** Buyer registration, seller onboarding, transaction terms, prohibited conduct, account suspension

_Full document to be completed before public launch._

Key provisions to include:
- MarketX is a platform — not a party to transactions between buyers and sellers
- Sellers are responsible for the accuracy of their listings
- MarketX reserves the right to remove any listing or account that violates platform rules
- Paystack processes payments — MarketX does not store card data
- Dispute resolution process between buyers and sellers

---

## Privacy Policy

**Status:** Draft — not yet published
**Covers:** Data collected, how it is used, how it is stored, user rights

_Full document to be completed before public launch._

Key provisions to include:
- Location data (GPS) is used only for map discovery — not stored permanently
- Seller location is stored only if the seller opts in and sets a map pin
- Conversation data (Dassa AI chat) is retained for session continuity only
- No user data is sold to third parties
- Users may request deletion of their account and associated data

---

## Contractor Agreements

Any external contractor (developer, designer, consultant) must sign a contract that includes:

1. Scope of work and deliverables
2. Payment terms
3. IP assignment — all work belongs to Indices Technology Ltd
4. Confidentiality clause (equivalent to NDA)
5. Termination conditions

**No contractor begins work without a signed agreement on file.**

---

## Data Handling Rules

| Data Type | Stored | Retention | Access |
|---|---|---|---|
| User accounts | Yes — PostgreSQL | Until deletion requested | CEO, Mapida (DB access) |
| Seller profiles + listings | Yes — PostgreSQL | Until account deleted | CEO, Mapida, Admin panel users |
| GPS / location | Session only (browser cache 1hr) | 1 hour | No server storage |
| Payment data | No — handled by Paystack | N/A | Paystack only |
| AI chat history (Dassa) | Yes — session logs | Configurable | CEO, Mapida |
| Guard rail logs | Yes — audit log | 90 days | CEO, Mapida |
| Media (product images, video) | Yes — cloud storage | Until listing deleted | Public (published listings) |
