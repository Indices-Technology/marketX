# MarketX — API Reference

> Derived from `layers/*/server/api/` — last updated 2026-06-20.
> Base URL: `/api`

> **Machine-readable contract (params + response shapes):** an OpenAPI spec is
> served at **`/api/openapi.json`**, with interactive docs at **`/api/scalar`**
> (Scalar) and **`/api/swagger`** (Swagger UI). Point your client codegen
> (Retrofit/Kotlin, etc.) at the JSON.
> This markdown is the human **map** (what exists + auth level); the OpenAPI
> spec is the authoritative per-route detail, generated from the handlers via
> `defineRouteMeta`. **Coverage:** the **Auth** domain is fully annotated as the
> pilot; remaining domains are being rolled out the same way.

---

## Table of Contents

1. [Auth](#auth)
2. [Profile](#profile)
3. [Social — Posts](#social--posts)
4. [Social — Mentions](#social--mentions)
5. [Social — Wall](#social--wall)
6. [Stories](#stories)
7. [Feed](#feed)
8. [Commerce — Products](#commerce--products)
9. [Commerce — Cart](#commerce--cart)
10. [Commerce — Orders](#commerce--orders)
11. [Commerce — Payments](#commerce--payments)
12. [Commerce — Shipping](#commerce--shipping)
13. [Commerce — Wallet](#commerce--wallet)
14. [Commerce — Affiliate](#commerce--affiliate)
15. [Commerce — Reviews & Tags](#commerce--reviews--tags)
16. [Seller](#seller)
17. [Squares](#squares)
18. [Map](#map)
19. [Notifications](#notifications)
20. [Chat](#chat)
21. [Media & Search](#media--search)
22. [AI](#ai)

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user account |
| POST | `/auth/login` | Email + password login |
| POST | `/auth/logout` | Invalidate session |
| GET  | `/auth/session` | Get current session / user |
| GET  | `/auth/refresh-token` | Refresh JWT tokens |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/send-verification-email` | Re-send email verification |
| POST | `/auth/verify-email` | Verify email with token |
| GET  | `/auth/oauth/[provider]` | Start OAuth flow (Google, etc.) |
| GET  | `/auth/oauth/[provider]/callback` | OAuth callback handler |
| POST | `/auth/register-seller` | Upgrade account to seller during onboarding |
| POST | `/auth/checkout-otp/send` | Send OTP for guest checkout |
| POST | `/auth/checkout-otp/verify` | Verify guest checkout OTP |

### Token lifecycle (web vs. native)

`login` / `register` return `{ accessToken, refreshToken, user }` in the body
**and** set httpOnly cookies. Use the access token as `Authorization: Bearer
<accessToken>` on every protected request. It expires in 15 min; renew it via
`/auth/refresh-token` before/when you get a `401`.

The refresh endpoint accepts the refresh token over **two transports**:

| Client | Send refresh token as | Response |
|--------|-----------------------|----------|
| Web (browser) | httpOnly `refreshToken` cookie (automatic) | `{ accessToken }` — rotated refresh token goes back in the cookie |
| Native (mobile) | `X-Refresh-Token: <token>` header, or `{ "refreshToken": "<token>" }` body | `{ accessToken, refreshToken }` — **store the new refresh token**, the old one is now invalid |

> **Native clients:** the refresh token rotates on every call — the token you
> just sent is immediately invalidated. Always persist the `refreshToken` from
> the response or the next refresh will `401`. Store both tokens in
> Keystore-backed encrypted storage (Android `EncryptedSharedPreferences` /
> iOS Keychain), never plain `SharedPreferences`. Do **not** call
> `GET /auth/session` (web OAuth cookie bridge); use native OAuth with PKCE.

---

## Profile

### Own profile (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/profile` | Get own profile |
| PATCH  | `/profile` | Update own profile |
| DELETE | `/profile` | Delete account |
| GET    | `/profile/media` | Get own uploaded media |
| GET    | `/profile/followers` | Own followers list |
| GET    | `/profile/following` | Own following list |
| GET    | `/profile/suggestions` | Suggested users to follow |
| POST   | `/profile/check-following` | Batch check follow status for a list of user IDs |
| PATCH  | `/profile/email` | Change email address |
| PATCH  | `/profile/password` | Change password |
| GET    | `/profile/settings` | Get app settings |
| PATCH  | `/profile/settings` | Update app settings |
| GET    | `/profile/addresses` | Saved delivery addresses |
| POST   | `/profile/addresses` | Add delivery address |
| DELETE | `/profile/addresses/[id]` | Remove an address |
| PATCH  | `/profile/addresses/[id]/default` | Set address as default |

### Public profiles

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/profile/[username]` | Public profile page data |
| GET    | `/profile/[username]/posts` | Posts by a user |
| GET    | `/profile/[username]/posts/[id]` | Single post by a user |
| GET    | `/profile/[username]/likes` | Posts a user has liked |
| GET    | `/profile/[username]/followers` | User's followers |
| GET    | `/profile/[username]/following` | Who a user follows |
| GET    | `/profile/[username]/stats` | Follower / post / like counts |
| GET    | `/profile/[username]/status` | Online status |
| POST   | `/profile/[username]/follow` | Follow a user |
| DELETE | `/profile/[username]/unfollow` | Unfollow a user |

---

## Social — Posts

### Collection

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/posts` | Paginated post list (public / filtered) |
| POST | `/posts` | Create a post |
| GET  | `/posts/tagged` | Posts where the current user is tagged |
| GET  | `/posts/by-store` | Posts from a specific store (`?storeSlug=`) |
| GET  | `/posts/liked` | Posts the current user has liked |

### Saved posts

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/posts/save` | Saved posts collection |
| POST   | `/posts/save` | Save a post |
| GET    | `/posts/save/[id]` | Check if a post is saved |
| DELETE | `/posts/save/[id]` | Unsave a post |

### Shares

| Method | Path | Description |
|--------|------|-------------|
| POST | `/posts/share` | Share / repost a post |
| GET  | `/posts/my-shares` | Posts shared by the current user |

### Single post

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/posts/[id]` | Get a post |
| PATCH  | `/posts/[id]` | Edit a post (author only) |
| DELETE | `/posts/[id]` | Delete a post (author only) |
| POST   | `/posts/[id]/like` | Like a post |
| DELETE | `/posts/[id]/like` | Unlike a post |
| GET    | `/posts/[id]/likes` | Users who liked a post |
| GET    | `/posts/[id]/shares` | Shares / reposts of a post |
| POST   | `/posts/[id]/view` | Record a view (analytics) |

### Comments

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/posts/[id]/comments` | Top-level comments on a post |
| POST | `/posts/[id]/comments` | Add a comment |
| PATCH  | `/posts/[id]/comments/[commentId]` | Edit a comment |
| DELETE | `/posts/[id]/comments/[commentId]` | Delete a comment |
| POST   | `/posts/[id]/comments/[commentId]/like` | Like a comment |
| DELETE | `/posts/[id]/comments/[commentId]/like` | Unlike a comment |
| GET    | `/posts/[id]/comments/[commentId]/replies` | Replies to a comment |

---

## Social — Mentions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/mentions/search?q=` | Autocomplete users + sellers for `@mention` tagging |

Returns `{ data: [{ type, id, handle, displayName, avatar }] }`.
Both user `profileId` and seller owner's `profileId` are returned as `id` so notifications route uniformly.

---

## Social — Wall

A Facebook-style wall attached to every user profile and store page. The wall IS the profile page — wall posts (`wallTargetType` set) and the profile owner's own posts both appear in the "All" feed. Filter pills (All · Products · Reviews · About) are rendered client-side above the wall feed; the API accepts a `filter` query param for server-side filtering.

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/wall/[type]/[slug]` | Wall timeline. `type`: `user` or `store`. Query: `filter` (`all`\|`posts`\|`shoutouts`), `limit`, `offset`. Public — optionalAuth. |
| POST   | `/wall/[type]/[slug]` | Post a shoutout on a wall. Auth required. Body: `{ body: string (1–1000 chars) }`. Notifies wall owner via `WALL_SHOUTOUT`. Cannot post on own `user` wall. |
| DELETE | `/wall/[type]/[slug]/[postId]` | Delete a wall post. Authorised if requester is the post author **or** the wall owner. |

**Response shape for GET** — same `{ data: IWallPost[], meta: { limit, offset, hasMore } }` as other feed endpoints. Each `IWallPost` extends the standard post shape with `contentType: 'WALL_SHOUTOUT' | 'POST' | 'COMMERCE'`.

---

## Stories

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/stories` | Stories feed (followed users) |
| POST   | `/stories` | Create a story |
| GET    | `/stories/[id]` | Single story |
| DELETE | `/stories/[id]` | Delete own story |
| POST   | `/stories/[id]/view` | Mark story as viewed |

---

## Feed

All feed endpoints are read-only and return `{ items[], meta }` unless noted.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/feed/home` | Mixed for-you feed (posts + products, cached) |
| GET | `/feed/following` | Feed from accounts the user follows |
| GET | `/feed/trending` | Trending posts |
| GET | `/feed/deals` | Active flash deals (`isDeal=true`) |
| GET | `/feed/fresh-drops` | Products listed in the last 7 days |
| GET | `/feed/pre-loved` | Second-hand / thrift listings |
| GET | `/feed/discover` | Discovery mix for Explore page |
| GET | `/feed/reels` | Video-first reel feed |
| GET | `/feed/shop-today` | Curated shoppable shelf (injected into home feed) |
| GET | `/feed/nearby-stores` | Stores near a given `lat/lng` |
| GET | `/feed/squares/[slug]` | Feed scoped to a single Square |
| GET | `/feed/user/[userId]` | Feed for a specific user's profile page |

---

## Commerce — Products

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/commerce/products` | Browse products (`?search`, `?categorySlug`, `?squareSlug` (products in a market), `?status`, `?sortBy`, `?minPrice`/`?maxPrice`, etc.) |
| POST   | `/commerce/products` | Create a product (seller) |
| GET    | `/commerce/products/liked` | Products the current user has liked |
| GET    | `/commerce/products/by-slug/[slug]` | Product by URL slug |
| GET    | `/commerce/products/[id]` | Product detail |
| PATCH  | `/commerce/products/[id]` | Update a product |
| DELETE | `/commerce/products/[id]` | Delete a product |
| POST   | `/commerce/products/[id]/like` | Like a product |
| DELETE | `/commerce/products/[id]/like` | Unlike a product |
| GET    | `/commerce/products/[id]/likes` | Users who liked a product |
| GET    | `/commerce/products/[id]/comments` | Product comments |
| POST   | `/commerce/products/[id]/comments` | Add a product comment |
| GET    | `/commerce/products/variants/[id]` | Product variant detail |
| GET    | `/commerce/categories` | Product category list |
| GET    | `/tags` | All product tags |
| GET    | `/tags/[id]/products` | Products for a tag |

---

## Commerce — Cart

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/commerce/cart` | Get cart contents |
| POST   | `/commerce/cart` | Add item to cart |
| PATCH  | `/commerce/cart/[variantId]` | Update item quantity |
| DELETE | `/commerce/cart/[variantId]` | Remove item from cart |
| GET    | `/commerce/cart/validate` | Validate cart (stock, prices) before checkout |

---

## Commerce — Orders

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/commerce/orders` | Buyer's order history |
| POST   | `/commerce/orders` | Place an order |
| GET    | `/commerce/orders/seller` | Seller's incoming orders |
| GET    | `/commerce/orders/[id]` | Single order detail |
| POST   | `/commerce/orders/[id]/cancel` | Cancel an order |
| POST   | `/commerce/orders/[id]/confirm-receipt` | Buyer confirms delivery received |
| POST   | `/commerce/orders/[id]/confirm-cash` | Seller confirms cash-on-delivery collected |
| POST   | `/commerce/orders/[id]/refuse-delivery` | Buyer refuses delivery |
| PATCH  | `/commerce/orders/[id]/status` | Update order status (seller / admin) |

---

## Commerce — Payments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/commerce/payments/initialize` | Init Paystack / card payment |
| POST | `/commerce/payments/verify` | Verify payment after redirect |
| POST | `/commerce/payments/webhook` | Paystack webhook receiver |
| POST | `/commerce/payments/pod-initialize` | Init Pay-on-Delivery order |
| POST | `/commerce/payments/pod-verify` | Verify POD (admin / driver) |
| POST | `/commerce/payments/paypal/create` | Create PayPal order |
| POST | `/commerce/payments/paypal/capture` | Capture PayPal order after approval |

---

## Commerce — Shipping

| Method | Path | Description |
|--------|------|-------------|
| POST | `/commerce/shipping/rates` | Get shipping rate quotes |
| POST | `/commerce/shipping/calculate` | Calculate delivery cost |
| POST | `/commerce/shipping/create` | Create a shipment |
| GET  | `/commerce/shipping/zones` | Available shipping zones |
| GET  | `/commerce/shipping/track/[trackingNumber]` | Track a shipment |
| POST | `/commerce/shipping/webhook/sendbox` | Sendbox webhook |
| POST | `/commerce/shipping/webhook/shippo` | Shippo webhook |
| POST | `/commerce/shipping/seed` | Seed default shipping config (dev only) |

---

## Commerce — Wallet

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/commerce/wallet` | Current user's wallet balance |
| GET  | `/commerce/wallet/store/[storeSlug]` | Store wallet balance (seller) |
| GET  | `/commerce/wallet/transactions` | Transaction history |
| GET  | `/commerce/wallet/fee-config` | Platform fee configuration |
| GET  | `/commerce/wallet/payout-preview` | Preview payout amount after fees |
| POST | `/commerce/wallet/add-funds` | Top up wallet |
| POST | `/commerce/wallet/withdraw` | Request a withdrawal / payout |

---

## Commerce — Affiliate

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/commerce/affiliate` | Current user's affiliate status & stats |
| POST | `/commerce/affiliate/enroll` | Enroll in the affiliate programme |
| GET  | `/commerce/affiliate/available-products` | Products available to promote |
| GET  | `/commerce/affiliate/seller-products` | Seller's promotable products |
| GET  | `/commerce/affiliate/promoters` | Promoters for a seller's products |
| GET  | `/commerce/affiliate/referrals` | Referral conversions for the current affiliate |

---

## Commerce — Reviews & Tags

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/products/[id]/reviews` | Reviews for a product |
| POST | `/products/[id]/reviews` | Submit a product review |
| GET  | `/products/[id]/reviews/eligibility` | Check if user can review (purchased?) |
| POST | `/products/[id]/view` | Record a product page view |

> Note: seller-level reviews are under `/seller/[id]/reviews` — see [Seller](#seller).

---

## Seller

### Discovery

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/seller/list` | Browse all active sellers |
| GET  | `/seller/featured` | Featured / curated sellers |
| GET  | `/seller/by-slug/[slug]` | Seller profile by store slug |
| GET  | `/seller/check-slug` | Check slug availability (`?slug=`) |
| POST | `/seller/suggest-slug` | AI-suggested slug from store name |
| GET  | `/seller/following-ids` | IDs of sellers the current user follows |

### Registration & management

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/seller/register` | Create a seller profile |
| POST   | `/seller/ping` | Heartbeat — marks seller as online |
| GET    | `/seller/[id]` | Seller detail |
| PATCH  | `/seller/[id]` | Update seller profile |
| POST   | `/seller/[id]/activate` | Activate store |
| POST   | `/seller/[id]/deactivate` | Deactivate store |

### Social & engagement

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/seller/[id]/follow-status` | Check if current user follows this seller |
| POST   | `/seller/[id]/follow` | Follow a seller |
| DELETE | `/seller/[id]/unfollow` | Unfollow a seller |
| GET    | `/seller/[id]/products` | Seller's product listings |
| GET    | `/seller/[id]/messages` | Seller's inbox messages |
| GET    | `/seller/[id]/reviews` | Reviews for a seller |
| POST   | `/seller/[id]/reviews` | Review a seller (post-purchase) |
| GET    | `/seller/[id]/reviews/eligibility` | Check if user can review seller |

### Bank accounts

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/seller/bank-accounts` | Seller's saved bank accounts |
| POST   | `/seller/bank-accounts` | Add a bank account |
| DELETE | `/seller/bank-accounts/[id]` | Remove a bank account |
| PATCH  | `/seller/bank-accounts/[id]/set-default` | Set default payout account |

---

## Squares

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/squares` | Browse squares (`?type=GEOGRAPHIC|CATEGORY`, `?search=`) |
| POST   | `/squares` | Create a square (admin) |
| GET    | `/squares/[slug]` | Square detail |
| PATCH  | `/squares/[slug]` | Update square |
| POST   | `/squares/[slug]/activate` | Activate a square |
| POST   | `/squares/[slug]/join` | Seller requests to join a square |
| POST   | `/squares/[slug]/follow` | User follows a square |
| DELETE | `/squares/[slug]/follow` | User unfollows a square |
| POST   | `/squares/[slug]/officers` | Assign officers to a square |
| GET    | `/squares/[slug]/members` | Seller members of a square |
| PATCH  | `/squares/[slug]/members/[sellerId]` | Update a member's status / role |
| GET    | `/squares/[slug]/sellers` | Active sellers in a square |
| GET    | `/squares/[slug]/announcements` | Square announcements |
| POST   | `/squares/[slug]/announcements` | Post an announcement |

---

## Map

| Method | Path | Description |
|--------|------|-------------|
| GET | `/map/sellers` | Sellers within radius (`?lat`, `?lng`, `?radius`, `?limit`) |
| GET | `/map/sellers/[slug]/preview` | Map pin preview card for a seller |
| GET | `/map/squares` | Squares visible on the map |

---

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications/stream` | SSE stream — real-time notification delivery |

Notification types emitted: `LIKE`, `COMMENT`, `FOLLOW`, `ORDER`, `MENTION`, `REVIEW`, `SYSTEM`.

> Full notification CRUD (mark-read, delete) is managed client-side via the SSE payload and the profile store.

---

## Chat

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/chat/conversations` | All conversations for the current user |
| POST   | `/chat/conversations` | Start a new conversation |
| GET    | `/chat/conversations/[id]` | Conversation detail |
| DELETE | `/chat/conversations/[id]` | Delete a conversation |
| GET    | `/chat/conversations/[id]/messages` | Paginated messages |
| POST   | `/chat/conversations/[id]/messages` | Send a message |
| WS     | `/chat/ws` | WebSocket for real-time message delivery |

---

## Media & Search

| Method | Path | Description |
|--------|------|-------------|
| POST | `/media/upload` | Upload image / video to Cloudinary. Returns `{ url, public_id, type }` |
| GET  | `/music/search?q=` | Search background music tracks |
| GET  | `/search?q=` | Global search (products, sellers, users, squares) |
| POST | `/pusher/auth` | Pusher channel authentication |

---

## AI

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/generate-listing` | Generate a product title + description from an image or prompt |
| POST | `/ai/enhance-description` | Enhance an existing product description |

Both endpoints stream responses and require seller authentication.

---

## Common conventions

| Convention | Detail |
|---|---|
| Auth header | `Authorization: Bearer <accessToken>` on protected routes |
| Token refresh | Web: httpOnly cookie. Native: `X-Refresh-Token` header / body — see [Token lifecycle](#token-lifecycle-web-vs-native) |
| Pagination | `?limit=20&offset=0` → `{ data[], meta: { limit, offset, hasMore } }` |
| `hasMore` | Derived via the +1 trick (fetch `limit+1`, slice to `limit`) — no `COUNT(*)`. `total` is absent on most list endpoints |
| Errors | `{ statusCode, message }` — H3 standard error shape |
| Timestamps | ISO 8601 UTC strings |
| Currency | Amounts in **kobo** (NGN × 100) unless noted |
| IDs | `string` (cuid2) for profiles/posts; `number` (serial) for products/orders |
