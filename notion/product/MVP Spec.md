# MVP Spec

## Objective

Validate that Nigerian market traders and buyers will use a digital-first local commerce platform — specifically: that sellers will list and maintain active storefronts, and that buyers will discover, engage, and transact through the platform rather than defaulting to WhatsApp or in-person.

---

## Primary Validation Question

> **Will a market trader in Lagos manage their own storefront and receive real orders through MarketX — without needing WhatsApp as a fallback?**

Everything built in this phase answers that question. If a feature doesn't help answer it, it doesn't belong here.

---

## MVP Scope

### Buyer Experience

- Register and browse without friction
- Discover nearby stores via GPS map (Market Squares, radius filter, deal/verified filters)
- Browse seller storefronts and product listings (with media and reels)
- Message sellers directly
- Checkout and pay via Paystack
- Follow stores and view activity wall
- Use Dassa (AI shopping assistant) for product discovery, cart, and order tracking

### Seller Experience

- Register and configure storefront (logo, description, business hours, location pin)
- List products with photos, pricing, deal flags, and size variants
- Use AI listing tool — generate title, description, and social captions from a product photo
- Manage incoming messages and orders
- Set online/offline presence
- View basic storefront stats (followers, product count)

### Platform Infrastructure

- Buyer and seller authentication
- Market Squares — geographic and category zones grouping sellers on the map
- Admin controls for user and listing management
- Paystack payment integration
- Redis-cached map and feed queries for performance under small load

### AI Layer (Dassa)

- Buyer-facing conversational assistant (product discovery, cart, order tracking)
- Guard rails: prompt injection detection, PII filtering, rate limiting
- Seller tool: GPT-4o vision listing generator

---

## Non-Goals (MVP Phase)

- Logistics and delivery automation
- Multi-country or multi-currency expansion
- Advanced analytics dashboards
- Paid advertising or promoted listings
- Affiliate or referral programmes
- Native mobile app (web-first)
- Complex review and rating system

---

## Success Criteria

| Signal | Target |
|---|---|
| Sellers complete full onboarding (storefront + 3+ live products) | 30 sellers in first cohort |
| Buyers complete map discovery → message or purchase flow | 60% of registered buyers |
| Dassa handles buyer queries without human escalation | 70% self-serve resolution |
| Platform stable under concurrent user load | No critical downtime in first 30 days |
| Sellers use AI listing tool at least once | 50% of active sellers |
| Core flows completable without support | Validated via unassisted user test |

---

## Development Principle

Build only what is necessary to test real user behaviour. Every feature added before the validation question is answered is a liability, not an asset.
