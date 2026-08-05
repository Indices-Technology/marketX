# Google Business Profile — Integration Plan

**Status:** Phase 1 built (connection scaffold) · **Owner:** joshbj360 · **Last updated:** 2026-08-05

> **One seller connection unlocks three capabilities.** A seller who connects their Google
> Business Profile lets MarketX (1) import their Google **reviews/ratings** into the Trust
> Rail, (2) read/manage their **listing info**, and (3) publish **Local Posts** as a Growth
> Engine distribution channel.

This lives in `layers/growth` alongside the TikTok/Meta posting connections it mirrors. It reuses
the `SocialConnection` model, the AES-256-GCM token-at-rest scheme, and the connect/callback shape
of the TikTok flow. See [`GROWTH_ENGINE.md`](./GROWTH_ENGINE.md).

---

## 1. What "Google Business API" actually is

It is the **Google Business Profile API** family (8 sub-APIs: Account Management, Business
Information, Local Posts, Reviews, Q&A, Verifications, …), successor to Google My Business. It is
**not** a lookup API for arbitrary businesses. The access model is **OAuth-per-owner**: MarketX can
only read/write a listing when *that listing's owner* connects their Google account and grants the
`business.manage` scope.

### The architectural insight

Because reviews are read through the **owner's own grant** (GBP Reviews API), we sidestep the
Google **Places API** ToS problem — Places forbids persisting review content/ratings, which would
break a durable reputation ledger. Owner-connected data has no such caching restriction, so the
reviews→Trust-Rail path is clean *only* when it rides on this connection, not on Places.

---

## 2. Two external gates (cannot be coded around)

| Gate | What | Impact |
| --- | --- | --- |
| **OAuth verification** | `business.manage` is a *sensitive* scope → the consent screen must be Google-verified for production. | Until verified, the flow works only for accounts added as OAuth **test users**. (Mirror of the TikTok sandbox.) |
| **API access approval** | Formal GBP API access request, reviewed in **~14 days**. Then each of the 8 APIs starts at **300 req/min**; a known gotcha is **Account Management quota = 0** blocking `accounts.list` even once approved — request a quota bump. | The OAuth grant (Phase 1) succeeds without this. All Phase 2/3 API calls **403 until approved**. |

Hard limits worth knowing: **10 edits/min per single listing** (uncappable). Approval favors apps
that are functional listing-management tools with a **website whose domain matches the request
email**. This is the same shape as the Meta submission (see memory `project_meta_social_constraints`).

**→ Submit the access request now** so the 14-day clock runs in parallel with the build. Checklist in §6.

---

## 3. Phasing

| Phase | Scope | Gated? | State |
| --- | --- | --- | --- |
| **1** | Seller **connection** scaffold: connect endpoint, callback, encrypted token+refresh storage, list/disconnect (reuses generic endpoints). | No — testable via OAuth test users | **Built** |
| **2** | **Listing read** (`accounts.list` → `locations`) + **Reviews import** into the Trust Rail reputation ledger. | Yes | Planned |
| **3** | **Local Posts** publishing, wired into the Growth Engine channel registry as a new distribution target. | Yes (+ content quality review) | Planned |

---

## 4. Phase 1 — what was built

Reuses `SocialConnection` (new enum value `GOOGLE_GBP`); the generic
`/api/growth/connections` (list) and `/api/growth/connections/:id` (disconnect) endpoints already
cover the new platform.

| File | Role |
| --- | --- |
| `prisma/.../add_google_gbp_platform` | `ALTER TYPE "SocialPlatform" ADD VALUE 'GOOGLE_GBP'` |
| `server/utils/google.oauth.ts` | authorize URL + code→token exchange + userinfo |
| `server/api/growth/connect/google.get.ts` | start flow (auth'd fetch → returns authorize URL, sets `growth_gg_*` cookies) |
| `server/api/growth/connect/google/callback.get.ts` | exchange, encrypt tokens, upsert `SocialConnection`, redirect back |
| `app/services/connections.api.ts` · `app/composables/useConnections.ts` | client: `startGoogleBusiness` / `connectGoogleBusiness` |

**Env:** reuses `OAUTH_GOOGLE_CLIENT_ID` / `OAUTH_GOOGLE_CLIENT_SECRET` (same app as Google login).
Optional `GOOGLE_GBP_SCOPES` override to prove the flow with a non-sensitive scope before verification.

**Google Cloud console setup (one-time):**
1. Enable the GBP APIs on the project (Business Profile, Account Management, Business Information, etc.).
2. Add the redirect URI `${APP_URL}/api/growth/connect/google/callback` to the OAuth client.
3. Add the `business.manage` scope to the OAuth consent screen; add yourself as a **test user**.

**Manual test (before verification):**
1. Sign in as a seller who is an OAuth test user. Trigger `connectGoogleBusiness('/some/page')`.
2. Consent on Google → redirected back with `?google=connected`.
3. `GET /api/growth/connections` shows a `GOOGLE_GBP` row (never a token). Disconnect removes it.

---

## 5. Phase 2/3 — design notes (not yet built)

- **Account/location resolution:** `accounts.list` → `accounts/{id}/locations`. Store the chosen
  `location` resource name on the connection (add a `providerAccountId` / metadata column, or a
  small `GbpLocation` table) — needed by both reviews and posts. Watch the quota=0 gotcha.
- **Token refresh:** Google refresh tokens don't expire on a fixed clock (hence `refreshExpiresAt`
  is null); refresh access tokens on demand via the refresh grant. Add a shared refresh helper
  when Phase 2 makes the first API call.
- **Reviews → Trust Rail:** map GBP `starRating` + `comment` into the reputation signal used by
  `docs/REPUTATION_FRAMEWORK.md`; dedupe by GBP review id; store source = `GOOGLE_GBP`.
- **Local Posts:** register a `google-local-post` channel in `server/channels/registry.ts` so the
  orchestrator treats it like the embed/organic-share channels.

---

## 6. Access-request checklist (do this now)

- [ ] A verified Google Business Profile active 60+ days (or a client's, if managing on behalf).
- [ ] Public website whose **domain matches** the email on the request.
- [ ] GBP API project created; the 8 APIs enabled; OAuth consent screen configured.
- [ ] Submit the [GBP API access request form](https://developers.google.com/my-business/content/prereqs);
      describe MarketX as a tool that helps sellers **manage listings, sync reviews, and publish posts**.
- [ ] After approval: check per-API quota; if Account Management shows **0**, file a quota-increase request.
- [ ] Begin OAuth consent-screen **verification** for the `business.manage` sensitive scope (separate from API approval).

---

## 7. References

- [Prerequisites](https://developers.google.com/my-business/content/prereqs) · [Quotas & limits](https://developers.google.com/my-business/content/limits) · [FAQ](https://developers.google.com/my-business/content/faq)
