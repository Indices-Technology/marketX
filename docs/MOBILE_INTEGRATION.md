# MarketX — Mobile / Third-Party Integration Guide

> For developers building a native client (Android/iOS) or any third-party
> consumer of the MarketX API. Pair this with:
> - **[API_STRUCTURE.md](./API_STRUCTURE.md)** — the route map (what exists + auth level)
> - **[openapi.json](./openapi.json)** — machine-readable contract for codegen
> - Live interactive docs: `…/api/scalar?key=<secret>` (Scalar UI) or
>   `…/api/swagger?key=<secret>` (Swagger UI). The docs are gated by a shared
>   secret — ask the MarketX team for it. The **API itself is not gated**; the
>   key only unlocks the documentation pages.

---

## 1. Base URL & environments

| Environment | Base URL | Payments | Data |
|---|---|---|---|
| Staging | `https://marketx.indicestech.com/api` | Paystack **test** mode | throwaway — safe to break |
| Production | _(do not use for development)_ | Paystack **live** | real customers & money |

- All API paths in the docs are relative to `…/api` (e.g. `POST …/api/auth/login`).
- Health check (no auth): `GET …/api/health` → `{ ok: true, ts, env }`.
- Build and test against **staging only**. Register your own test accounts there.

---

## 2. Authentication

Email + password with JWT. There are **two tokens**:

| Token | Lifetime | Use |
|---|---|---|
| `accessToken` | ~15 min | Sent on every protected request (see §3) |
| `refreshToken` | 7 days, **rotates on each use** | Exchanged for a new access token when it expires |

### Get tokens

`POST /auth/login` or `POST /auth/register` →

```json
{ "success": true, "accessToken": "…", "refreshToken": "…", "user": { … } }
```

Store **both** tokens in OS-encrypted storage:
- Android → `EncryptedSharedPreferences` (Keystore-backed). **Not** plain `SharedPreferences`.
- iOS → Keychain.

### Use the access token

Add this header to every authenticated request:

```
Authorization: Bearer <accessToken>
```

### Refresh when the access token expires

When a protected call returns `401`, renew and retry once:

```
POST /auth/refresh-token
X-Refresh-Token: <refreshToken>          ← native transport (no cookie)
```

Response:

```json
{ "success": true, "accessToken": "…", "refreshToken": "…" }
```

> ⚠️ **The refresh token rotates.** The token you just sent is now invalid.
> You **must** overwrite your stored `refreshToken` with the new one from the
> response, or the next refresh will `401` and the user gets logged out.
> If refresh itself returns `401`, the session is dead — send the user to login.

### Logout

`POST /auth/logout` revokes the session server-side. Also discard both stored tokens locally.

### OAuth (Google/Facebook/TikTok)

Use a native provider SDK with **PKCE** and a deep-link redirect. Do **not** call
`GET /auth/session` — it is a web-only cookie bridge and does nothing useful on native.

---

## 3. Request & response conventions

### Auth header
`Authorization: Bearer <accessToken>` on protected routes. Public routes (feed,
product/store browse, search) work without it.

### Success envelope
```json
// single resource
{ "success": true, "data": { … } }

// list (paginated)
{ "success": true, "data": [ … ], "meta": { "limit": 20, "offset": 0, "hasMore": true } }
```
> Auth endpoints are the exception — they return tokens/user at the top level
> (`{ success, accessToken, refreshToken, user }`), not under `data`.

### Errors
HTTP status + a JSON body. Parse `statusMessage` (H3 also includes `message`):
```json
{ "statusCode": 401, "statusMessage": "Invalid credentials" }
```
Common: `400` validation, `401` unauthenticated, `403` not allowed (IDOR),
`404` not found, `409` conflict (duplicate), `429` rate-limited.

### Pagination
Query with `?limit=20&offset=0`. `meta.hasMore` tells you if another page exists
(there is usually **no** `total` count — do not rely on one).

### Other conventions
- Timestamps: ISO-8601 UTC strings.
- Currency amounts: **kobo** (NGN × 100) unless noted.
- IDs: `string` (cuid2) for profiles/posts; `number` for products/orders.

---

## 4. Rate limits

Per the server: authenticated ~300/min/user, public reads ~120/min/IP, uploads
~10/min/IP. On `429`, back off and respect the retry window in the message.

---

## 5. Media upload

`POST /media/upload` — `multipart/form-data`, returns `{ url, public_id, type }`.
Use the returned `url` when creating posts/products.

---

## 6. Real-time

Two options — confirm which to use and get connection params from the backend team:

- **Pusher protocol (Soketi):** use the **Pusher Android SDK**. Channels:
  `user-{userId}` (notifications, messages), `store-{storeSlug}` (order updates),
  `post-{postId}` (live likes/comments). Private channels authenticate via
  `POST /pusher/auth`.
- **SSE / WS fallbacks:** `GET /notifications/stream` (notifications),
  `GET /chat/ws` (chat).

> Soketi host/key/TLS are environment-specific — request the staging values.

---

## 7. Using the contract for codegen

The full request/response shapes live in **[openapi.json](./openapi.json)**.
Generate a typed client (e.g. Retrofit + Kotlin models) from it rather than
hand-writing models:

```bash
# example — OpenAPI Generator
openapi-generator-cli generate -i openapi.json -g kotlin -o ./marketx-client
```

> **Coverage:** the **Auth** domain is fully specced (params, bodies, responses).
> Other domains currently appear as paths only — refer to API_STRUCTURE.md for
> those until annotation rolls out (in progress). Treat `openapi.json` as a
> snapshot; the live `…/api/openapi.json` is authoritative once deployed.

---

## 8. Open items before formal hand-off

These are on the **MarketX team**, not the mobile dev:

1. **Deploy this branch to staging** so `…/api/openapi.json` and `…/api/scalar` are
   live. Requires `nitro.openAPI.production: true` (set) **and** redeploying the
   staging server, plus setting `OPENAPI_DOCS_SECRET` in the staging environment.
2. ~~Gate the docs routes.~~ **Done** — `/api/openapi.json`, `/api/scalar`, `/api/swagger`
   require `OPENAPI_DOCS_SECRET` (via `?key=`, `x-docs-key` header, or the cookie
   the UI sets after `?key=`). Gate is off when the secret is unset (local dev).
   The API and app are unaffected.
3. **API versioning.** No `/v1` prefix yet — agree on a versioning scheme before
   the app binary ships so the API can evolve without breaking installed apps.
4. **Annotate remaining domains** (commerce, feed, profile, …) for full codegen.
