# System Design

## Overview

MarketX is a full-stack web application built on Nuxt 3. It follows a layered monorepo architecture where each product domain (map, feed, AI, commerce, etc.) is a self-contained Nuxt layer with its own pages, components, composables, server routes, and services.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Nuxt 3, Vue 3, TypeScript, Tailwind CSS |
| Backend | Nuxt server (H3), server routes as API endpoints |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis (Upstash) — map, feed, and geo queries |
| Payments | Paystack |
| AI — Listing | OpenAI GPT-4o (vision) |
| AI — Assistant | Dassa service (Socket.io, custom AI backend) |
| AI — Search | Vector embeddings (semantic search) |
| Map | MapLibre GL JS, Stadia Maps (dark tiles), OpenFreeMap (streets) |
| Media | Cloud storage for product images and video |
| Auth | JWT-based session, server-side |
| Hosting | Server-rendered (SSR), Node.js |

---

## Layer Architecture

```
marketX/
├── layers/
│   ├── core/          # Shared utilities, base API client, error handling, auth guards
│   ├── auth/          # Registration, login, password reset
│   ├── feed/          # Home feed, fresh drops, reels
│   ├── map/           # Map discovery, Market Squares, geo search
│   ├── commerce/      # Products, cart, checkout, orders, Paystack
│   ├── profile/       # Buyer and seller profiles, follow system, wall
│   ├── seller/        # Seller dashboard, storefront management, messaging
│   ├── ai/            # Dassa chat, listing generator, AI context API, embeddings
│   └── admin/         # User management, listing moderation
├── server/
│   └── utils/         # DB client (Prisma), cache (Redis), logger, request ID
├── prisma/
│   └── schema.prisma  # Database schema (all models)
└── nuxt.config.ts     # Global config, CSP headers, layer registration
```

---

## Key Data Models

### SellerProfile
Represents a trader's storefront. Core fields: `store_slug`, `store_name`, `store_logo`, `latitude`, `longitude`, `businessHours`, `isPremium`, `is_verified`, `hideLocation`, `lastActiveAt`.

### Products
A seller's listing. Core fields: `title`, `price`, `discount`, `isDeal`, `dealEndsAt`, `status` (DRAFT / PUBLISHED), `media`, `variants`, `sellerId`, `squareId`.

### Square
A geographic or category market zone. Core fields: `name`, `slug`, `type` (GEOGRAPHIC / CATEGORY), `latitude`, `longitude`, `memberCount`.

### SquareMembership
Links a seller to a Square. `isPrimary` flag marks the seller's main market.

### User
Buyer account. Linked to follows, orders, and Dassa conversation history.

---

## Map System

```
Buyer opens map
      │
      ▼
GET /api/map/sellers?lat=X&lng=Y&radius=50
      │
      ▼
mapService.getNearby()
  ├── Cache hit (Redis, 5-min TTL) → return cached seller list
  └── Cache miss → mapRepository.getAllGeoSellers()
        │
        ▼
  Haversine distance filter + sort by proximity
  Apply filter (deals / premium / verified)
  Slice for pagination
        │
        ▼
Return { data: IMapSeller[], meta: { total, hasMore } }
```

**Deep-link flow** (`?store=slug`):
1. Fetch store preview (no location required)
2. Use store's own coordinates to bootstrap map centre
3. Fetch nearby sellers from that point
4. Inject the target store into results (handles `hideLocation` edge case)
5. Auto-select and expand the store's bottom sheet

---

## AI Listing Generator

```
Seller uploads product photo
        │
        ▼
POST /api/ai/generate-listing
  ├── Image → base64
  ├── GPT-4o vision prompt (title, description, price, social captions)
  └── Response parsed and returned as structured JSON
        │
        ▼
Seller reviews and edits → publishes listing
```

---

## Dassa AI Assistant

```
Buyer opens chat
      │
      ▼
useDassaSocket → Socket.io connection to Dassa service
  ├── session:type → 'buyer' or 'seller'
  ├── chat:history → restore previous conversation
  ├── chat:send → user message
  ├── chat:message → AI response (with optional product cards, cart update, order tracking)
  └── chat:typing → typing indicator
```

**Guard rails** (logged to `/api/ai/logs/guard`):
- `PROMPT_INJECTION` — detected adversarial input
- `PII_DETECTED` — personal data in message
- `UNAUTHORIZED_TOOL` — tool call outside permitted scope
- `RATE_LIMIT` — request frequency exceeded

---

## Caching Strategy

| Data | Cache Key | TTL |
|---|---|---|
| All geo sellers | `map:geo-sellers:all` | 5 min |
| Sellers by category | `map:geo-sellers:{slug}` | 5 min |
| Active deals (feed) | `feed:deals:{sellerId}` | 5 min |
| Square memberships | `feed:squares:{sellerId}` | 5 min |

Cache is invalidated manually on seller update or product publish. Search queries bypass cache.

---

## API Structure

All endpoints live under `/api/`. Key groups:

| Prefix | Responsibility |
|---|---|
| `/api/auth/` | Login, register, reset password |
| `/api/map/` | Sellers geo-query, seller preview, squares |
| `/api/commerce/` | Products, categories, cart, orders, Paystack webhook |
| `/api/profile/` | Buyer and seller profiles, follow/unfollow, wall |
| `/api/seller/` | Storefront management, dashboard data |
| `/api/ai/` | Listing generator, Dassa context, embeddings, logs |
| `/api/admin/` | User and listing moderation |

---

## Security

- **CSP headers** — strict `connect-src` and `img-src` whitelisting tile providers, Paystack, and Upstash
- **Auth guards** — server middleware enforces session on all protected routes
- **Dassa internal routes** — require `X-Dassah-Internal` header; not accessible from browser
- **Input validation** — all query params parsed and bounded at API layer (e.g. radius capped at 20,000km, limit capped at 200)
- **Rate limiting** — applied at Dassa guard rail level; platform-level rate limiting planned for Phase 2
