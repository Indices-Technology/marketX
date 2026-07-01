# Milestone 1 — Acceptance Checklist

**Project:** MarketX Mobile Application
**Milestone:** M1 — Foundation, Auth & App Architecture
**Fee:** ₦500,000
**Test environment:** Staging only — `https://marketx.indicestech.com/api`
**Platforms:** Android **and** iOS (debug builds)

> **How to use this checklist.** Every item is a pass/fail acceptance criterion.
> "Complete flow" means the happy path **plus** the error, empty, and loading
> states for that flow. Test against **staging** with your own throwaway test
> accounts. Reference docs: [MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md),
> [AUTHENTICATION.md](./AUTHENTICATION.md), [API_READINESS.md](./API_READINESS.md).
>
> Items marked **[Conditional]** depend on a MarketX-side decision (Schedule D) and
> are not a Developer failure if that dependency is not yet delivered — mark them
> **Deferred** with a note.

---

## 0. Foundation & App Architecture

- [ ] Project builds and runs on **Android** (debug).
- [ ] Project builds and runs on **iOS** (debug).
- [ ] Navigation structure in place (auth stack ↔ main app stack; a logged-out user
      cannot reach authenticated screens, and a logged-in user skips the auth stack).
- [ ] App state/session management wired (auth state survives app backgrounding and
      cold start — a logged-in user is still logged in after force-closing and reopening).
- [ ] Architecture (navigation, API client, state management) is **documented in the
      repo README**.
- [ ] Secrets/keys and the staging base URL are configurable (not hard-coded per screen);
      no production URL used anywhere in the build.

## 1. API Client (foundation for every flow)

- [ ] Central API client points at the staging base URL and sends
      `Authorization: Bearer <accessToken>` on every protected request.
- [ ] Public routes (feed, browse, search) work **without** a token.
- [ ] Parses the standard success envelope: single `{ success, data }` and paginated
      `{ success, data, meta:{ limit, offset, hasMore } }`.
- [ ] Parses the error envelope (`statusCode` + `statusMessage`) and surfaces the
      message to the UI — no raw JSON or stack traces shown to the user.
- [ ] Pagination uses `?limit=&offset=` and relies on `meta.hasMore` (does **not**
      assume a `total` count exists).
- [ ] Handles the known conventions: ISO-8601 UTC timestamps, currency in **kobo**,
      string IDs for profiles/posts vs numeric IDs for products/orders.
- [ ] **401 auto-refresh-and-retry:** on a `401` from a protected call, the client
      transparently calls `POST /auth/refresh-token`, then retries the original request
      **once** (see §2.6). The user sees no interruption.

## 2. Token & Session Handling (the security core)

### 2.1 Secure token storage
- [ ] `accessToken` **and** `refreshToken` are stored in OS-encrypted storage —
      Android `EncryptedSharedPreferences` (Keystore-backed), iOS Keychain. **Not**
      plain SharedPreferences/UserDefaults.

### 2.2 Access token usage
- [ ] Access token (~15 min TTL) is attached as `Bearer` on all authenticated calls.

### 2.3 Refresh transport (native)
- [ ] Refresh uses the **native transport**: `POST /auth/refresh-token` with the
      `X-Refresh-Token: <refreshToken>` header (no cookies — mobile has no cookie jar).

### 2.4 Refresh-token rotation — **critical**
- [ ] On every successful refresh, the app **overwrites** the stored `refreshToken`
      with the new one from the response. (The token just sent is now dead server-side.)
- [ ] Verify by test: refresh once → the old refresh token now returns `401` if replayed;
      the new one works.

### 2.5 Expired-session recovery (the headline criterion)
- [ ] A tester can **refresh an expired session without re-login**: let the access
      token expire, make a protected call, and confirm the app silently refreshes and
      completes the call.

### 2.6 Dead session → forced login
- [ ] If `POST /auth/refresh-token` itself returns `401` (refresh token expired/revoked),
      the app clears stored tokens and routes the user to login. No infinite retry loop.

### 2.7 Logout
- [ ] `POST /auth/logout` is called, the session is revoked server-side, and **both**
      tokens are discarded locally. After logout, previously authenticated screens are
      unreachable and the old access token is rejected.

