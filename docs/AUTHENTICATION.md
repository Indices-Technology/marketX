# Authentication System

This document describes how authentication works in MarketX: identity, tokens,
sessions, password handling, and the rate-limiting layer that protects the auth
endpoints.

> MarketX uses a **custom JWT auth system, not Supabase Auth**. All token
> issuance and verification is done with `jsonwebtoken` against our own secrets.

---

## 1. Overview

| Concern | Implementation |
|---|---|
| Identity store | `Profile` table (Prisma) |
| Password hashing | argon2id ([`server/utils/auth/auth.ts`](../server/utils/auth/auth.ts)) |
| Password policy | OWASP-aligned Zod schema ([`passwordValidator.ts`](../server/utils/auth/passwordValidator.ts)) |
| Access token | JWT signed with `JWT_SECRET`, 1 h TTL |
| Refresh token | JWT signed with `JWT_REFRESH_SECRET`, 7 d TTL, **rotated on every use** |
| Sessions | `Session` table; supports server-side revocation |
| Route protection | `requireAuth` / `optionalAuth` middleware |
| Abuse protection | Fixed-window rate limiter + lockout |
| Audit trail | `createAuditLog` on every security-relevant event |

The business logic lives in a single service singleton,
[`authService`](../layers/core/server/services/auth.service.ts). API route
handlers under [`layers/core/server/api/auth/`](../layers/core/server/api/auth/)
are thin: they parse/validate input, call the service, and shape the HTTP
response (cookies + body).

---

## 2. Components

### Passwords — [`server/utils/auth/auth.ts`](../server/utils/auth/auth.ts)

- `hashPassword(password)` — argon2id, `memoryCost: 19456`, `timeCost: 2`,
  `parallelism: 1`.
- `verifyPassword(password, hash)` — returns `false` on any error rather than
  throwing.
- Password strength is enforced at the validation layer by
  `enhancedPasswordSchema`: min 12 chars, upper/lower/number/special, and a
  common-password denylist.

### Tokens — [`server/utils/auth/auth.ts`](../server/utils/auth/auth.ts)

- `generateTokens(userId, email, role, sessionId)` → `{ accessToken, refreshToken }`.
  The **access token** embeds `userId`, `email`, `role`, and (when available)
  `sessionId` — the `sessionId` is what makes server-side revocation possible.
- `generateRefreshToken(userId)` — signed with the **separate** refresh secret,
  includes a random `jti`.
- `jwtVerify` / `jwtVerifyRefresh` — verify against the matching secret, throw on
  invalid/expired. `jwtDecode` decodes without verifying (non-security paths only).

### Route protection — [`requireAuth.ts`](../server/layers/shared/middleware/requireAuth.ts)

`requireAuth(event)`:
1. Reads `Authorization: Bearer <token>`.
2. Verifies the access token with `JWT_SECRET`.
3. If the token carries a `sessionId`, looks up the `Session` and rejects when it
   is missing, `revokedAt`, or expired. (Legacy tokens without `sessionId` pass
   until they expire naturally — a deliberate migration allowance.)
4. Loads the full `Profile` (with active `sellerProfile`) and attaches it to
   `event.context.user`.

`optionalAuth(event)` wraps `requireAuth` and returns `null` instead of throwing.
`getCurrentUser(event)` reads back the context user.

---

## 3. Token & session lifecycle

```
register ─► email verification token ─► (optional) email-verify gate
login ────► access token (1h) + refresh token (7d) + Session row
            │
            ├─ access token used as Bearer on each request (requireAuth)
            │
refresh ──► validate refresh token against Session
            ├─ rotate: issue NEW refresh token, update Session.refreshToken
            └─ old refresh token is now dead (replay → 401)
logout ───► Session.revokedAt set → all tokens for that session rejected
reset pw ─► revoke ALL sessions for the user
```

