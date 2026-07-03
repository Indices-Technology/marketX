# MarketX — Architecture & Engineering Reference

A full-stack social commerce platform built with **Nuxt 4**, **Prisma**, **PostgreSQL (Neon)**, and **Redis**.
Users post content, tag products, follow sellers, buy directly from the feed, and join localised market Squares.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Layered Architecture](#4-layered-architecture)
5. [Server Architecture](#5-server-architecture)
6. [Database Schema](#6-database-schema)
7. [Auth System](#7-auth-system)
8. [Caching Layer](#8-caching-layer)
9. [Job Queue System](#9-job-queue-system)
10. [Real-time (Soketi/Pusher)](#10-real-time)
11. [Payments & Shipping](#11-payments--shipping)
12. [Media Uploads (Cloudinary)](#12-media-uploads)
13. [API Conventions](#13-api-conventions)
14. [State Management (Pinia)](#14-state-management)
15. [SSR Safety Rules](#15-ssr-safety-rules)
16. [Internationalization](#16-internationalization)
17. [Performance Optimizations](#17-performance-optimizations)
18. [Environment Variables](#18-environment-variables)
19. [Scheduled Tasks (Cron)](#19-scheduled-tasks)
20. [Key Decisions & Trade-offs](#20-key-decisions--trade-offs)
21. [AI & Semantic Search (Dassah integration)](#21-ai--semantic-search)

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (Vue 3, Vite, Nitro) |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Cache | Upstash Redis (REST/HTTP) |
| Job Queue | BullMQ + standard Redis TCP |
| Auth | JWT (access + refresh tokens) + Argon2 password hashing |
| Media | Cloudinary (images, video, audio) |
| Email | Resend |
| Payments | Paystack (primary), PayPal (stub) |
| Shipping | Shippo (international), SendBox (Nigeria domestic) |
| Real-time | Soketi (self-hosted Pusher-compatible) |
| CSS | TailwindCSS |
| State | Pinia + pinia-plugin-persistedstate |
| Validation | Zod |
| i18n | @nuxtjs/i18n v10 (7 languages) |
| PWA | @vite-pwa/nuxt (service worker, offline, install prompt) |

---

## 2. Project Structure

```
marketX/
├── layers/                     # Feature layers (Nuxt extends)
│   ├── ai/                     # AI listing generation (Anthropic, OpenAI)
│   ├── core/                   # Auth, base API client, layouts, notifications
│   ├── feed/                   # Feed algorithm, stories, MarketHome
│   ├── seller/                 # Seller dashboard, store management
│   ├── profile/                # User profiles, chat, follow, notifications
│   ├── commerce/               # Products, cart, orders, wallet, shipping, discover
│   ├── social/                 # Posts, comments, likes, shares, stories
│   ├── map/                    # Map view, geolocation, nearby sellers
│   └── square/                 # Market Squares (communities of sellers)
├── server/                     # Root-level Nitro backend
│   ├── api/                    # health.get.ts and root-level routes
│   ├── middleware/              # Global Nitro middleware (auth, rate-limit)
│   ├── plugins/                # monitoring.ts, workers.ts (boot-time)
│   ├── tasks/                  # Nitro scheduled tasks (cron)
│   │   ├── processQueues.ts
│   │   ├── releaseShippedOrders.ts
│   │   └── releaseExpiredOrders.ts
│   └── utils/                  # db.ts, cache.ts, queue.ts, auth/, email/
├── prisma/
│   ├── schema.prisma           # Database schema (50+ models)
│   └── seed.ts                 # Demo data seeder
├── locales/                    # i18n translation files (7 languages)
├── public/icons/               # PWA icons (PNG + SVG)
├── nuxt.config.ts              # Nuxt configuration
├── tailwind.config.ts          # TailwindCSS theme
└── .env                        # Environment variables
```

Each layer follows this internal layout:

```
layers/<name>/
  app/
    components/      # Vue components (auto-imported)
    composables/     # useXxx() composables (auto-imported)
    pages/           # Routes (merged into file-based router)
    services/        # Client-side API wrappers (*.api.ts)
    stores/          # Pinia stores (*.store.ts)
    types/           # TypeScript interfaces
    layouts/         # Layout components (layer-specific)
  server/
    api/             # HTTP route handlers (file-based, *.method.ts)
    services/        # Server-side business logic (*.service.ts)
    repositories/    # Raw Prisma queries (*.repository.ts)
    schemas/         # Zod validation schemas (*.schema.ts)
  nuxt.config.ts     # Layer-specific config (rarely needed)
```

---

## 3. Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| Vue components | PascalCase | `PostCard.vue`, `CartSidebar.vue` |
| Composables | camelCase with `use` prefix | `usePost.ts`, `useCart.ts` |
| Pinia stores | camelCase with `.store.ts` | `post.store.ts`, `cart.store.ts` |
| API services (client) | camelCase with `.api.ts` | `post.api.ts`, `cart.api.ts` |
| Server repositories | camelCase with `.repository.ts` | `post.repository.ts` |
| Server services | camelCase with `.service.ts` | `post.service.ts` |
| Zod schemas | camelCase with `.schema.ts` | `post.schema.ts` |
| Server API routes | `[method].ts` suffix | `index.get.ts`, `index.post.ts` |
| Nitro tasks | camelCase | `processQueues.ts` |
| Queue files | domain + `.queue.ts` | `audit.queue.ts` |

### Variables & Functions

| Type | Convention | Example |
|---|---|---|
| Reactive state | camelCase ref/reactive | `const isLoading = ref(false)` |
| Store actions | camelCase verb | `setFollowStatus`, `appendToFeed` |
| API functions | camelCase verb+noun | `getHomeFeed`, `createPost` |
| Service methods | camelCase verb+noun | `createComment`, `deletePost` |
| Repository methods | camelCase verb+noun | `getPostById`, `createPostLike` |
| TypeScript interfaces | PascalCase with `I` prefix | `IPost`, `IFeedItem`, `ICartItem` |
| TypeScript types | PascalCase | `NotificationJob`, `AuditJob` |
| Enums | PascalCase | `OrderStatus`, `PaymentStatus` |
| DB field names | snake_case | `created_at`, `store_slug` |
| Prisma model names | PascalCase | `Post`, `SellerProfile`, `OrderItem` |

### Routes

```
GET    /api/posts                      → list
POST   /api/posts                      → create
GET    /api/posts/:id                  → get one
PATCH  /api/posts/:id                  → update
DELETE /api/posts/:id                  → delete
POST   /api/posts/:id/like             → nested action
DELETE /api/posts/:id/like             → nested action
GET    /api/posts/:id/comments         → nested list
```

---

## 4. Layered Architecture

Nuxt 4 **extends** lets each feature be a self-contained layer with its own pages, components, composables, stores, and services. The main `nuxt.config.ts` merges them all.

### Layer Load Order

```typescript
// nuxt.config.ts
extends: [
  './layers/ai',       // AI listing generation
  './layers/core',     // Auth, base API client, layouts, notifications
  './layers/feed',     // Feed algorithm, stories, MarketHome
  './layers/seller',   // Seller dashboard, store management
  './layers/profile',  // User profiles, chat, follow, notifications
  './layers/commerce', // Cart, orders, wallet, shipping, products, discover
  './layers/social',   // Posts, comments, likes, shares, stories
  './layers/map',      // Map view, geolocation, nearby sellers
  './layers/square',   // Market Squares
]
```

Later layers override earlier ones when file paths collide.

### Layer Dependency Rules

- `core` has no dependencies on other layers
- All other layers may depend on `core`
- Layers should NOT import from each other horizontally (use shared types or stores)
- Server-side layer structure mirrors the app layer structure

---

## 5. Server Architecture

### Request Flow

```
HTTP Request
  → server/middleware/rate-limit.ts    (Redis-backed rate limiting)
  → server/middleware/auth.global.ts   (attaches user to event.context — passive)
  → layers/[domain]/server/api/file.method.ts  (route handler)
      → requireAuth(event)             (throws 401 if needed)
      → Zod validation
      → remember(cacheKey, ttl, () => service.method())
      → [domain].service.ts
          → [domain].repository.ts
              → Prisma (PostgreSQL)
          → auditQueue.enqueue(...)    (fire-and-forget)
          → notificationQueue.enqueue(...) (fire-and-forget)
      → return { success: true, data: ... }
```

### Auth Middleware — PASSIVE

`server/middleware/auth.global.ts` runs on every request but **never blocks**. It only verifies the JWT and attaches:

```typescript
event.context.auth = { user: { userId: string } }
```

To protect a route, explicitly call `requireAuth(event)` at the top of the handler:

```typescript
export function requireAuth(event: H3Event) {
  const user = event.context.auth?.user
  if (!user?.userId) throw createError({ statusCode: 401, message: 'Unauthorized' })
  return user
}
```

### Rate Limiting

`server/middleware/rate-limit.ts` — Redis-backed (Upstash), falls back to in-memory for dev:

- Strategy: `redis.incr(key)` + `redis.expire(key, windowSec)` — atomic
- Lock key `${key}:lock` applied on limit breach for lockout duration
- Applied per route pattern with configurable limits and windows

### Service / Repository Pattern

```
Route handler    → validates input (Zod), calls service, returns HTTP response
Service          → business logic, orchestration, throws H3 errors
Repository       → raw Prisma queries, no business logic
```

### Error Types

```typescript
// H3 HTTP errors (most common)
throw createError({ statusCode: 404, statusMessage: 'Not found' })

// ZodError → automatically caught and returns 400
```

---

## 6. Database Schema

### Key Models

| Model | Purpose |
|---|---|
| `Profile` | User account (auth, avatar, bio) |
| `SellerProfile` | Store/seller (slug, logo, ship-from address, primarySquareId) |
| `Products` | Sellable items (price, status, variants, squareId) |
| `ProductVariant` | Size/color/SKU variants (stock, price) |
| `Orders` | Customer purchases (payment, shipping, status) |
| `OrderItem` | Line items (variant, qty, price at time of order) |
| `CartItem` | Shopping cart (userId + variantId unique) |
| `Post` | Social posts (caption, visibility, media, squareId, wallTargetType, wallTargetSlug) |
| `Media` | Files (url, type, isBgMusic flag) |
| `Comment` | Threaded comments (parentId for replies) |
| `PostLike` | Post reactions (composite PK: userId + postId) |
| `Follow` | Follow graph (followingType: USER/SELLER) |
| `Notification` | In-app notifications (read, type, actorId) |
| `Story` | Ephemeral stories (expiresAt) |
| `Conversation` | Chat threads (participant1 + participant2/seller) |
| `Message` | Chat messages (isAiResponse flag) |
| `SellerWallet` | Seller earnings (balance, pending_balance) |
| `GlobalShippingZone` | Platform-level shipping rates |
| `AuditLog` | Security audit trail |
| `Session` | Auth sessions (refreshToken, device, IP) |
| `Square` | Market Square (community of sellers; GEOGRAPHIC or CATEGORY type) |
| `SquareMembership` | Seller ↔ Square relationship (PENDING/ACTIVE/SUSPENDED, isPrimary) |
| `SquareOfficer` | Square officer roles (CHAIRMAN, SECRETARY, TREASURER) |
| `SquareWallet` | Square association treasury |
| `SquareTransaction` | Association cut per order |
| `UserSquareFollow` | User follows a Square |
| `SquareAnnouncement` | Pinned announcements within a Square |

### Enums

```prisma
enum ProductStatus    { DRAFT PUBLISHED ARCHIVED }
enum MediaType        { IMAGE VIDEO AUDIO }
enum OrderStatus      { PENDING CONFIRMED COMPLETED CANCELLED PAID SHIPPED DELIVERED RETURNED }
enum PaymentStatus    { UNPAID PENDING PAID FAILED REFUNDED }
enum SquareType       { GEOGRAPHIC CATEGORY }
enum SquareStatus     { PENDING ACTIVE SUSPENDED }
enum MembershipStatus { PENDING ACTIVE SUSPENDED }
enum OfficerRole      { CHAIRMAN SECRETARY TREASURER }
enum NotificationType { ORDER REVIEW PRODUCT GENERAL NEW_COMMENT COMMENT_LIKE REPLY
                        PRODUCT_SHARE NEW_FOLLOWER NEW_POST POST_LIKE MENTION
                        SQUARE_ANNOUNCEMENT SQUARE_MEMBERSHIP_APPROVED SQUARE_MEMBERSHIP_REJECTED
                        WALL_SHOUTOUT }
```

### DB Client Setup

`server/utils/db.ts` — Single Prisma instance per process using `pg.Pool`:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
})

pool.on('error', (err) => console.warn('[db] pg pool error:', err.message))
```

> **Why `pg.Pool` over Neon serverless driver?** Neon's HTTP/WebSocket driver doesn't read `DATABASE_URL` the same way during Nitro's module loading phase. `pg.Pool` + `keepAlive` is reliable with Neon's free-tier auto-suspend.

---

## 7. Auth System

### Token Flow

```
Register/Login → server returns { accessToken, refreshToken }
Client stores:
  - accessToken  → memory (authStore.accessToken)
  - refreshToken → httpOnly cookie (set by server)

Every API request → BaseApiClient injects Authorization: Bearer <accessToken>
accessToken expires → client calls /api/auth/refresh-token
  → server validates refreshToken cookie
  → issues new accessToken + rotates refreshToken
```

### JWT Payload

```typescript
{ userId: string, email: string, iat: number, exp: number }
```

### Password Security

- Argon2id hashing (not bcrypt)
- `FailedLoginAttempt` table — brute force protection with lockout
- `PasswordResetToken` — single-use, expires in 1 hour

### OTP for Guest Checkout

Redis-backed OTP store (`server/utils/auth/otpStore.ts`):
- Key: `otp:checkout:{email}` — expires in 600s
- `verify()` uses `redis.getdel()` — atomic single-use consumption
- Falls back to in-memory Map when Redis is unavailable (dev)

### Client-Side Auth Header

```typescript
// layers/core/app/services/base.api.ts
// Only inject on client — never on server (would cause SSR → server hang)
if (import.meta.client) {
  const token = authStore.accessToken || localStorage.getItem('accessToken')
  if (token) headers['Authorization'] = `Bearer ${token}`
}
```

---

## 8. Caching Layer

`server/utils/cache.ts` uses **Upstash Redis** (REST-based, works serverless).

### Usage

```typescript
import { remember, bust } from '~~/server/utils/cache'

const data = await remember('cache:key', 120, async () => {
  return await prisma.something.findMany(...)
})

await bust('cache:key')           // exact key
await bust('feed:posts:page:*')   // glob pattern (scans + deletes)
```

### Cached Endpoints

| Endpoint | Cache Key | Redis TTL | HTTP max-age |
|---|---|---|---|
| `GET /api/feed/home` | `feed:home:offset:{n}:limit:{n}` | 120s | 60s |
| `GET /api/feed/discover` | `feed:discover:page:{n}:limit:{n}` | 120s | 60s |
| `GET /api/feed/trending` | `feed:trending:v2` | 300s | 180s |
| `GET /api/feed/following` | `feed:following:user:{id}:page:{n}` | 120s | private |
| `GET /api/feed/deals` | `feed:deals:offset:{n}:limit:{n}` | 120s | 60s |
| `GET /api/feed/fresh-drops` | `feed:fresh-drops:offset:{n}:limit:{n}` | 120s | 60s |
| `GET /api/feed/pre-loved` | `feed:pre-loved:offset:{n}:limit:{n}[:cond:{v}]` | 120s | 60s |
| `GET /api/feed/reels` | `feed:reels:offset:{n}:limit:{n}` | 120s | 60s |
| `GET /api/feed/shop-today` | `feed:shop-today` | 180s | — |
| `GET /api/feed/squares/[slug]` | `feed:square:{slug}:offset:{n}:limit:{n}:type:{v}` | 90s | 60s |
| `GET /api/stories` (auth) | `feed:stories:user:{id}:limit:{n}` | 60s | private 30s |
| `GET /api/stories` (anon) | `feed:stories:public:limit:{n}` | 120s | private 30s |
| `GET /api/commerce/categories` | `data:categories` | 3600s | 600s |
| `GET /api/seller/featured` | `feed:sellers:featured:page:{n}:limit:{n}` | 300s | 120s |
| `GET /api/squares` | `squares:list:{limit}:{offset}:{type}:{city}:{state}:{search}` | 300s | 300s |
| `GET /api/map/sellers` | `map:geo-sellers:all` or `map:geo-sellers:{category}` | 300s | — |

> **Creator bypass:** after publishing content, a 30s `creator:bypass:{userId}` key causes the next home/discover request to skip the cache so the creator sees their own content immediately.

Full details: see [caching-strategy.md](./caching-strategy.md).

---

## 9. Job Queue System

Three BullMQ queues, each with its own Redis-backed queue and in-process worker.

### Why BullMQ (not inline)

- Audit logging: was 20ms per request → now 1ms
- Notifications: was 30ms per request → now 1ms
- Emails: was 200ms+ per request → now 1ms

### Architecture

```
server/utils/queue.ts              → exports queueConnection (ioredis | null)
server/queues/audit.queue.ts       → auditQueue.enqueue() + startAuditWorker()
server/queues/notification.queue.ts → notificationQueue.enqueue() + startNotificationWorker()
server/queues/email.queue.ts       → emailQueue.enqueue() + startEmailWorker()
server/plugins/workers.ts          → starts all workers on Nitro boot
```

### Worker Configuration

| Queue | Concurrency | Backoff |
|---|---|---|
| audit | 10 | exponential 2s |
| notification | 20 | exponential 2s |
| email | 5 | exponential 5s |

### Two Redis Instances

| Instance | Library | Purpose |
|---|---|---|
| Upstash Redis | `@upstash/redis` (REST/HTTP) | Caching (`remember()`) |
| Redis Cloud / Railway | `ioredis` (TCP) | BullMQ queues |

BullMQ requires a standard TCP connection — Upstash REST API is incompatible with BullMQ.

### Fallback (no `QUEUE_REDIS_URL`)

Jobs run inline synchronously. No work is lost — behaviour is identical, just slower.

### Eviction Policy

Set BullMQ's Redis instance to **`noeviction`**. `volatile-lru` can evict queued jobs under memory pressure.

---

## 10. Real-time

**Soketi** — self-hosted Pusher-compatible WebSocket server.

### Server-side (emit)

```typescript
import { pusher } from '~~/server/utils/pusher'
await pusher.trigger(`user-${userId}`, 'new-message', { message })
```

### Client-side (subscribe)

```typescript
const { $pusher } = useNuxtApp()
const channel = $pusher.subscribe(`user-${userId}`)
channel.bind('new-message', (data) => { ... })
```

### Channels

- `user-{userId}` — private user notifications, messages
- `store-{storeSlug}` — seller order updates
- `post-{postId}` — live comment/like updates

---

## 11. Payments & Shipping

### Paystack Flow

```
POST /api/commerce/payments/initialize
  → paystack.initializeTransaction({ email, amount, reference })
  → returns { authorization_url }  → redirect user

User pays on Paystack hosted page
  → Paystack redirects to /success?reference=xxx
  → POST /api/commerce/payments/verify
      → if paid: update Order.paymentStatus = PAID
               credit seller wallet
               credit Square association wallet (if seller is in a Square)
               enqueue confirmation email + notifications
```

### Webhook (backup)

`POST /api/commerce/payments/webhook` — handles `charge.success` if the redirect fails.

### Commission Flow

`server/utils/fees.ts` computes platform cut. After payment:
1. `walletService.creditSellersOnPayment(orderId)` — credits seller wallets
2. `squareService.creditAssociationsForOrder(orderId)` — credits Square wallets with `associationCutPercent`

### Shipping

| Provider | Use |
|---|---|
| **Shippo** | International + US domestic |
| **SendBox** | Nigeria domestic |

`GlobalShippingZone` table stores platform-level rates (8 zones seeded via `scripts/seed-shipping.mjs`).

---

## 12. Media Uploads

```
Client → POST /api/media/upload (multipart form)
  → server streams to Cloudinary (signed upload)
  → returns { url, public_id, type }
```

`isBgMusic = true` on `Media` distinguishes background audio tracks from content files.

---

## 13. API Conventions

### Response Format

```typescript
// Single resource
{ success: true, data: T }

// Paginated list
{ success: true, data: T[], meta: { limit, offset, hasMore } }

// Error
{ statusCode: number, message: string }
```

> Note: most paginated endpoints use the **+1 trick** (fetch `limit+1`, slice to `limit`, set `hasMore = rows.length > limit`) — no separate `COUNT(*)` query. The `total` field is absent on these endpoints.

### Pagination

```
?limit=20&offset=0  →  { data[], meta: { limit, offset, hasMore } }
```

### Cache-Control Headers

Set explicitly on cacheable endpoints:

```typescript
setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
```

---

## 14. State Management

All state lives in **Pinia** stores, organised by domain.

| Domain | Store | Persisted |
|---|---|---|
| Auth | `layers/core/app/stores/auth.store.ts` | Yes (token) |
| Profile | `layers/profile/app/stores/profile.store.ts` | No |
| Follow | `layers/profile/app/stores/follow.store.ts` | No |
| Chat | `layers/profile/app/stores/chat.store.ts` | No |
| Notification | `layers/profile/app/stores/notification.store.ts` | No |
| Cart | `layers/commerce/app/stores/cart.store.ts` | Yes (cartItems) |
| Product | `layers/commerce/app/stores/product.store.ts` | No |
| Seller | `layers/seller/app/store/seller.store.ts` | No |

---

## 15. SSR Safety Rules

### DO NOT

```typescript
// ❌ Runs during SSR — causes server-to-server fetch hang
watch(someRef, fetchData, { immediate: true })

// ❌ window/document not available on server
const width = window.innerWidth

// ❌ Auth header injection during SSR causes server loops
headers['Authorization'] = `Bearer ${authStore.accessToken}`
```

### DO

```typescript
// ✅ Only runs on client
onMounted(() => { fetchData() })

// ✅ Client-only guard
if (import.meta.client) { ... }

// ✅ useLazyAsyncData with server: false
const { data } = useLazyAsyncData('key', () => fetchData(), {
  server: false,
  dedupe: 'defer',
})
```

### `dedupe: 'defer'` Rule

The default `dedupe: 'cancel'` cancels in-flight requests when a new caller appears — causing repeated fetches when 3+ components share a key. `defer` queues additional callers to wait for the existing request.

### `ClientOnly` Fallback Rule

Never use a data-fetching component as a `ClientOnly` `#fallback`. The fallback is hydrated on the client before `ClientOnly` switches to the real slot — causing `onMounted` to fire twice and doubling all API calls. Use a lightweight skeleton or empty placeholder instead.

---

## 16. Internationalization

7 languages supported via `@nuxtjs/i18n` v10.

```typescript
i18n: {
  defaultLocale: 'en',
  langDir: 'locales/',
  lazy: true,
  strategy: 'no_prefix',
  locales: [
    { code: 'en', file: 'en.json' },
    { code: 'fr', file: 'fr.json' },
    { code: 'es', file: 'es.json' },
    { code: 'de', file: 'de.json' },
    { code: 'pt', file: 'pt.json' },
    { code: 'zh', file: 'zh.json' },
    { code: 'ar', file: 'ar.json', dir: 'rtl' },
  ],
}
```

---

## 17. Performance Optimizations

### Build

- `nitro.compressPublicAssets: true` — gzip static assets
- `nitro.minify: true` — minify server output
- `vite.build.rollupOptions.manualChunks` — `vendor-vue` (vue, vue-router, pinia) + `vendor-ui` (@vueuse/core)

### Slim Prisma Selects

Two patterns used throughout:

1. **Card select** — minimal fields for listing cards (e.g. `SQUARE_CARD_SELECT` — 10 fields vs 19 in full select)
2. **Feed select** — one media item, one variant, no password/financial fields

### +1 Trick for `hasMore`

All feed and listing endpoints use `take: limit + 1`, slice to `limit`, derive `hasMore = rows.length > limit` — eliminates one `COUNT(*)` query per request.

### In-Flight Guards

Module-level Promise guards in composables prevent duplicate HTTP requests when multiple component instances mount simultaneously:

```typescript
let _inflightSquares: Promise<any> | null = null

async function loadSquares() {
  if (!_inflightSquares) {
    _inflightSquares = squareApi.listSquares({ limit: 8 })
    _inflightSquares.finally(() => { _inflightSquares = null })
  }
  squares.value = (await _inflightSquares).data ?? []
}
```

### Batch Follow Status

After a feed loads, all author follow statuses are checked in one request rather than one per card:

```typescript
const authorIds = feedItems.map(item => item.author.id)
await checkFollowingBatch(authorIds, 'USER', idToUsernameMap)
```

### PWA

Service worker (Workbox via `@vite-pwa/nuxt`):
- Cloudinary images: `CacheFirst`, 30-day TTL, max 200 entries
- API responses: `NetworkFirst`, 5-min TTL, 10s timeout

---

## 18. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require&channel_binding=require

# Cache (Upstash Redis — REST/HTTP)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Job Queues (Standard Redis TCP — NOT Upstash)
QUEUE_REDIS_URL=redis://default:pass@host:port

# Auth
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_UPLOAD_PRESET=xxx   # Must be a restricted preset, not ml_default

# Email
RESEND_API_KEY=re_xxx
SENDER_EMAIL=noreply@marketx.app

# Payments
PAYSTACK_SECRET_KEY=sk_live_xxx   # sk_test_ for dev
PAYSTACK_PUBLIC_KEY=pk_live_xxx   # pk_test_ for dev
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

# Shipping
SHIPPO_API_KEY=shippo_live_xxx
SHIPPO_WEBHOOK_SECRET=xxx
SENDBOX_ACCESS_TOKEN=xxx
SENDBOX_CLIENT_SECRET=xxx
SENDBOX_WEBHOOK_SECRET=xxx

# Real-time (Soketi)
SOKETI_APP_ID=1
SOKETI_KEY=app-key
SOKETI_SECRET=app-secret
SOKETI_HOST=127.0.0.1
SOKETI_PORT=6001
SOKETI_USE_TLS=false

# AI
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GROK_API_KEY=xxx
GOOGLE_API_KEY=xxx

# Platform
PLATFORM_COMMISSION_RATE=0.10
NUXT_PUBLIC_SITE_NAME=MarketX
NUXT_PUBLIC_BRAND_DOMAIN=marketx.app
NUXT_PUBLIC_BASE_URL=https://marketx.app
NODE_ENV=production
```

---

## 19. Scheduled Tasks

Nitro tasks run server-side on a cron schedule (require always-on server — not compatible with Vercel/Netlify serverless):

```typescript
// nuxt.config.ts
nitro: {
  experimental: { tasks: true },
  scheduledTasks: {
    '* * * * *':    ['processQueues'],        // Every minute
    '0 */6 * * *':  ['releaseShippedOrders'], // Every 6 hours
    '*/15 * * * *': ['releaseExpiredOrders'], // Every 15 minutes
  }
}
```

### `processQueues`

Health-check stub. BullMQ workers (started via `server/plugins/workers.ts`) process jobs in real-time — no manual draining needed.

### `releaseShippedOrders`

Marks orders `DELIVERED` and releases held funds to seller wallets for orders that have been `SHIPPED` for 7+ days without buyer confirmation. Notifies both buyer and seller.

### `releaseExpiredOrders`

Cancels `PENDING/UNPAID` orders older than 30 minutes and restores stock for each line item. Notifies buyer.

---

## 20. Key Decisions & Trade-offs

### Why Layered Architecture?

Features are large enough to warrant isolation. `commerce` shouldn't import from `social` internals. Layers enforce domain boundaries and let features be developed independently.

### Why `pg.Pool` over Neon Serverless Driver?

Neon's `@neondatabase/serverless` driver caused "user not found" errors defaulting to the OS username during Nitro's server module loading phase. `pg.Pool` + `keepAlive` is reliable with Neon's TCP endpoint.

### Why Two Redis Instances?

- **Upstash** (REST/HTTP) — works serverless, no persistent TCP connection. Only for caching.
- **Redis Cloud** (TCP) — BullMQ requires ioredis which needs a persistent TCP connection. Upstash REST API is incompatible with BullMQ.

### Why BullMQ over In-Memory Queue?

In-memory queues lose jobs on server restart. BullMQ persists jobs in Redis with retries, stalled job recovery, and dead-letter sets. Critical for audit trails and transactional emails.

### Why Passive Auth Middleware?

Blocking all unauthenticated requests in middleware would break public pages (feed, product detail, store profiles). Passive middleware lets public routes work while protected routes explicitly call `requireAuth(event)`.

### Why `dedupe: 'defer'` in `useLazyAsyncData`?

The default `dedupe: 'cancel'` cancels in-flight requests when a new caller appears, triggering a fresh fetch — causing exponential duplicate calls when 3+ components share a key. `defer` queues additional callers to wait for the existing request.

### Why Fire-and-Forget for Audit/Notifications?

`await auditService.logUserAction()` added 20-50ms to every mutating request. Audit logs are non-critical for the HTTP response. Queuing drops latency to 1ms and isolates audit/notification failures from the main request path.

### Why Squares?

Nigerian physical markets (Computer Village, Balogun, Bodija) are clusters of sellers operating under a shared identity. Squares model this digitally — sellers apply to join, officers govern membership, and a percentage of each transaction is credited to the Square's association wallet.

### Wall Feature — Post Model Extension vs New Table

The wall reuses the existing `Post` model with two nullable columns (`wallTargetType: USER | STORE`, `wallTargetSlug: string`). When both are null, the post is a normal social/commerce post. When set, the post is a wall shoutout on another user's or store's wall.

**Why not a separate table?** Reusing `Post` means all existing infrastructure — likes, comments, notifications, media attachments, the `postInclude` select shape — works on wall posts without duplication.

**Critical filter:** Every post-feed repository query (`getPosts`, `getPostsByAuthorIds`, `getPostsByUserId`, `count`) must include `wallTargetType: null` in the where clause. Without it, wall shoutouts leak into the home feed, following feed, and profile tab. This filter lives at the repository layer so all callers benefit automatically.

### `Unsupported("vector(1536)")` for pgvector

The `Embedding.embedding` column is `vector(1536)` — a pgvector type Prisma cannot natively serialize. It is declared as `Unsupported("vector(1536)")?` in `schema.prisma` so that `prisma db push` and `prisma migrate dev` know the column exists and will not drop it. All reads and writes to this column must use `prisma.$queryRaw` / `prisma.$executeRaw`. Never run `prisma db push --accept-data-loss` on this project.

---

## 21. AI & Semantic Search

The `layers/ai/` layer serves **Dassah** (the conversational assistant, a separate repo/deployment) over internal-only endpoints guarded by `requireDassahInternal` (`X-Dassah-Internal: $DASSAH_INTERNAL_KEY`). Dassah owns no commerce data — it reads MarketX through these endpoints.

### Two retrieval paths — keep them separate

MarketX exposes product/seller/square data to the assistant two distinct ways. When adding or changing a search surface, be deliberate about which one you're touching.

| | **Embeddings (semantic)** | **Raw query (keyword / attribute)** |
|---|---|---|
| **What** | meaning-based recall via pgvector cosine | exact `ILIKE` / column filters / id lookups |
| **Endpoint** | `POST /api/ai/search` (text → embed → cosine) | `GET /api/commerce/products?search=`, `GET /api/search`, `GET /api/commerce/products/by-slug/{slug}`, `GET /api/squares/{slug}`, `?squareSlug=`, `?sellerId=` |
| **Backed by** | `Embedding` table (`vector(1536)`) | normal Prisma queries over `Products`/`SellerProfile`/`Square` |
| **Good for** | "modest wear" → abaya/kaftan; vibe/synonym discovery across all 3 entity types | exact titles, price bounds, one product/store/market by slug |
| **Cost** | one OpenAI embed call per query | none |

**Rule of thumb:** if the caller needs *meaning*, it goes through `/api/ai/search`. If it needs *exactness*, it goes through the commerce/search/squares REST endpoints. Nothing else should call OpenAI or read the `Embedding` vector column.

### The embedding pipeline (write path)

`entity-embedder.service.ts` runs **fire-and-forget** after any product/seller/square create or update:
1. Builds a rich text blob (`buildProductText` / `buildSellerText` / `buildSquareText`) from the full AI context (`ai-context.service.ts`).
2. SHA-256 hashes it; **skips OpenAI + the DB write if the hash is unchanged** (idempotent, cheap).
3. Embeds via the shared `embedText()` in `layers/ai/server/utils/openai-embedding.ts` (`text-embedding-3-small`, 1536-dim) and writes the vector with `$executeRaw` (pgvector is not Prisma-serializable — see §20).
4. Stores enriched **metadata** alongside the vector — for products: `title`, `description` (≤300, plain text), `condition`, `discount`, `averageRating`/`totalReviews`, `categories`, `tags`, `imageUrl`, `inStock`, `inStockSizes`, `sellerName`. This is what search results carry back, so a hit is **card-ready without a second fetch**.

> `embedText()` is the single source of truth for the model + dimensions, shared by the write path (embedder) and the read path (`/api/ai/search`), so they can never drift.

### Endpoint map (`layers/ai/server/api/ai/`)

| Endpoint | Purpose | Path type |
|---|---|---|
| `POST /api/ai/search` | **semantic** search (embed query → cosine), returns products/sellers/squares by relevance | embeddings |
| `POST /api/ai/embeddings/search` | low-level cosine search over a **pre-computed** vector (used by Dassah's passive RAG hint) | embeddings |
| `POST /api/ai/embeddings/upsert` | store a vector for an entity (Dassah's batch indexer) | embeddings |
| `GET /api/ai/context/{product\|seller\|square}/{id}` | full structured context for one entity | raw query |
| `GET /api/ai/context/batch` | paged context for the indexer | raw query |
| `GET/PUT /api/ai/profile/{userId}` | user AI profile (measurements, preferences) | raw query |
| `POST /api/ai/logs/{turn\|guard}` | turn + guardrail logging | raw query |

All of the above are **rate-limit-excluded** (`server/middleware/rate-limit.ts`) and must never be exposed through the public gateway.

---

*Last updated: July 2026*