---

## 3. Registration — Regular User (`POST /auth/register`)

> **There are two distinct registration entry points — keep them separate in the UI.**
> This section is the **buyer / regular user** path. The **direct seller** path is §3B.
> A user created here has `role: "user"`. Do **not** silently create sellers here.

- [ ] `POST /auth/register` with **email + username + password + confirmPassword** creates
      a **regular user** account (`role: "user"`) and stores the returned
      `accessToken`/`refreshToken` (note: auth responses return tokens at the **top level**,
      not under `data`).
- [ ] **Username field** collected and validated to match the server: **3–30 chars, only
      letters, numbers, underscores, hyphens** (`^[a-zA-Z0-9_-]+$`). Duplicate/invalid
      username errors render inline.
- [ ] **Confirm-password field** present; the app enforces `password === confirmPassword`
      before submit (server rejects a mismatch too).
- [ ] Client-side password policy matches the server: **min 12 chars, upper + lower +
      number + special**, common-password denylist. Invalid passwords are caught before
      submit with a clear message.
- [ ] Validation errors from the server (`400`) render inline on the right fields.
- [ ] Duplicate email **or username** (returned as `400` "Email/Username already in use")
      shows a clear message on the correct field.
- [ ] Registration triggers a verification email (see §4).
- [ ] **Rate limiting handled:** after 3 registration attempts/hour (per IP) the server
      returns `429`; the app shows a friendly "try again later" state and respects the
      retry window (does not spam the endpoint).
- [ ] Loading state on the submit button; the form cannot be double-submitted.
- [ ] On success the app lands the user in the **buyer/regular experience** — no seller-only
      screens are exposed (see §3C role handling).

## 3B. Registration — Seller (Direct) (`POST /auth/register-seller`)

> This is a **dedicated endpoint** that creates the **account and the store in one atomic
> flow** and auto-logs-in as `role: "seller"`. It is **not** the "register as user, then
> upgrade to seller" route — a person becomes a seller directly here. Treat it as its own
> onboarding screen/wizard, distinct from §3.

- [ ] Seller sign-up is reachable as its own flow (e.g. "Sell on MarketX" / "Create a store"),
      visually and structurally separate from regular sign-up.
- [ ] `POST /auth/register-seller` submits **account fields** (`email`, `username`,
      `password`, `confirmPassword`) **and store fields** (`store_name`, `store_slug`)
      as **required**.
- [ ] **Optional store fields** supported where the UI collects them: `store_description`,
      `store_logo`, `store_banner`, `store_location`, `store_phone`, `store_currency`
      (defaults to `NGN`).
- [ ] **Store URL (`store_slug`) validation matches the server:** lowercase letters,
      numbers and hyphens only (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), **min 3 chars**, and **not a
      reserved word** (e.g. `market`, `checkout`, `admin`, `profile`, `dasah`, …). Invalid
      slug → `400`; slug already taken → `409`. Both render clear inline errors.
- [ ] **Live/pre-submit slug availability** feedback is a plus (avoids a `409` on submit) —
      confirm with MarketX whether a slug-check endpoint should be used.
- [ ] Duplicate email/username → `400` with the right field flagged.
- [ ] On success the response includes `{ accessToken, refreshToken, user (role:"seller"),
      store: { store_slug, store_name } }` — tokens stored per §2, and the user proceeds
      **straight into the seller experience** (e.g. "add your first product").
- [ ] A verification email is still sent for seller sign-up (account works before verifying;
      handle the §4 verification gate the same way).
- [ ] Rate limiting (5 / 15 min per IP, same as register) → `429` handled.
- [ ] **Password policy is identical to regular registration** (12+ chars, upper + lower +
      number + special, common-password denylist). The seller sign-up must show the **same
      password-strength meter** and block submit on a weak password exactly like the buyer
      flow — a seller can never be created with a weaker password than a buyer.
      _(Backend `register-seller` now enforces `enhancedPasswordSchema`, matching `register`.)_

## 3C. User vs Seller — No-Confusion Rules (applies app-wide)

