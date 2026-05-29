# Social Audit Tasks — July 2026

> **Pillar:** Social — Community and identity
> **Theme:** Audit the flows that make the platform feel alive and trustworthy.
> **Goal:** A user can register, build a profile, post content, interact with others, send messages, discover stores and squares, and see a relevant feed. All permissions are enforced. No content leaks across privacy boundaries.
> **Deadline:** July 31, 2026
> **Owner:** Mapida Ishaya (execution) · Joshua Akibu (review + auth systems)

---

## P0 — Auth & Identity

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Register new user | P0 | Mapida | API | Duplicate email, weak password | passed with evidence | July 31 | Phase 1 tests |
| Login email/password | P0 | Mapida | API | Brute force, token handling | passed with evidence | July 31 | Phase 1 tests |
| Logout | P0 | Mapida | API | Token not cleared | passed with evidence | July 31 | Phase 1 tests |
| Refresh/restore session | P0 | Mapida | API | Stale token | not started | July 31 | Plugin + `GET /api/auth/session` |
| Verify email | P0 | Mapida | API | Replay, expired token | not started | July 31 | `GET /api/auth/verify-email` |
| Resend verification email | P0 | Mapida | API | Rate limit | not started | July 31 | `POST /api/auth/resend-verification` |
| Forgot password | P0 | Mapida | API | User enumeration | not started | July 31 | `POST /api/auth/forgot-password` |
| Reset password | P0 | Mapida | API | Expired/replayed token | not started | July 31 | `POST /api/auth/reset-password` |
| Social OAuth redirect | P0 | Mapida | API | State param CSRF | not started | July 31 | `GET /api/auth/oauth/:provider` |
| Social OAuth callback | P0 | Mapida | API | Account linking | not started | July 31 | `GET /api/auth/oauth/:provider/callback` |
| Checkout OTP send | P0 | Mapida | API | Rate limit | passed with evidence | July 31 | `session.spec.ts` |
| Checkout OTP verify | P0 | Mapida | API | Expiry, replay | not started | July 31 | `POST /api/auth/checkout-otp/verify` |
| Seller registration | P0 | Mapida | API | Duplicate store, ownership | not started | July 31 | `POST /api/auth/register-seller` |

---

## P0 — Posts & Feed

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Create post (text/image/reel) | P0 | Mapida | API + E2E | Media upload, content type | not started | July 31 | `POST /api/posts` |
| Edit own post | P0 | Mapida | API | Ownership check | not started | July 31 | `PATCH /api/posts/:id` |
| Delete own post | P0 | Mapida | API | Ownership check | not started | July 31 | `DELETE /api/posts/:id` |
| Like / unlike post | P0 | Mapida | API | Duplicate like | passed with evidence | July 31 | Phase 5 gap-fill |
| Comment on post | P0 | Mapida | API | Auth required | not started | July 31 | `POST /api/posts/:id/comments` |
| @mention in post | P0 | Mapida | API | Notification triggered | not started | July 31 | Mentions API |
| View home feed (guest) | P0 | Mapida | API | Public only — no private content | not started | July 31 | `GET /api/feed` |
| View following feed (auth) | P0 | Mapida | API | Own followed content only | not started | July 31 | `GET /api/feed/following` |
| View profile posts | P0 | Mapida | API | Private profile boundary | not started | July 31 | `GET /api/profile/:username/posts` |
| Stories create/view/delete | P0 | Mapida | API | 24h expiry enforced | not started | July 31 | Stories API |

---

## P1 — Messaging

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Start conversation with seller | P1 | Mapida | API | Creates duplicate conversation | passed with evidence | July 31 | `chat.spec.ts` |
| List conversations | P1 | Mapida | API | Other user's conversations | not started | July 31 | `GET /api/chat/conversations` |
| View conversation messages | P1 | Mapida | API | IDOR | passed with evidence | July 31 | `chat-messages.spec.ts` |
| Send message | P1 | Mapida | API + Manual | Pusher/Soketi delivery | not started | July 31 | `POST /api/chat/conversations/:id/messages` — DEFERRED (needs Soketi) |
| Delete conversation | P1 | Mapida | API | Ownership | passed with evidence | July 31 | `chat-messages.spec.ts` gap-fill |
| Real-time message delivery | P1 | Mapida | Manual | Channel auth, fallback | not started | July 31 | Pusher channel — DEFERRED (needs Soketi) |
| Unread badge count | P1 | Mapida | API | Stale count | not started | July 31 | SSE notifications |

