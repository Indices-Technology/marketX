# Joshua Akibu

**Full-Stack Engineer — Product Architecture, AI Systems & Platform Integrations**

📍 `[City, Nigeria]` · ✉️ joshuaakibu@gmail.com · 📱 `[phone]` · GitHub: `[github.com/joshbj360]` · LinkedIn: `[url]`

---

## Profile

Full-stack engineer and technical founder who builds and ships production commerce infrastructure end to end — schema and payments through to design system and CI. Currently architecting **MarketX**, a Nigerian social-commerce and escrow/trust platform, and **DasahAI**, its conversational agent layer.

Depth in three areas that are hard to fake: **messaging platform integrations** (WhatsApp Cloud API and the Meta Graph surface, including the business-verification and template-approval gauntlet), **LLM application engineering** (multi-provider tool-calling agents, RAG over pgvector, prompt-injection guardrails), and **payments/logistics integration** for the Nigerian market.

Works close to the metal on the things that break in production: idempotency, queue semantics, webhook signature verification, cache invalidation, and rate limiting.

---

## Core Technical Skills

| | |
|---|---|
| **Languages** | TypeScript (primary), JavaScript, SQL, HTML/CSS |
| **Frontend** | Nuxt 4, Vue 3 (Composition API), Pinia, Tailwind CSS, PWA (Vite PWA), i18n, MapLibre GL / Leaflet |
| **Backend** | Nitro / H3, Node.js, Express, REST API design, layered service/repository architecture |
| **Data** | PostgreSQL, Prisma 7, Neon serverless Postgres, pgvector, Redis (Upstash), schema design & migrations |
| **Async & Realtime** | BullMQ workers, job retry/backoff/dead-letter/dedupe, Pusher / Soketi, Socket.IO, cron/scheduled tasks |
| **AI / LLM** | Anthropic Claude SDK, OpenAI API, Vercel AI SDK, tool-calling agents, RAG, embeddings, vision models, prompt engineering, LLM guardrails |
| **Integrations** | WhatsApp Cloud API, Meta Graph API (Facebook/Instagram), TikTok API, Google Business Profile, Paystack, PayPal, Cloudinary, Resend, GIG Logistics, Sendbox, Shippo |
| **Security** | JWT access/refresh sessions, Argon2, OAuth 2.0 (consumer *and* provider), HMAC webhook verification, rate limiting, XSS sanitisation, audit logging, CSP |
| **Testing & QA** | Playwright (API, E2E, mobile, visual snapshots), Vitest, axe-core accessibility audits, Lighthouse performance CI |
| **Tooling** | Git, Docker / Docker Compose, Vercel, ESLint/Prettier, Zod validation, monorepo & layer architecture |

---

## Selected Experience

### Founder & Lead Engineer — **MarketX** *(Indices)* · `[Month Year]` – Present

Social-commerce and escrow/trust platform for the Nigerian market. Sole architect and principal engineer; also own product roadmap, vendor relationships and team direction.

**Scale of the codebase:** Nuxt 4 modular monolith split into **17 domain layers** (commerce, payments, shipping, growth, reputation, AI, support, square, POD…), ~**850 TypeScript modules**, ~**280 Vue components**, **384 API route handlers**, **95 test suites**, ~315k lines contributed.

**Architecture & platform**
- Designed a layer-based modular monolith so each domain (payments, shipping, growth) owns its own routes, services, repositories and components — extractable into standalone services without a rewrite.
- Built a shared caching and idempotency toolkit (`remember` for single-flight reads, `once` for write idempotency) covering payment retries, queue dedupe keys and client-side GET deduplication.
- Ran Prisma migrations against Neon Postgres, including diagnosing pooler advisory-lock deadlocks and routing DDL over the direct connection.
- Implemented BullMQ queue infrastructure with exponential backoff, stalled-job reclaim, dead-letter inspection and idempotent enqueue.

**Authentication & security**
- Built the full auth stack: Argon2 password hashing, JWT access/refresh with server-side session records, device/IP audit trails, per-endpoint rate limiting with lockout, and account moderation gates enforced at every session-minting door.
- Implemented OAuth 2.0 as a **consumer** (Google, Facebook, TikTok) *and* as a **provider** — MarketX issues identities to the DasahAI client.
- Hardened all inbound webhooks with HMAC-SHA256 signature verification using constant-time comparison, failing closed in production.

**Payments & logistics**
- Integrated Paystack (and PayPal) behind a provider-registry abstraction with platform fee splits, seller payouts, transfer-fee accounting and idempotent payment handling.
- Built a shipping orchestrator over GIG Logistics, Sendbox and Shippo — zone resolution, multi-carrier pricing with markup, signed shipping quotes and booking with webhook status callbacks.
- Shipped escrow-style order flows including disputes, refunds and seller-credit reversal.

**Growth & distribution**
- Built a Growth Engine: shareable seller cards with generated QR codes and trackable short links, plus a three-table attribution model (asset → distribution → event).
- Implemented publishing to Facebook Pages / Instagram via the Graph API and to TikTok, plus Google Business Profile connection — working within Meta's Nigeria-specific commerce restrictions.

