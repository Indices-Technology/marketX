# Feature Backlog

> **Rule:** Nothing gets built unless it has an owner, deadline, and deliverable defined. Status must be updated at every sprint.

---

## Priority Key

| Label | Meaning |
|---|---|
| P0 | MVP — blocks launch |
| P1 | MVP — important but not blocking |
| P2 | Phase 2 — post-validation |
| P3 | Phase 3 — scale |

---

## Status Key

`Idea` → `Planned` → `In Progress` → `Testing` → `Done`

---

## Buyer Features

| Feature | Priority | Status | Owner | Notes |
|---|---|---|---|---|
| Registration and authentication | P0 | Done | | |
| GPS map discovery | P0 | Done | | Radius, filter, Market Squares |
| Store and product browsing | P0 | Done | | With media and reels |
| Seller messaging (buyer side) | P0 | Done | | |
| Paystack checkout | P0 | Done | | |
| Follow stores + activity wall | P1 | Done | | |
| Feed — fresh drops and reels | P1 | Done | | Falls back to older products if <7 days |
| Dassa AI shopping assistant | P1 | Done | | Socket.io, buyer session mode |
| Deep-link store from product page | P1 | Done | | ?store=slug query param |
| Mobile bottom sheet (store preview) | P1 | Done | | Peek + expand, safe-area aware |
| Order tracking via Dassa | P2 | Planned | | |
| Product review and rating system | P2 | Planned | | |
| Buyer notifications | P2 | Planned | | |
| Saved stores and wishlists | P2 | Planned | | |
| Personalised feed (AI) | P3 | Idea | | |

---

## Seller Features

| Feature | Priority | Status | Owner | Notes |
|---|---|---|---|---|
| Seller registration and authentication | P0 | Done | | |
| Storefront setup (logo, bio, hours, location) | P0 | Done | | |
| Product listing with media upload | P0 | Done | | Photos, video, variants |
| AI listing generator | P0 | Done | | GPT-4o vision → title, description, social captions |
| Messaging inbox | P0 | Done | | |
| Online/offline status | P1 | Done | | |
| Verified badge + premium tier | P1 | Done | | |
| Business hours display | P1 | Done | | |
| Seller dashboard (orders, stats) | P1 | In Progress | | |
| Seller analytics (views, follows, sales) | P2 | Planned | | |
| Bulk product upload | P2 | Planned | | |
| Deal scheduling | P2 | Planned | | |
| Seller pin self-service (drag to fix location) | P2 | Planned | | |
| AI seller insights | P3 | Idea | | Price intelligence, demand forecasting |
| Seller subscription tiers | P3 | Idea | | |

---

## Discovery / Map Features

| Feature | Priority | Status | Owner | Notes |
|---|---|---|---|---|
| Market Squares as map zones | P1 | Done | | Geographic + category types |
| Stores ↔ Squares toggle on map | P1 | Done | | Three-state: Stores / Both / Squares |
| Deal / verified / premium filters | P1 | Done | | |
| Radius slider | P1 | Done | | |
| Mobile search on map | P1 | Done | | Debounced, top bar |
| Category filter on map | P2 | Planned | | API ready, UI pending |
| Promoted/pinned listings on map | P3 | Idea | | |

---

## Platform / Infrastructure

| Feature | Priority | Status | Owner | Notes |
|---|---|---|---|---|
| Admin panel — user management | P1 | In Progress | | |
| Admin panel — listing review | P1 | In Progress | | |
| Redis caching (map + feed) | P1 | Done | | 5-minute TTL |
| Guard rails (Dassa safety) | P1 | Done | | Prompt injection, PII, rate limit |
| AI context API (products, sellers, squares) | P1 | Done | | Batch + incremental sync |
| Vector embeddings + semantic search | P2 | Done | | |
| Push notifications | P2 | Planned | | Web + PWA |
| Affiliate / referral programme | P3 | Idea | | |
| Multi-city expansion | P3 | Idea | | Abuja, PH, Kano |
| Native mobile app | P3 | Idea | | iOS + Android |