**Refresh-token rotation** ([`auth.service.ts` `refreshAccessToken`](../layers/core/server/services/auth.service.ts#L379))
is the key security property: every refresh invalidates the token that was sent.
A stolen-then-used refresh token gets one use before the legitimate client's next
refresh (or vice versa) breaks the chain.

**Two transports** (see [`refresh-token.ts`](../layers/core/server/api/auth/refresh-token.ts)):
- **Web** → tokens live in `httpOnly`, `sameSite: 'strict'` cookies; rotated
  refresh token stays in the cookie and is never returned in the body.
- **Native** → tokens travel via body / `X-Refresh-Token` header and are returned
  in the body, because the mobile client (Keystore-backed storage) has no cookie
  jar and must receive the rotated token.

---

## 4. Rate limiting

Two files cooperate.

### [`server/config/rateLimits.ts`](../server/config/rateLimits.ts) — policy

Exports `RATE_LIMITS`, one block per sensitive action. Every value is read from an
env var with a hardcoded fallback, so limits can be tuned in production **without
a redeploy**.

| Policy | Default max | Window | Lockout | Keyed by |
|---|---|---|---|---|
| `REGISTER` | 3 | 1 h | 1 h | IP |
| `LOGIN` | 5 | 15 min | 30 min | email |
| `FORGOT_PASSWORD` | 3 | 1 h | 1 h | email |
| `VERIFY_EMAIL_SEND` | 5 | 15 min | 30 min | email |
| `VERIFY_EMAIL_TOKEN` | 5 | 15 min | 30 min | token |
| `REFRESH_TOKEN` | 10 | 5 min | 15 min | userId |
| `PROFILE_FETCH` | 10 | 5 min | — | (no lockout/prefix) |

Each block carries: `maxAttempts`, `windowMs`, `lockoutMs`, `keyPrefix`
(`PROFILE_FETCH` lacks `lockoutMs`/`keyPrefix` and is not wired into the limiter).

### [`server/utils/auth/rateLimiter.ts`](../server/utils/auth/rateLimiter.ts) — engine

A **fixed-window counter with lockout**:

1. Build the key `keyPrefix:identifier`.
2. Increment the counter; set the window TTL on the first hit.
3. When the count exceeds `maxAttempts`, write a separate `:lock` key for
   `lockoutMs` and clear the counter → caller is `locked`.
4. Otherwise return `{ allowed, remaining, resetAt }`.

Two backends exist:
- `checkRedis` — Upstash/Redis, shared across instances (TTL + `incr`).
- `checkInMemory` — a per-process `Map`, with an hourly sweep of stale records.

Helper exports: `clearRateLimit` (called on successful login to reset the
counter), `resetAllRateLimits`, plus inspection helpers
(`getRateLimitStatus`, `getAllRateLimitRecords`, `deleteRateLimitRecord`).

### `checkRateLimit` vs `checkRateLimitAsync`

| | `checkRateLimit` (sync) | `checkRateLimitAsync` (async) |
|---|---|---|
| Signature | returns `RateLimitResult` | returns `Promise<RateLimitResult>` |
| Backend actually exercised | **in-memory only** (a sync fn can't `await` Redis) | Redis when configured, in-memory on error / dev |
| Callers today | none in the auth path — kept for rare sync callers | `authService` (login, register, refresh, verify-send, verify-token, forgot), `register-seller.post.ts`, `checkout-otp.service.ts` |

The auth path now uses **`checkRateLimitAsync`**, so counters and lockouts live
in Redis and are **shared across all serverless instances** (Vercel/Netlify
functions). If Redis is unreachable, it falls back to the per-process in-memory
store for that request rather than failing open hard.

`checkRateLimit` (sync) remains for any non-`async` caller, but it can only ever
use the in-memory store — do **not** use it on a serverless deploy where
cross-instance consistency matters.

> 📌 **History.** Until mid-2026 every auth method called the *sync*
> `checkRateLimit`, whose `if (redis)` branch was dead code — so all limiting was
> per-process in-memory. On serverless (Vercel) that meant counters scattered
> across function instances and reset on cold starts, weakening protection
> exactly under a brute-force burst (high concurrency → many instances). The auth
> path was migrated to `await checkRateLimitAsync(...)` to fix this; Upstash Redis
> was already configured ([nuxt.config.ts](../nuxt.config.ts#L350-L351)).

---

## 5. Auth endpoints

All under `/api/auth/` ([`layers/core/server/api/auth/`](../layers/core/server/api/auth/)):

| Endpoint | Purpose |
|---|---|
| `POST /register` | Create account (rate-limited by IP), send verification email |
| `POST /register-seller` | Seller registration variant |
| `POST /login` | Email + password → tokens + cookies (rate-limited by email) |
| `POST /logout` | Revoke the current session |
| `POST /refresh-token` | Rotate refresh token, issue new access token |
| `GET  /session` | Current session info |
| `POST /forgot-password` | Request reset email (rate-limited by email) |
| `POST /reset-password` | Consume reset token, set new password, revoke all sessions |
| `POST /send-verification-email` | (Re)send verification email |
| `POST /verify-email` | Consume verification token |
| `GET  /oauth/[provider]` + `/callback` | Social login (Google / Facebook / TikTok) |
| `POST /checkout-otp/send` + `/verify` | Guest-checkout OTP |

Email verification can be **enforced at login** when
`REQUIRE_EMAIL_VERIFICATION=true` — unverified users get `403 EMAIL_NOT_VERIFIED`.

OAuth ([`loginWithOAuth`](../layers/core/server/services/auth.service.ts#L296))
auto-provisions a profile on first sign-in with a unique username and a random
password hash, and marks the email verified.

---

## 6. Auditing & errors

- Every security event (`USER_REGISTERED`, `USER_LOGIN`, `USER_LOGIN_OAUTH`,
  `TOKEN_REFRESHED`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET`, `USER_LOGOUT`)
  is written via `authRepository.createAuditLog`.
- The service throws typed `AuthError(code, message, statusCode)`; route handlers
  translate it to an H3 error. Status codes: `400` invalid input, `401` bad
  credentials / revoked session, `403` email not verified, `429` rate
  limited / locked.
- Password-reset and forgot-password responses are deliberately **non-enumerating**
  ("If email exists, reset link will be sent") to avoid leaking which addresses
  are registered.

---

## 7. Environment variables

| Var | Purpose |
|---|---|
| `JWT_SECRET` | Signs/verifies access tokens (required) |
| `JWT_REFRESH_SECRET` | Signs/verifies refresh tokens (required) |
| `REQUIRE_EMAIL_VERIFICATION` | Gate login on verified email when `true` |
| `RATE_LIMIT_*_MAX` / `RATE_LIMIT_*_WINDOW` | Override rate-limit policy per action |

Related docs: [`SECURITY.md`](./SECURITY.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md).