- [ ] **Role is read from the authenticated user (`user.role`), never assumed.** After any
      login/registration/refresh, the app knows whether the current account is `user` or
      `seller` and renders accordingly.
- [ ] **Regular users never see seller-only UI** (store dashboard, product management, etc.),
      and the two registration flows never cross-create the wrong role.
- [ ] Navigation/guards branch on role (ties to §0): a `seller` gets seller capabilities;
      a `user` does not — verified by logging in as each.
### The three registration/seller entry points — keep them distinct

| Path | Endpoint | Auth? | Effect |
|---|---|---|---|
| Regular sign-up | `POST /auth/register` | No | Creates `role: "user"` |
| Direct seller sign-up | `POST /auth/register-seller` | No | Creates account **+ store** atomically, auto-login as `role: "seller"` |
| **Upgrade to seller** | `POST /seller/register` | **Yes (logged-in user)** | Creates the `sellerProfile` for the current user **and promotes their role to `seller`** |

- [ ] **Become-a-seller / upgrade flow (`POST /seller/register`)** is implemented for an
      existing logged-in `user`: it sends store fields (`store_name`, `store_slug`, optional
      `store_description`/`store_location`/`store_logo`/etc.) and, on success, the account's
      role becomes `seller`.
- [ ] **Role refresh after upgrade — treat `GET /profile` as the source of truth for role.**
      After a successful upgrade, **re-fetch the profile** and update local state so seller UI
      unlocks immediately (this is exactly what web does — `useSellerManagement.createSeller`
      calls `fetchMyProfile()` after `POST /seller/register`; it does **not** refresh the token).
      Note: the current access token still carries the **old `role: "user"`** claim until it
      naturally rotates, but the backend re-loads the role from the DB on every request
      (`requireAuth`), so seller-gated endpoints authorize correctly right away. **Do not read
      role from the decoded JWT** — if the app does, it must also refresh the token after
      upgrade. No log-out/log-in should ever be required.
- [ ] **Store-slug rules are identical across both store-creating paths** (`register-seller`
      and `seller/register`): same format regex, and the **same reserved-word rejection**
      (`market`, `checkout`, `admin`, `api`, `dasah`, …). _(Backend now shares one
      `isReservedSlug` guard across both paths.)_
- [ ] Do **not** conflate the three: regular sign-up never creates a store; direct seller
      sign-up creates a brand-new account; upgrade operates on the **already-authenticated**
      user. Each is its own screen/flow.

## 4. Email Verification Flow (complete)

- [ ] After registration, the app guides the user to verify their email.
- [ ] `POST /auth/verify-email` consumes the token (from the emailed link/deep link or
      manual entry) and marks the account verified.
- [ ] **Resend:** `POST /auth/send-verification-email` lets the user request a new email;
      resend is rate-limited (5 / 15 min) → `429` handled gracefully.
- [ ] Invalid/expired verification token shows a clear error with a "resend" path.
- [ ] **[Conditional] Login gate:** if `REQUIRE_EMAIL_VERIFICATION=true` on staging,
      login of an unverified account returns `403 EMAIL_NOT_VERIFIED` and the app routes
      the user to the verification screen instead of the app. (Confirm the staging flag
      value with MarketX.)

## 5. Login Flow (complete)

- [ ] `POST /auth/login` with email + password stores both tokens and lands the user in
      the authenticated app.
- [ ] Wrong credentials (`401`) show a clear, non-technical error.
- [ ] **Rate limiting / lockout handled:** after 5 failed attempts / 15 min (keyed by
      email) the account is locked for 30 min → `429`; the app shows the lockout state and
      retry timing rather than re-submitting.
- [ ] Loading state during sign-in; no double-submit.
- [ ] Successful login persists the session across app restarts (ties to §0 / §2).

## 6. Password Reset Flow (complete)

- [ ] `POST /auth/forgot-password` sends a reset email. The response is deliberately
      **non-enumerating** ("if the email exists, a link will be sent") — the app shows the
      same confirmation whether or not the email is registered (does not reveal existence).