---

## P1 — Notifications

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Receive real-time notification (SSE) | P1 | Mapida | API | Auth, SSE disconnect | passed with evidence | July 31 | `notifications.spec.ts` |
| Mark notification read | P1 | Mapida | API | Other user's notification (IDOR) | not started | July 31 | `PATCH /api/notifications/:id` |
| Mark all notifications read | P1 | Mapida | API | Bulk ownership scope | not started | July 31 | `PATCH /api/notifications/read-all` |
| Notification for order event | P1 | Mapida | API | Delivery guarantee | not started | July 31 | Via notification queue |
| Notification for @mention | P1 | Mapida | API | Delivery guarantee | not started | July 31 | Via notification queue |
| Notification for follow | P1 | Mapida | API | Deduplication | not started | July 31 | Via notification queue |

---

## P1 — Profile & Discovery

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| View own profile | P1 | Mapida | API | Own vs other — correct data scoping | not started | July 31 | `GET /api/profile/:username` |
| Edit profile | P1 | Mapida | API + Manual | Media upload | not started | July 31 | `PATCH /api/profile` |
| Follow / unfollow user | P1 | Mapida | API | Self-follow prevented | passed with evidence | July 31 | `profile-extended.spec.ts` |
| View followers/following | P1 | Mapida | API | Private accounts respected | not started | July 31 | Stats endpoints |
| Search users/products/stores | P1 | Mapida | API | Ordering, type filter | passed with evidence | July 31 | `search.spec.ts` (destructuring fixed) |
| Seller profile page | P1 | Mapida | API + Manual | Data exposure | passed with evidence | July 31 | Seller `$fetch` replaced with service clients |
| Map — view seller pins | P1 | Mapida | Manual | Location privacy | not started | July 31 | `GET /api/map/sellers` |
| Map — filter by category/distance | P1 | Mapida | API | Radius performance | not started | July 31 | Query params |

---

## P1 — Wall

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| View store wall (guest) | P1 | Mapida | API | Public posts visible, own posts not duplicated | not started | July 31 | `GET /api/wall/store/:slug` |
| View store wall (auth) | P1 | Mapida | API | `optionalAuth` returns viewer context | not started | July 31 | Same route, different auth state |
| Post shoutout on store wall | P1 | Mapida | API | Auth required, 1000-char limit, own wall blocked | not started | July 31 | `POST /api/wall/store/:slug` |
| Post shoutout on user wall | P1 | Mapida | API | Cannot post on own user wall | not started | July 31 | `POST /api/wall/user/:slug` |
| Delete shoutout (as author) | P1 | Mapida | API | Author-only ownership | not started | July 31 | `DELETE /api/wall/:type/:slug/:postId` |
| Delete shoutout (as wall owner) | P1 | Mapida | API | Wall owner can remove any shoutout | not started | July 31 | Same route, different actor |
| Wall shoutout notification | P1 | Mapida | API | `WALL_SHOUTOUT` type delivered to wall owner | not started | July 31 | Notification queue |
| Wall filter pill — Products tab | P1 | Mapida | Manual | Products tab calls correct API | not started | July 31 | Client-side filter pill |
| Wall feed contamination fix | P1 | Mapida | Code review | Wall posts in home/following feed | passed with evidence | July 31 | `wallTargetType: null` filter added |

---

## P1 — Squares

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Browse squares | P1 | Mapida | API | Public listing | not started | July 31 | `GET /api/squares` |
| View square profile + feed | P1 | Mapida | API | Member-only content leak | not started | July 31 | Square APIs |
| Join square (seller/buyer) | P1 | Mapida | API | Eligibility check | not started | July 31 | `POST /api/squares/:slug/join` |
| Leave square | P1 | Mapida | API | Chairman cannot leave | not started | July 31 | `POST /api/squares/:slug/leave` |
| Square admin posts announcement | P1 | Mapida | API | Role check | not started | July 31 | Announcements API |
| Square officer management | P1 | Mapida | API | Chairman-only | passed with evidence | July 31 | `squares-extended.spec.ts` gap-fill |

