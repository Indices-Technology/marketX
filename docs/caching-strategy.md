# MarketX Caching Strategy

## Overview

MarketX uses **Upstash Redis** as its caching layer between the Nuxt/Nitro server and the PostgreSQL database (via Prisma).

The goal is simple: **stop hitting the database for the same data repeatedly.**

---

## The Problem Without Caching

```
User A loads feed → DB query (200ms)
User B loads feed → DB query (200ms)   ← same result as A
User C loads feed → DB query (200ms)   ← same result as A and B
...1000 users = 1000 identical DB queries
```

With caching:
```
User A loads feed → DB query (200ms) → store result in Redis
User B loads feed → Redis read (2ms)  ← no DB hit
User C loads feed → Redis read (2ms)  ← no DB hit
...1000 users = 1 DB query + 999 Redis reads
```

---

## What We Cache

### Feed Endpoints

| Endpoint | Cache Key | Redis TTL | HTTP Cache-Control | Notes |
|----------|-----------|-----------|-------------------|-------|
| `GET /api/feed/home` | `feed:home:offset:{offset}:limit:{limit}` | 120s | `public, max-age=60, swr=120` | Creator bypass active |
| `GET /api/feed/discover` | `feed:discover:page:{page}:limit:{limit}` | 120s | `public, max-age=60, swr=120` | Creator bypass active; page = ⌊offset/limit⌋ |
| `GET /api/feed/trending` | `feed:trending:v2` | 300s | `public, max-age=180, swr=300` | Fixed key — no pagination params |
| `GET /api/feed/following` | `feed:following:user:{userId}:page:{page}` | 120s | *(none — per-user)* | Per-user; busted on content creation |
| `GET /api/feed/deals` | `feed:deals:offset:{offset}:limit:{limit}` | 120s | `public, max-age=60, swr=120` | |
| `GET /api/feed/fresh-drops` | `feed:fresh-drops:offset:{offset}:limit:{limit}` | 120s | `public, max-age=60, swr=120` | |
| `GET /api/feed/pre-loved` | `feed:pre-loved:offset:{offset}:limit:{limit}[:cond:{condition}]` | 120s | `public, max-age=60, swr=120` | Optional condition suffix |
| `GET /api/feed/reels` | `feed:reels:offset:{offset}:limit:{limit}` | 120s | `public, max-age=60, swr=120` | |
| `GET /api/feed/shop-today` | `feed:shop-today` | 180s | *(none set)* | Fixed key — curated mix, no params |
| `GET /api/feed/squares/[slug]` | `feed:square:{slug}:offset:{offset}:limit:{limit}:type:{type}` | 90s | `public, max-age=60, swr=90` | |

### Stories

| Endpoint | Cache Key | Redis TTL | HTTP Cache-Control |
|----------|-----------|-----------|-------------------|
| `GET /api/stories` (authenticated) | `feed:stories:user:{userId}:limit:{limit}` | 60s | `private, max-age=30` |
| `GET /api/stories` (anonymous) | `feed:stories:public:limit:{limit}` | 120s | `private, max-age=30` |

### Commerce & Platform

| Endpoint | Cache Key | Redis TTL | HTTP Cache-Control |
|----------|-----------|-----------|-------------------|
| `GET /api/commerce/categories` | `data:categories` | 3600s | `public, max-age=600, swr=3600` |
| `GET /api/seller/featured` | `feed:sellers:featured:page:{page}:limit:{limit}` | 300s | `public, max-age=120, swr=300` |

> `?search=` or `?categorySlug=` on `/seller/featured` **bypasses the cache entirely** — those results are too specific to cache efficiently.

### Squares

| Endpoint | Cache Key | Redis TTL | HTTP Cache-Control |
|----------|-----------|-----------|-------------------|
| `GET /api/squares` | `squares:list:{limit}:{offset}:{type}:{city}:{state}:{search}` | 300s | `public, max-age=300, swr=600` |

### Map

| Endpoint | Cache Key | Redis TTL | Notes |
|----------|-----------|-----------|-------|
| `GET /api/map/sellers` (no filter) | `map:geo-sellers:all` | 300s | All geo sellers pre-fetched; distance filtered in-process |
| `GET /api/map/sellers` (category) | `map:geo-sellers:{categorySlug}` | 300s | |
| `GET /api/map/sellers` (search) | *(no cache)* | — | Search bypasses cache — too targeted |

---

## What We DO NOT Cache

| Endpoint | Why |
|----------|-----|
| `GET /api/commerce/cart` | Per-user, must be real-time |
| `GET /api/commerce/orders/*` | Financial data, must be accurate |
| `GET /api/notifications/*` | Must reflect live state |
| `POST/PATCH/DELETE *` | Write operations, never cached |
| `GET /api/auth/*` | Security-sensitive |
| `GET /api/commerce/payments/*` | Financial, never stale |
| `GET /api/seller/featured?search=` | Too specific to share |