**Quality**
- Playwright suite across API, desktop E2E, mobile E2E and audit projects (axe-core accessibility + Lighthouse), with a documented pass baseline and visual snapshot testing.

---

### WhatsApp Business Platform — Integration Highlight

Owned the WhatsApp channel end to end, from Meta business verification through to production message delivery.

- **Platform provisioning:** stood up a WhatsApp Business Account, completed business verification, registered and verified the production sending number, and navigated display-name review — including distinguishing which review gates actually block sending and which don't.
- **Cloud API integration** against Meta **Graph API v21.0**: template message sends with body variable substitution, language localisation (`en_US`), and correct handling of the Copy-Code **button component** as a payload separate from the body — a common failure point for authentication templates.
- **Template lifecycle management** across AUTHENTICATION / UTILITY / MARKETING categories, designing around Meta's 24-hour customer-service window rule for business-initiated messages.
- **Passwordless phone auth:** built signup and login via WhatsApp-delivered OTP — E.164 normalisation, single-use OTP store, IP-scoped rate limiting (5 attempts / 15 min with lockout), auto-registration on first verify, session minting with audit logging, and a separate *attach-verified-phone* flow for existing accounts with one-phone-per-account uniqueness enforcement (409 on collision).
- **Transactional notifications** routed through WhatsApp for high-value events only, with an explicit eligibility allowlist to conserve template-message budget rather than spraying every notification type at sellers.
- **Webhook pipeline:** GET verify-token handshake plus signed POST receiver validating `x-hub-signature-256`, traversing Meta's batched `entry[].changes[]` envelope (rather than assuming a single event), and recording sent/delivered/read/failed delivery status.
- **Reliable delivery** via a dedicated BullMQ queue — fire-and-forget producer, 3-attempt exponential backoff, dead-letter retention, and graceful degradation to logged codes when WhatsApp credentials are absent in development.

---

### Architect & Engineer — **DasahAI** *(conversational commerce agent)* · `[Month Year]` – Present

Multi-provider LLM agent that lets buyers shop and sellers run their entire store through chat. Node/Express + Socket.IO API, BullMQ worker, Postgres/pgvector, deployed via Docker Compose.

**Multi-provider agent runtime**
- Built a single chat interface over **two providers**: Anthropic Claude via `@anthropic-ai/sdk` with a hand-rolled tool-use loop (tool blocks → `tool_result` → multi-turn continuation), and OpenAI via the **Vercel AI SDK** using `generateText` with `stopWhen: stepCountIs(5)` and step introspection.
- Per-user **bring-your-own-key** configuration with encrypted-at-rest API key storage and a server-side model allowlist (Claude Sonnet/Opus/Haiku, GPT-4o family).
- Skill registry with auto-discovery — search, semantic search, cart, payment, logistics and storefront tools exposed as typed, Zod-validated tool schemas shared across both providers.
- Distinct buyer and seller agent personas with rule-based system prompts governing tool preference, confirmation-before-payment, and UI-aware output formatting (product cards, tappable option bullets).

**RAG & embeddings**
- Semantic search over products, sellers and markets using OpenAI `text-embedding-3-small` (1536-dim) with pgvector similarity search and a tuned distance threshold.
- Deliberately routed both write path (entity indexer) and read path (query-time search) through a **single embedding function** so model and dimensions can never drift apart.
- Long-term user memory (size, budget, style preferences) injected into the system prompt for cross-session personalisation.

**LLM safety & guardrails** — a three-stage pipeline on every turn:
1. **Input sanitisation** against prompt-injection patterns (instruction override, persona hijack, system-prompt extraction, control-token smuggling).
2. **Output scanning** with PII redaction (email, Nigerian phone formats, card-like sequences) before responses reach the client.
3. **Tool-input authorisation** — entity IDs used in tool calls must originate from the caller's JWT, preventing the model from acting on hallucinated or cross-tenant identifiers.

**Vision & content generation**
- Built an image-to-listing pipeline using **GPT-4o vision**: a product photo (hosted URL or inline base64) returns structured JSON — title, description, attributes and platform-optimised social captions — auth-gated so it cannot be abused as a free vision API.
- AI description enhancement and bulk-listing generation integrated into the seller onboarding flow.

**Observability** — per-turn logging of latency, tools invoked, model used, RAG hit count and guardrail blocks.

---

## Engineering Practices

- Documentation-first: maintain architecture, security, payments, shipping, caching and reputation-framework specs alongside the code.
- Consistent error handling with structured logging and request-ID tracing across every catch path.
- Strict data-layer discipline — components consume a composable → typed API client, never ad-hoc fetches.
- Design system ownership: token-driven typography and colour, shared base component library, accessibility audited in CI.

---

## Education

`[Degree], [Institution] — [Year]`

## Additional

- **Languages:** `[e.g. English (fluent), …]`
- **Interests / OSS:** `[optional]`

---

*Placeholders in `[brackets]` need your input — dates, education, contact details and links.*