---

## UI/UX Checklist — Auth Pages

- [ ] Register: password strength indicator, email already taken error
- [ ] Login: wrong password shows correct error (not 500), redirect after login works
- [ ] Forgot/Reset: expired link shows clear error, not generic 500
- [ ] Social OAuth: redirect URI shows correct provider branding

## UI/UX Checklist — Feed & Posts

- [ ] Post composer: image/video upload progress visible
- [ ] Post card: like animation, comment count updates without full reload
- [ ] @mention autocomplete works in post composer and comments
- [ ] Story bar scrolls horizontally on mobile
- [ ] Reel (video post) auto-plays in viewport, pauses on scroll-out
- [ ] Following feed visible only to logged-in users
- [ ] Feed skeleton loads correctly before data arrives

## UI/UX Checklist — Messaging

- [ ] Conversation list shows last message preview and timestamp
- [ ] Unread count badge appears and clears correctly
- [ ] Message input supports multiline, sends on Enter (desktop) / button (mobile)
- [ ] New message appears instantly via Pusher without page reload
- [ ] Fallback: if Pusher is unavailable, send still works (just not real-time)

## UI/UX Checklist — Seller Profile (`/sellers/:storeSlug`)

- [ ] Wall timeline loads on page mount (infinite scroll, 20-post pages)
- [ ] Filter pills (All · Products · Reviews · About) switch content without full reload
- [ ] Shoutout composer visible only to logged-in non-owners
- [ ] Posting a shoutout prepends it to the wall feed immediately (optimistic)
- [ ] Deleting a shoutout removes it from the wall feed immediately (optimistic)
- [ ] Message Store button creates conversation and navigates
- [ ] Follow button updates count immediately (optimistic)
- [ ] Products tab paginates correctly
- [ ] About, Reviews tabs load independently
- [ ] Profile banner shows Picsum fallback when `store_banner` is null
- [ ] Wall posts do NOT appear in the home feed or following feed

## UI/UX Checklist — Map

- [ ] Location permission prompt on first visit
- [ ] Seller pins cluster correctly at low zoom
- [ ] Bottom sheet / side panel opens on pin click
- [ ] Filter controls (category, open-now, distance) update pins without full reload
- [ ] "Selling now" inline feed syncs with map viewport

## UI/UX Checklist — Squares

- [ ] Square list page shows banner (Picsum fallback when `bannerUrl` is null)
- [ ] Square detail feed mixes seller posts and products
- [ ] Join button disabled for ineligible users
- [ ] Member-only content not visible to guests

---

## E2E Test Targets (Playwright) — Priority Order

1. Register → verify email → login → view feed → create post → post appears in feed
2. Buyer messages seller → conversation created → navigates to messages/:id
3. User follows seller → feed updates to include seller's posts
4. Search for product → result links to product detail page
5. Square: guest views public square → member logs in → sees member-only content

---

## Security Focus (July)

| Check | Area | Risk |
|-------|------|------|
| Email tokens are single-use and expire | Verify email / password reset | Replay attack |
| Password reset tokens invalidated after use | Reset password flow | Token reuse |
| OAuth state parameter validation | `GET /api/auth/oauth/:provider` | CSRF |
| Post edit/delete ownership enforced server-side | `PATCH/DELETE /api/posts/:id` | IDOR |
| Notifications scoped to `user.id` | `PATCH /api/notifications/:id` | Other user's notifications |
| Conversation access requires participant membership | Messages API | IDOR |
| Seller location coordinates protected from unauthenticated requests | Map API | Location privacy |
| @mention rendering sanitized | Feed, comments | XSS |
| Square member-only content check is server-side | Square APIs | Content leak |

---

## Definition of Done — July 31, 2026

- [ ] Auth P0 flows all have API test coverage and manual test evidence
- [ ] Feed, post, and profile flows have API test coverage
- [ ] Messaging flow tested with Soketi running
- [ ] SSE notification stream tested end-to-end
- [ ] Seller profile page passes manual UI/UX review on mobile + desktop
- [ ] Map renders correctly with real location data
- [ ] All P0/P1 social flows have audit status updated
- [ ] No P0 social flows with "not started" audit status
