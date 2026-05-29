# Engineering Docs

> Source of truth for the technical architecture of MarketX. Updated by Mapida or Joshua when the system changes. No undocumented changes to infrastructure or environment variables.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Nuxt 3, Vue 3, TypeScript | Server-rendered web app |
| Styling | Tailwind CSS | UI — utility-first |
| Backend | Nuxt server (H3) | API routes — co-located with frontend |
| Database | PostgreSQL via Prisma ORM | Primary data store |
| Cache | Redis — Upstash | Map queries, feed, geo data (5-min TTL) |
| Payments | Paystack | Checkout, webhooks |
| AI — Listing | OpenAI GPT-4o (vision) | Photo → product listing + social captions |
| AI — Assistant | Dassa (Socket.io service) | Buyer conversational shopping assistant |
| AI — Search | Vector embeddings | Semantic product and seller search |
| Map | MapLibre GL JS | Interactive map rendering |
| Map Tiles | Stadia Maps (dark), OpenFreeMap (streets) | Tile providers — free tier |
| Media Storage | Cloud storage | Product images and video |
| Auth | JWT — server-side sessions | Buyer and seller authentication |

---

## Repository Structure

```
marketX/
├── layers/
│   ├── core/        — Shared utilities, base API client, error handling, auth middleware
│   ├── auth/        — Registration, login, password reset, session management
│   ├── feed/        — Home feed, fresh drops, reels
│   ├── map/         — GPS map, Market Squares, geo search, store preview
│   ├── commerce/    — Products, cart, checkout, orders, Paystack integration
│   ├── profile/     — Buyer/seller profiles, follow system, wall, shoutouts
│   ├── seller/      — Seller dashboard, storefront management, messaging inbox
│   ├── ai/          — Dassa chat, listing generator, AI context API, embeddings, guard rails
│   └── admin/       — User management, listing moderation, team chart
├── server/
│   └── utils/       — Prisma DB client, Redis cache, logger, request ID middleware
├── prisma/
│   └── schema.prisma — Full database schema
└── nuxt.config.ts   — Global config, CSP headers, layer registration, runtime config
```

---

## Key Database Models

| Model | Description |
|---|---|
| `User` | Buyer account — linked to follows, orders, Dassa sessions |
| `SellerProfile` | Trader storefront — slug, name, logo, lat/lng, business hours, premium, verified |
| `Products` | Listing — title, price, discount, deal flag, media, variants, status |
| `Square` | Market zone — geographic or category type, lat/lng, member count |
| `SquareMembership` | Links a seller to a Square — isPrimary flag |
| `Order` | Transaction record — buyer, seller, product, Paystack reference |
| `Message` | Buyer-seller conversation thread |

---

## API Structure

All endpoints under `/api/`. No public endpoints outside this prefix.

| Prefix | Responsibility |
|---|---|
| `/api/auth/` | Login, register, reset password |
| `/api/map/` | Geo seller query, store preview, Market Squares |
| `/api/commerce/` | Products, categories, cart, orders, Paystack webhook |
| `/api/profile/` | Buyer/seller profiles, follow/unfollow, wall |
| `/api/seller/` | Storefront management, dashboard, messaging |
| `/api/ai/` | Listing generator, Dassa context, embeddings, conversation logs, guard rail logs |
| `/api/admin/` | User moderation, listing review |

---

## Caching Strategy

| Data | Cache Key | TTL | Invalidation |
|---|---|---|---|
| All geo sellers | `map:geo-sellers:all` | 5 min | Manual on seller update |
| Sellers by category | `map:geo-sellers:{categorySlug}` | 5 min | Manual on product update |
| Feed deals | `feed:deals:{sellerId}` | 5 min | Manual on deal change |
| Square memberships | `feed:squares:{sellerId}` | 5 min | Manual on membership change |

Search queries always bypass cache. Paystack webhooks and auth routes bypass cache.

---

## AI Systems

### Listing Generator
- **Endpoint:** `POST /api/ai/generate-listing`
- **Model:** OpenAI GPT-4o (vision)
- **Input:** Product photo (base64) + optional hint
- **Output:** Title, description, suggested price, Instagram caption, Facebook post, Pinterest description
- **Error handling:** OpenAI failures return 503 with logged error — seller sees a retry prompt