---

## Cache Invalidation Strategy

### Creator Bypass

After a user publishes content (post or product), the server sets a short-lived Redis key:

```ts
redis.set(`creator:bypass:${userId}`, '1', { ex: 30 })
```

The next request from that user within 30 seconds calls `consumeCreatorBypass()` which atomically reads and deletes the flag. If it exists, `remember()` is called with `ttl=0` (immediate DB hit, result not stored):

```ts
const bypass = userId ? await consumeCreatorBypass(userId) : false
const feed = await remember(cacheKey, bypass ? 0 : 120, () => fetchFromDB())
```

This means the creator sees their own content immediately without poisoning the shared cache.

### Following Feed Invalidation

`feed:following:user:{userId}:page:0` is deleted when the user creates a post, so their own following feed shows the new post instantly. Followers' keys are left to expire naturally (120s) — they receive a Soketi notification prompting them to refresh.

---

## Cache Key Naming Convention

```
{domain}:{resource}:{dimension}:{value}[:{dimension}:{value}...]

Examples:
  feed:home:offset:0:limit:20          ← home feed page 1
  feed:home:offset:20:limit:20         ← home feed page 2
  feed:discover:page:0:limit:20        ← discover feed page 1
  feed:following:user:abc123:page:0    ← user abc123's following feed
  feed:deals:offset:0:limit:20         ← deals page 1
  feed:fresh-drops:offset:0:limit:20   ← fresh drops page 1
  feed:pre-loved:offset:0:limit:20     ← pre-loved all conditions
  feed:pre-loved:offset:0:limit:20:cond:LIKE_NEW  ← pre-loved filtered
  feed:reels:offset:0:limit:20         ← reels page 1
  feed:shop-today                      ← curated home shelf (no params)
  feed:trending:v2                     ← trending (no params)
  feed:square:computer-village:offset:0:limit:20:type:all  ← square feed
  feed:stories:user:abc123:limit:20    ← authenticated stories
  feed:stories:public:limit:20         ← anonymous stories
  feed:sellers:featured:page:0:limit:6 ← featured sellers
  data:categories                      ← product categories
  squares:list:8:0:::                  ← squares list (no filters)
  map:geo-sellers:all                  ← all geo sellers
  map:geo-sellers:fashion              ← sellers in fashion category
  creator:bypass:abc123                ← 30s bypass flag after creating content
```

---

## TTL Reference

| TTL | Used For |
|-----|----------|
| 30s | Creator bypass flag |
| 60s (auth) / 120s (anon) | Stories |
| 90s | Square-scoped feed |
| 120s | All main feed endpoints (home, discover, following, deals, fresh-drops, pre-loved, reels) |
| 180s | Shop-today shelf |
| 300s | Featured sellers, map sellers, squares list, trending feed |
| 3600s | Product categories |

---

## The `remember` Helper

```ts
// server/utils/cache.ts
import { remember, forget } from '~~/server/utils/cache'

// Cache a result
const data = await remember('cache:key', 120, async () => {
  return await prisma.something.findMany(...)
})

// Invalidate
await forget('cache:key')
```

`remember()` internally:
1. Checks Upstash Redis for the key
2. If found → return cached value (fast path, ~2ms)
3. If not found → run the DB query → store in Redis → return result
4. If Redis is unavailable → falls through to DB, request never fails

---

## Two Redis Instances

| Instance | Library | Purpose |
|---|---|---|
| Upstash Redis | `@upstash/redis` (REST/HTTP) | Caching (`remember()`) — serverless compatible |
| Redis Cloud / Railway | `ioredis` (TCP) | BullMQ job queues — requires persistent TCP |

BullMQ cannot use Upstash (REST only). They are configured separately: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for cache; `QUEUE_REDIS_URL` for queues.

---

## Module-Level In-Flight Guards

For composables that may be instantiated by multiple components simultaneously (e.g. `useMarketHome` mounted in both a `ClientOnly` slot and its fallback during hydration), a module-level Promise guard prevents duplicate HTTP requests:

```ts
// useMarketHome.ts
let _inflightSquares: Promise<any> | null = null

async function loadSquares() {
  if (!_inflightSquares) {
    _inflightSquares = squareApi.listSquares({ limit: 8 })
    _inflightSquares.finally(() => { _inflightSquares = null })
  }
  const res = await _inflightSquares
  squares.value = res.data ?? []
}
```

This complements server-side Redis caching — the guard deduplicates at the network level within a single page lifecycle.

---

## Monitoring

| Metric | What it means | Action |
|--------|--------------|--------|
| Cache hit rate < 80% | TTLs too short or too many unique keys | Increase TTL or reduce key granularity |
| Redis memory > 80% | Too many keys stored | Add `allkeys-lru` eviction policy |
| DB query time spikes | Cache stampede | Check for simultaneous invalidations |
| Upstash request count | Daily Redis ops | Monitor against free tier limits |