- [ ] Forgot-password is rate-limited (3 / hour by email) → `429` handled.
- [ ] `POST /auth/reset-password` consumes the reset token and sets the new password
      (new password validated against the same 12-char policy).
- [ ] Invalid/expired reset token shows a clear error with a path to request a new link.
- [ ] **Security behaviour verified:** after a successful reset, **all existing sessions
      are revoked** — confirm a session that was logged in on another device/token is now
      forced back to login.
- [ ] After reset, the user can log in with the new password (and cannot with the old one).

## 7. Checkout OTP Flow (complete)

- [ ] `POST /auth/checkout-otp/send` sends an OTP for guest/checkout verification.
- [ ] `POST /auth/checkout-otp/verify` verifies the code and unblocks the flow.
- [ ] Invalid/expired OTP shows a clear error; a resend path exists.
- [ ] Send is rate-limited → `429` handled with retry timing.
- [ ] Loading and error states on the OTP entry screen (per-digit or single field is fine).

## 8. OAuth / Social Login **[Conditional — Schedule D]**

- [ ] Uses a **native provider SDK with PKCE + deep-link redirect** (Google / Facebook /
      TikTok). The app does **not** call `GET /auth/session` (web-only cookie bridge, useless
      on native).
- [ ] On success, the app holds a valid MarketX session (tokens stored per §2).
- [ ] Cancel / provider-error paths return the user cleanly to the login screen.
- [ ] **This item is conditional on MarketX confirming the PKCE approach and provider
      SDK support (M1 spike).** If not yet confirmed, mark **Deferred** — not a failure.

## 9. Profile & Settings Foundation

- [ ] `GET /profile` loads the current user; `PATCH /profile` saves edits.
- [ ] `PATCH /profile/email` and `PATCH /profile/password` flows work with validation +
      error handling.
- [ ] `GET/PATCH /profile/settings` loads and saves settings.
- [ ] **Avatar / profile image:** upload via `POST /media/upload` (`multipart/form-data`
      → `{ url, public_id, type }`) and save the returned `url` on the profile. Upload
      shows progress + error states and respects the ~10/min upload rate limit.
- [ ] **Account deletion** (store-compliance requirement — Apple/Google): `DELETE /profile`
      with **password confirmation**. On success, tokens are cleared and the user is
      returned to the logged-out state. A confirmation/"are you sure" step precedes it.
- [ ] Each of the above shows loading, success, and error states.

## 10. App-Wide Loading / Empty / Error States

- [ ] A **loading** state renders for every in-flight request (no blank/frozen screens).
- [ ] An **empty** state renders when a list/collection returns zero items.
- [ ] An **error** state with a **retry** action renders on failed requests, driven by the
      parsed error envelope (§1).
- [ ] A no-network / timeout condition is handled distinctly from a server error.
- [ ] These states are reusable/consistent across screens (not re-implemented ad hoc).

---

## 11. Cross-Cutting Decisions to Confirm with MarketX (not Developer failures)

These shape M1 architecture but are **MarketX-side** decisions — flag rather than fail:

- [ ] **API versioning (`/v1`) scheme** agreed before the binary ships (no prefix exists yet).
- [ ] **Push-notification (FCM/APNs) device-token approach** decided — build the
      device-token registration foundation in M1, or defer push to a later phase (in-app
      only for now).
- [ ] **Native OAuth (PKCE)** approach confirmed (drives §8).
- [ ] **[Optional] Device-session management UI** ("list my devices / sign out a device")
      — only if in scope for M1; no backend endpoint exists today, so confirm before building.

---

## Sign-off

| | Client (MarketX) | Developer |
|---|---|---|
| Name | Joshua Akibu | Samuel Odukoya |
| Signature / Date | __________ | __________ |

**Outcome:** ☐ Accepted ☐ Accepted with deferred minor item(s) ☐ Not accepted
_(Deferred/conditional items and notes: ____________________)_

> On acceptance, the ₦500,000 M1 fee is due per clause 3 of the Mobile Application
> Development Agreement. Record every **[Conditional]** / deferred item in writing as
> **in scope · de-scoped · deferred to Phase 2**.