### Dassa (AI Shopping Assistant)
- **Transport:** Socket.io — connects to external Dassa service
- **Session types:** `buyer` | `seller`
- **Events:** `session:type`, `chat:history`, `chat:send`, `chat:message`, `chat:typing`
- **Guard rails logged to:** `POST /api/ai/logs/guard`
  - `PROMPT_INJECTION` — adversarial input detected
  - `PII_DETECTED` — personal data in message
  - `UNAUTHORIZED_TOOL` — tool call outside scope
  - `RATE_LIMIT` — frequency exceeded
- **Internal routes** require `X-Dassah-Internal` header — not browser-accessible

### AI Context API
- Provides structured seller, product, and Square data to Dassa's knowledge base
- Supports single-entity fetch and paginated batch sync with `updatedSince` filter
- Endpoints: `/api/ai/context/seller/[id]`, `/api/ai/context/product/[id]`, `/api/ai/context/square/[id]`, `/api/ai/context/batch`

---

## Map System

- **Renderer:** MapLibre GL JS (loaded client-side only via dynamic import)
- **Tile providers:**
  - Dark mode: Stadia Maps `alidade_smooth_dark` — free for development
  - Streets: OpenFreeMap `liberty` — fully free, no key
  - Satellite: MapTiler — requires API key for production
- **Bounds:** Nigeria only — `[[2.69, 4.24], [14.68, 13.87]]`
- **Cluster zoom threshold:** 13 — below this, store count clusters appear; above, individual pins
- **Pin visibility:** controlled via CSS class on MapLibre canvas container (`pins-hidden`, `hide-square-pins`)
- **View mode toggle:** Stores / Both / Squares — filters pin and cluster visibility without re-fetching data

---

## Security

| Control | Implementation |
|---|---|
| CSP headers | Strict `connect-src` and `img-src` — tile providers, Paystack, Upstash, Nominatim whitelisted |
| Auth guards | Server middleware — all protected routes require valid session |
| Input validation | All query params bounded at API layer (e.g. radius ≤ 20,000km, limit ≤ 200) |
| AI internal routes | `X-Dassah-Internal` header required — blocks direct browser access |
| Payment data | Never stored — Paystack handles all card data |
| Location data | Browser cache only (1-hour TTL) — not persisted server-side |

---

## Environment Variables

| Variable | Used By | Who Manages |
|---|---|---|
| `DATABASE_URL` | Prisma | Joshua / Mapida |
| `REDIS_URL` | Upstash cache | Joshua / Mapida |
| `PAYSTACK_SECRET_KEY` | Paystack checkout | Joshua |
| `PAYSTACK_PUBLIC_KEY` | Paystack frontend | Joshua |
| `OPENAI_API_KEY` | Listing generator | Joshua |
| `DASSA_SOCKET_URL` | Dassa chat service | Joshua / Mapida |
| `DASSAH_INTERNAL_SECRET` | AI internal route auth | Joshua / Mapida |
| `JWT_SECRET` | Auth sessions | Joshua / Mapida |
| `MAPTILER_API_KEY` | Satellite map tiles | Joshua |

> **Rule:** No environment variable is added, changed, or removed without being documented here first. All variables must exist in the `.env.example` file in the repository.

---

## Deployment

- **Runtime:** Node.js — Nuxt SSR
- **Deployment trigger:** Manual — CEO or Mapida via agreed process
- **Branch strategy:** `main` is production. All work via feature branches + pull requests
- **No direct commits to `main`**

---

## Engineering Rules

1. All work starts with a Notion task card — no task, no branch
2. Branch naming: `[notion-task-id]/short-description`
3. PR description must reference Notion task ID
4. No self-merges on shared features — CEO or peer review required
5. P0 hotfixes may skip review with CEO verbal approval — must be documented after
6. Any change to `.env`, database schema, or API contracts must be communicated to the team before merging
7. `schema.prisma` changes require a migration file — no raw DB edits in production
