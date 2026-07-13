# Milestone 2 — Acceptance Checklist

**Project:** MarketX Mobile Application
**Milestone:** M2 — Marketplace, Discovery & Seller Storefronts
**Fee:** ₦500,000
**Test environment:** Staging only — `https://marketx.indicestech.com/api`
**Platforms:** Android **and** iOS (debug builds)

> **How to use this checklist.** Every item is a pass/fail acceptance criterion.
> "Complete flow" means the happy path **plus** the error, empty, and loading
> states for that flow (the reusable states delivered in M1 §10 must be reused here,
> not re-implemented ad hoc). Test against **staging** with your own throwaway buyer
> **and** seller accounts. Reference docs: [MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md),
> [API_READINESS.md](./API_READINESS.md), [API_STRUCTURE.md](./API_STRUCTURE.md).
>
> Items marked **[Conditional]** depend on a MarketX-side decision (Schedule D) and
> are not a Developer failure if that dependency is not yet delivered — mark them
> **Deferred** with a note.

---

## 0. Foundations Carried Over From M1 (must still hold)

- [ ] All marketplace calls go through the **central API client** from M1: success/error
      envelopes parsed, `Authorization: Bearer` sent on protected calls, **401
      auto-refresh-and-retry** intact.
- [ ] **Public browse works without a token** — home/discovery, product detail, category
      browse, search, and public seller storefronts all load for a logged-out user.
- [ ] Pagination on every list uses `?limit=&offset=` and relies on **`meta.hasMore`**
      (never assumes a `total` count exists).
- [ ] Conventions honoured throughout: ISO-8601 UTC timestamps, currency in **kobo**
      (formatted to ₦ for display), **numeric IDs for products/orders** vs **string IDs
      for profiles/posts**.
- [ ] **Role branching from §3C (M1) still enforced:** buyer-only accounts never reach the
      seller suite (§7–§12); seller UI is gated on `user.role === "seller"`.

## 1. Home / Discovery Feed

- [ ] `GET /feed/home` renders the home surface (mixed products/posts/rails) with working
      pagination (infinite scroll or paged, driven by `meta.hasMore`).
- [ ] `GET /feed/discover` renders the discovery surface.
- [ ] Tapping a product anywhere on the feed opens **product detail** (§3); tapping a
      seller opens the **storefront** (§6).
- [ ] Loading (skeleton), empty, and error+retry states render (reused from M1 §10).
- [ ] Pull-to-refresh re-fetches the surface without duplicating items.

## 2. Category & Tag Browse

- [ ] `GET /commerce/categories` lists categories; selecting one filters the catalog.
- [ ] `GET /commerce/tags` lists tags; `GET /commerce/tags/{id}/products` loads a tag's
      products with pagination.
- [ ] A category/tag with zero products shows the **empty** state, not a spinner or crash.

## 3. Product Catalog & Detail

- [ ] `GET /commerce/products` lists the catalog with `?limit=&offset=` pagination and
      any supported filters/sorts the UI exposes.
- [ ] Product detail loads by **id** (`GET /commerce/products/{id}`) **and** by **slug**
      (`GET /commerce/products/by-slug/{slug}`) — deep-linked/shared slugs resolve.
- [ ] **Variants** (`GET /commerce/products/variants/{id}`) render: selecting a variant
      updates price (kobo→₦), stock/availability, and image where applicable.
- [ ] Price, currency, images (gallery/carousel), description, seller, and stock status
      all display correctly; **out-of-stock** is shown distinctly.
- [ ] Product detail surfaces its **seller** with a link to the storefront (§6).
- [ ] A missing/deleted product id or slug returns a clean **not-found** state, not a raw
      error.

## 4. Search (Products / Stores / Posts / Tags)

- [ ] `GET /search` returns and renders results across **products, stores, posts, and
      tags**, each result type visually distinguished and tappable to its detail surface.
- [ ] Search is paginated (`meta.hasMore`) and debounced; loading, **no-results empty**,
      and error+retry states render.
- [ ] Each result routes correctly: product→detail, store→storefront, post→post,
      tag→tag products (§2).

## 5. Curated Rails

- [ ] Deals rail (`GET /feed/deals`), Fresh Drops (`GET /feed/fresh-drops`),
      Featured sellers (`GET /seller/featured`), and Pre-loved (`GET /feed/pre-loved`)
      each render as their own rail/section.
- [ ] Each rail paginates or "sees all" into a full list, and every card routes to the
      correct detail (product or storefront).
- [ ] An empty rail is hidden or shows an empty state — it never renders a broken/blank row.

## 6. Seller Storefront (Buyer-Facing)

> **Slug-vs-UUID hazard (API_READINESS cross-cutting).** On the **buyer-facing**
> storefront routes, `{id}` means the **store slug**; on the **management** routes (§7)
> `{id}` means the store **UUID**. Keep these two identifiers separate in the client —
> do not pass a UUID where a slug is expected or vice-versa.

- [ ] `GET /seller/by-slug/{slug}` (and/or `GET /seller/{slug}`) loads a storefront:
      name, logo, banner, description, location.
- [ ] `GET /seller/{slug}/products` lists that store's products with pagination.
- [ ] The storefront shows its **store wall / shoutouts** (§12, read side) and any
      seller rails, each routing correctly.
- [ ] A non-existent slug shows a clean not-found state.

---

## 7. Seller Suite — Store Creation & Profile

> The M1 seller onboarding endpoints (`/auth/register-seller`, `/seller/register`) are
> covered in the **M1** checklist §3B/§3C. M2 covers **editing/managing** the store and
> the seller-only surfaces that consume it.

- [ ] The seller area is reachable **only** for `role: "seller"` accounts (guarded per
      M1 §3C); a buyer account cannot navigate into it.
- [ ] `PATCH /seller/{id}` (**`{id}` = store UUID**) edits store profile: name,
      description, logo, banner, location, phone, currency — with validation and inline
      errors.
- [ ] **Store logo/banner upload** uses `POST /media/upload` (`multipart/form-data` →
      `{ url, public_id, type }`); the returned `url` is saved on the store. Upload shows
      progress + error states and respects the ~10/min upload rate limit.
- [ ] Store-slug rules (if slug is editable at all) match the server: lowercase letters,
      numbers, hyphens; min 3 chars; **reserved-word rejection**; taken slug → `409`.

## 8. Seller Suite — Dashboard

- [ ] A seller **dashboard** renders, composed **client-side** from analytics (§11) +
      incoming orders (§10) — there is **no single dashboard endpoint** (API_READINESS M2).
- [ ] Dashboard tiles/summary load independently with their own loading/empty/error states
      (a failure in one section does not blank the whole screen).

## 9. Seller Suite — Product CRUD & Inventory

- [ ] **Create** a product: `POST /commerce/products` with images (via `POST /media/upload`),
      price (entered as ₦, **sent as kobo**), description, category/tags, and variants.
- [ ] **Edit** a product: `PATCH /commerce/products/{id}` updates fields and variants;
      changes reflect on the buyer-facing detail (§3).
- [ ] **Delete** a product: `DELETE /commerce/products/{id}` removes it (with a confirm
      step); it disappears from the storefront/catalog.
- [ ] **Inventory:** stock/quantity per product/variant is editable and enforced —
      setting stock to 0 shows the product as out-of-stock buyer-side.
- [ ] Server validation errors (`400`) render inline on the correct fields; the create
      form cannot be double-submitted.

## 10. Seller Suite — Order Management

- [ ] `GET /commerce/orders/seller` lists incoming orders (paginated) with buyer, items,
      totals (kobo→₦), and current status.
- [ ] Opening an order shows its detail (items, quantities, shipping, amounts).
- [ ] `PATCH /commerce/orders/{id}/status` advances an order through its allowed statuses;
      the UI only offers **valid** next transitions and reflects the new status immediately.
- [ ] Loading, **no-orders empty**, and error+retry states render.

## 11. Seller Suite — Analytics Summary **[Conditional — Schedule D]**

- [ ] `GET /seller/analytics/{storeSlug}` loads and renders a summary (e.g. sales, orders,
      views/revenue) as the dashboard's analytics section.
- [ ] Loading, empty (new store / zero data), and error+retry states render.
- [ ] **[Conditional]** The **depth of the analytics payload** is subject to MarketX
      confirming the fields meet the "summary" need (Schedule D). If the confirmed payload
      is thinner than the UI implies, render what exists and mark the gap **Deferred** —
      not a Developer failure.

## 12. Seller Suite — Store Wall & Shoutouts

- [ ] `GET /wall/{type}/{slug}` loads the store wall (buyer-facing read, §6).
- [ ] As a seller, **post** a shoutout (`POST /wall/{type}/{slug}`) — it appears on the
      wall immediately.
- [ ] As a seller, **delete** a shoutout (`DELETE /wall/{type}/{slug}` / by id) with a
      confirm step.
- [ ] Loading, empty, and error states render for the wall.

---

## 13. App-Wide States & Consistency (regression on M1 §10)

- [ ] Every new list/detail in M2 renders a **loading** state (skeletons, no blank/frozen
      screens).
- [ ] Every collection renders an **empty** state on zero items.
- [ ] Every failed request renders an **error** state with a **retry** action, driven by
      the parsed error envelope.
- [ ] No-network / timeout handled distinctly from a server error.
- [ ] These states **reuse** the M1 shared components — not re-implemented per screen.

---

## 14. Cross-Cutting Decisions to Confirm with MarketX (not Developer failures)

- [ ] **Seller `{id}` slug-vs-UUID convention** documented/agreed per route so the
      storefront (§6, slug) and management (§7–§12, UUID) screens don't trip
      (API_READINESS M2 open item).
- [ ] **Seller-analytics payload depth** confirmed (drives §11).
- [ ] **API versioning (`/v1`)** — still-open cross-cutting decision from M1; confirm it
      does not change M2 response shapes.

---

## Sign-off

| | Client (MarketX) | Developer |
|---|---|---|
| Name | Joshua Akibu | Samuel Odukoya |
| Signature / Date | __________ | __________ |

**Outcome:** ☐ Accepted ☐ Accepted with deferred minor item(s) ☐ Not accepted
_(Deferred/conditional items and notes: ____________________)_

> On acceptance, the ₦500,000 M2 fee is due per clause 3 of the Mobile Application
> Development Agreement. Record every **[Conditional]** / deferred item in writing as
> **in scope · de-scoped · deferred to Phase 2**.
