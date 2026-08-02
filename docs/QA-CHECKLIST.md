# MarketX — Manual QA / UAT Checklist

A click-through test script for manual testers. **No API testing** — this is about
UI flow, visible behaviour, and feedback (loading states, empty states, validation,
error messages, toasts). Work top to bottom; tick each box; log anything that
doesn't match the **Expected** result.

> Companion to [features.md](features.md). Test on the preview build at the URL your
> team lead provides.

---

## How to use this checklist

1. Pick a role for the session (Buyer, Seller, or New User) — some flows need a specific account.
2. For each item: do the steps, compare to **Expected**, then mark:
   - ✅ Pass · ❌ Fail · ⚠️ Works but issue · ⬜ Blocked/couldn't test
3. For every ❌ / ⚠️, log a defect (template at the bottom) with a **screenshot or screen recording**.
4. Test the **same flow on both mobile and desktop** widths — note which one breaks.

### Test environment
- [ ] Desktop browser (Chrome) · [ ] Mobile browser (phone, Chrome/Safari) · [ ] Tablet width (optional)
- [ ] Light mode · [ ] Dark mode (toggle and re-check key screens)
- Network: test once on good Wi-Fi, once on slow/throttled (to see loading & error states).

### Test accounts (preview/test environment)
| Role | Email | Password | Notes |
|---|---|---|---|
| Seller (chairman) | balogun@peppr.test | test1234 | store: balogun-fabrics |
| Seller + buyer | ada@peppr.test | test1234 | store: ada-styles |
| Buyer only | chidi@peppr.test | test1234 | no store |
| Other seller | wuse@peppr.test | test1234 | store: wuse-fashion |
| New user | *register a fresh one* | — | use a real inbox you control |

### Defect severity
- **S1 Blocker** — can't proceed (crash, white screen, payment fails, can't log in).
- **S2 Major** — feature broken or wrong result, but a workaround exists.
- **S3 Minor** — UI/layout/copy issue, doesn't block the task.
- **S4 Cosmetic** — polish (spacing, alignment, wording).

---

## Quick smoke test (do this first, ~15 min)

Run this before diving into a full section. If any of these fail, stop and flag it — no
point testing deeper on a broken build.

- [ ] Home loads logged out, no console errors.
- [ ] Register a new account → verify email → land logged in.
- [ ] Login / logout works.
- [ ] Open a product → add to cart → checkout screen loads.
- [ ] Complete a test payment → order appears in My Orders.
- [ ] Open a seller's public store page.
- [ ] Post something (text or image) to the feed.
- [ ] Open Messages / Dasah chat — it opens without erroring.

## Splitting this across interns

Each session below is ~30–45 min and can be picked up independently. Pair them with
a role from the test accounts table.

| Session | Sections | Suggested account |
|---|---|---|
| A — Auth & Profile | 1, 8 | New user (register fresh) |
| B — Content | 2, 12, 13 | Buyer |
| C — Shop & Pay | 3, 4, 5, 6 | Buyer |
| D — Selling | 9 (incl. 9.6 Trust Card & Growth) | Seller (chairman) |
| E — Community | 7, 10, 11 | Buyer + Seller |
| F — Everything else | 14, 15, 16 | Either |

Do the **Quick smoke test** first regardless of which session you're assigned.

---

## 0. Cross-cutting UX pass (check on every screen as you go)
- [ ] Page loads without a flash of "not found" / blank then content. **Expected:** smooth load, skeletons while loading.
- [ ] Loading states show a **skeleton/shimmer or spinner**, not a frozen blank. **Expected:** clear loading feedback.
- [ ] Empty states (no data) show a **message + a next-step button**, not just blankness. **Expected:** helpful empty state.
- [ ] Errors show a **readable message with a retry/recovery option**, not a raw error or silent failure. **Expected:** friendly error + recovery.
- [ ] Buttons disable + show a spinner while an action is in progress. **Expected:** no double-submits.
- [ ] Dark mode: text is readable, no white-on-white / black-on-black. **Expected:** legible in both themes.
- [ ] Back button / browser navigation returns to the right place. **Expected:** no broken navigation.
- [ ] Images load (no broken-image icons); avatars fall back to initials. **Expected:** no broken media.

---

## 1. Authentication & Onboarding

### 1.1 Register
- [ ] Open Sign-up. Submit with **empty fields**. **Expected:** inline validation, can't submit.
- [ ] Enter an **invalid email** (e.g. `abc`). **Expected:** "invalid email" message.
- [ ] Enter a **weak password**. **Expected:** password rule message.
- [ ] Register with a valid new email + password. **Expected:** success; prompt to verify email / redirected appropriately.
- [ ] Try to register again with the **same email**. **Expected:** "email already in use" (no crash).

### 1.2 Email verification
- [ ] Check the inbox for a verification email. **Expected:** email arrives with a link.
- [ ] Click the verify link. **Expected:** "email verified" confirmation.
- [ ] Click the **same link again**. **Expected:** graceful message (already used / verified), not an error page.
- [ ] Use "Resend verification". **Expected:** new email sent; success feedback.

### 1.3 Login / Logout
- [ ] Login with **wrong password**. **Expected:** clear "incorrect credentials"; no lockout crash.
- [ ] Login with correct credentials. **Expected:** lands on home feed, logged-in state (avatar/menu visible).
- [ ] Refresh the page while logged in. **Expected:** stays logged in.
- [ ] Logout. **Expected:** returns to logged-out home; protected pages now redirect to login.

### 1.4 Forgot / Reset password
- [ ] "Forgot password" with a **registered** email. **Expected:** "if the email exists, a link was sent" (same message regardless).
- [ ] "Forgot password" with an **unregistered** email. **Expected:** identical message (no leak of who's registered).
- [ ] Open the reset link, set a new password. **Expected:** success; can log in with new password.
- [ ] Reuse the **same reset link** again. **Expected:** "link expired/used", not a crash.

### 1.5 Social login (OAuth)
- [ ] Tap "Continue with Google" (and Facebook / TikTok). **Expected:** provider screen opens; on approval, logged in.
- [ ] Cancel the provider screen. **Expected:** returns to login, no error page.

---

## 2. Social Feed & Content (logged in as a buyer)

### 2.1 Feeds
- [ ] Open Home feed. **Expected:** posts load with media, author, like/comment counts.
- [ ] Switch to Following feed. **Expected:** shows posts from people you follow (or an empty state prompting to follow).
- [ ] Open Discover. **Expected:** broader public content loads.
- [ ] Scroll to the bottom. **Expected:** more posts load (infinite scroll), no duplicates.

### 2.2 Reels
- [ ] Open Reels. **Expected:** first video autoplays.
- [ ] Swipe/scroll to next reel. **Expected:** advances to the next video and it plays.
- [ ] Tap mute, then go to next reel. **Expected:** mute state persists across reels.
- [ ] Tap like / open comments on a reel. **Expected:** like toggles; comments open.

### 2.3 Stories
- [ ] Tap a story. **Expected:** story opens full-screen, advances/auto-progresses.
- [ ] (As a content owner) create a story. **Expected:** uploads and appears in the tray.
- [ ] Re-open after 24h (or an expired story). **Expected:** expired stories no longer show.

### 2.4 Posts
- [ ] Create a text post. **Expected:** appears in your feed/profile.
- [ ] Create an image post and a video post. **Expected:** media uploads with progress; renders after.
- [ ] Like a post, then unlike. **Expected:** count goes up then down; no double-count.
- [ ] Comment on a post; reply to a comment. **Expected:** comment + reply appear immediately.
- [ ] Tap a **@mention** in a caption. **Expected:** navigates to that profile (without first showing the post-not-found).
- [ ] Tap a **#hashtag**. **Expected:** navigates to that tag's results.
- [ ] Open a single post via its link. **Expected:** post detail loads (no "post not found" flash).
- [ ] Edit your own post; try to edit someone else's. **Expected:** you can edit yours; no edit option on others'.
- [ ] Delete your own post. **Expected:** removed after confirm.

### 2.5 Visibility
- [ ] Create a **Private** post. Log in as another user. **Expected:** the private post is NOT visible in their feeds/your public profile.
- [ ] Create a **Followers-only** post. As a non-follower, **Expected:** not visible; as a follower, visible.

---

## 3. Marketplace & Discovery

- [ ] Open Market / catalog. **Expected:** product cards with image, price (bold), seller.
- [ ] Open a product detail. **Expected:** images, price, description, variants (size/colour), seller link, Add-to-cart.
- [ ] Select a variant. **Expected:** price/stock updates; out-of-stock variants disabled.
- [ ] Browse a Category. **Expected:** only that category's products.
- [ ] Open Deals / Fresh Drops / Pre-loved (Thrift). **Expected:** each rail shows relevant products.
- [ ] Search "adire" (or a known product). **Expected:** product results.
- [ ] Search a seller name. **Expected:** store results.
- [ ] Search a username. **Expected:** user results; **no email shown** on results.
- [ ] Search 1 character. **Expected:** no results / "keep typing" (doesn't error).
- [ ] Tap a seller from a product. **Expected:** opens that store's profile.

### 3.1 Find / Verify dock (home page, works logged out)
- [ ] On the home page, use the **Find a trader** tab, type a known trader/product name (2+ chars). **Expected:** live dropdown grouped into Traders / Goods within ~1s.
- [ ] Press Enter with no query. **Expected:** goes to Discover.
- [ ] Switch to the **Verify** tab, enter a seller's phone, @handle, or store link, tap Verify. **Expected:** goes to `/verify` with a result.
- [ ] On `/verify`, try a **verified** seller. **Expected:** green/mint card — name, blue verified badge, Seller ID (e.g. `MX-LA-XXXX`), "View full trust profile" + "Visit store" buttons.
- [ ] On `/verify`, try a seller **on MarketX but not verified**. **Expected:** amber card explaining they're not yet verified, still has "Visit store".
- [ ] On `/verify`, try something **unrecognized** (random phone number). **Expected:** grey "no trust record" card with an "Invite them" share action — no crash.
- [ ] Scroll the **"Trusted this week"** rail on the home/feed page. **Expected:** horizontally scrollable seller cards ranked by sales, each opens that seller's profile; hides itself cleanly if there's no data (not a broken empty box).

---

## 4. Cart, Checkout & Payments (buyer)

### 4.1 Cart
- [ ] Add a product to cart. **Expected:** cart count increments; toast/confirmation.
- [ ] Open cart. **Expected:** line items, quantities, subtotal.
- [ ] Increase/decrease quantity. **Expected:** totals recalc; can't exceed stock.
- [ ] Remove an item. **Expected:** item gone, totals update; empty-cart state if last item.

### 4.2 Checkout
- [ ] Proceed to checkout. **Expected:** address, shipping option, payment method, order summary.
- [ ] Try to checkout with **no delivery address**. **Expected:** prompted to add one.
- [ ] Add/select a delivery address. **Expected:** saved and selectable.
- [ ] Review shipping options (if shown). **Expected:** carrier option(s) + price + ETA; total updates with selection.
- [ ] Confirm the order summary totals = items + shipping. **Expected:** math is correct.

### 4.3 Payment
- [ ] Pay with **Paystack** (test card). **Expected:** Paystack screen; on success → order confirmation/success page.
- [ ] Cancel/fail the Paystack payment. **Expected:** returns to checkout with a clear "payment not completed" message; **no order created / no double charge**.
- [ ] Place a **Pay-on-Delivery** order (if available). **Expected:** order created as POD; clear messaging about paying on delivery.
- [ ] After success, check the order appears in **My Orders**. **Expected:** new order listed with correct status.

---

## 5. Orders & Tracking (buyer)

- [ ] Open My Orders. **Expected:** list with status badge, amount, date.
- [ ] Open an order detail. **Expected:** items, totals, status, tracking section.
- [ ] On a delivered order, tap **Confirm receipt**. **Expected:** status updates; funds release messaging.
- [ ] Try **Refuse delivery** (on an eligible order). **Expected:** confirmation + status change; refund messaging.
- [ ] Cancel an unpaid/cancellable order. **Expected:** cancelled; stock returns (where applicable).
- [ ] Leave a **review** on a delivered/eligible product. **Expected:** review submits and shows on the product.
- [ ] Try to review a product you **didn't buy**. **Expected:** blocked / not offered.

---

## 6. Wallet & Payouts

### Buyer wallet
- [ ] Open buyer wallet. **Expected:** balance + transactions list (or empty state).

### Seller wallet (log in as a seller)
- [ ] Open seller wallet. **Expected:** balance, transactions, payout option.
- [ ] Open Payout/Withdraw. **Expected:** shows available balance + a fee/preview.
- [ ] Try to withdraw **more than balance**. **Expected:** blocked with a clear message.
- [ ] Add a bank account; set it default. **Expected:** saved; default badge moves correctly.
- [ ] Try to view/withdraw with **no bank account**. **Expected:** prompted to add one first.

---

## 7. Affiliate / Referral Program

- [ ] Open the Affiliate section. **Expected:** if not enrolled, an "Enrol" call-to-action.
- [ ] Enrol as an affiliate. **Expected:** a unique **affiliate code** is shown.
- [ ] Re-open / re-enrol. **Expected:** the **same code** (no duplicate).
- [ ] Browse promotable products. **Expected:** list of products you can promote.
- [ ] Copy/share a referral link. **Expected:** link copies; contains your code.
- [ ] Open the affiliate dashboard. **Expected:** total earnings, **pending vs released**, conversions (zeros if new).
- [ ] (Seller) view Promoters. **Expected:** list of who's promoting your products (or empty state).

---

## 8. Profile & Social Graph

- [ ] Open your own profile. **Expected:** avatar, bio, posts grid, follower/following counts, Edit button.
- [ ] Edit profile (name, bio, avatar, website link). **Expected:** saves; changes reflected.
- [ ] Add a website link with `javascript:` or a weird scheme. **Expected:** rejected / sanitised (not clickable as script).
- [ ] Open another user's profile. **Expected:** Follow button (no Edit), their public posts only.
- [ ] Follow them; then unfollow. **Expected:** counts update; button toggles.
- [ ] Try to follow **yourself**. **Expected:** not possible.
- [ ] Open Followers / Following lists. **Expected:** lists load.
- [ ] Open Settings. **Expected:** account settings load and save.
- [ ] Check Saved / Liked items. **Expected:** show what you saved/liked (or empty state).

---

## 9. Seller Suite (log in as a seller)

### 9.1 Become a seller (use the buyer-only account)
- [ ] Open "Create store". **Expected:** store creation form.
- [ ] Submit with a **taken store name/slug**. **Expected:** rejected with a message.
- [ ] Create a valid store. **Expected:** store created; redirected to dashboard.

### 9.2 Dashboard & analytics
- [ ] Open seller dashboard. **Expected:** key stats / quick actions.
- [ ] Open Analytics. **Expected:** sales/revenue/orders over a date range; changing the range updates charts.

### 9.3 Products
- [ ] Open Products. **Expected:** your products (published + drafts), with status.
- [ ] Create a product (title, price, description, image, variant + stock). **Expected:** saves; appears in list.
- [ ] Create a product with **price 0 or missing title**. **Expected:** validation blocks it.
- [ ] Edit a product (change price/stock). **Expected:** saves; reflected on the storefront.
- [ ] Delete/archive a product. **Expected:** removed/hidden after confirm.
- [ ] Confirm a **draft** product is NOT visible to buyers. **Expected:** only published show publicly.

### 9.4 Orders & messages
- [ ] Open seller Orders. **Expected:** incoming orders with status.
- [ ] Update an order status (e.g. mark Shipped). **Expected:** status changes; buyer sees it.
- [ ] Open store Messages. **Expected:** customer conversations list.
- [ ] Open a customer conversation and **reply**. **Expected:** message sends (seller can read AND reply to their own store chats).

### 9.5 Store settings & public page
- [ ] Edit store settings (logo, banner, description, ship-from). **Expected:** saves; public page updates.
- [ ] View your public store page as a buyer. **Expected:** products, wall, follow button; **no private data** (no exact GPS / phone / verification status leaking).
- [ ] Deactivate then reactivate the store. **Expected:** store hidden/shown accordingly.

### 9.6 Trust Card & Growth Tools (new — test this)
- [ ] Open **Store → Card** (`/store/card`). **Expected:** your card shows logo, Seller ID (copy button works), QR code, and a "copy store link" button.
- [ ] Toggle a field in Card settings (e.g. hide phone). **Expected:** the card preview updates to match.
- [ ] Tap **Download** on the card. **Expected:** a PNG image downloads.
- [ ] Tap **Share** on the card. **Expected:** native share sheet opens (or link copies as a fallback).
- [ ] On a product in your Products list, tap **Promote** (rocket icon). **Expected:** opens a modal with a share-card preview, price, and QR — loads within a few seconds.
- [ ] In the Promote modal, tap **Download** / **Share**. **Expected:** same as the card actions above — works with no TikTok connection needed.
- [ ] Open **Connections** (`/seller/[yourstore]/connections`) and connect TikTok. **Expected:** redirects to TikTok, and on approval returns with a "connected" confirmation.
- [ ] Back in the Promote modal, with TikTok connected, edit the caption and tap **Post to TikTok**. **Expected:** success toast; note it will post as **private/only-you** while our TikTok app is unaudited — check on TikTok that it *did* post, just not publicly.
- [ ] Disconnect TikTok, reopen Promote modal. **Expected:** shows a "Connect TikTok" prompt instead of the post form (no broken state).
- [ ] ⚠️ **Known gap, don't log a bug for it:** there's currently no seller-facing page to upload verification/CAC documents — verification is admin-only for now.

---

## 10. Squares (Community)

- [ ] Open Squares. **Expected:** list of squares to browse.
- [ ] Open a square. **Expected:** square feed, members, Join/Follow, tabs (All / Requests / etc.).
- [ ] Join / follow a square. **Expected:** membership/follow state updates.
- [ ] (As buyer, following the square) post a **buyer request** ("I'm looking for…"). **Expected:** request appears in the Requests tab and the "Buyers looking for" strip.
- [ ] In the request note, type a **phone number**. **Expected:** it's masked ([hidden]) when saved.
- [ ] (As a member seller) open a request and **respond with a product**. **Expected:** offer attaches; buyer is notified.
- [ ] (As the buyer) **accept** an offer. **Expected:** routes to checkout/cart for that product; request marked fulfilled.
- [ ] Try posting a request **without following** the square. **Expected:** blocked / prompted to follow.
- [ ] Open square Admin (as chairman). **Expected:** member approve/reject, announcements.

---

## 11. Wall (store/user timeline)

- [ ] Open a store's wall (as a guest, logged out). **Expected:** public posts + shoutouts; no private posts.
- [ ] (Logged in) leave a **shoutout** on a store wall. **Expected:** appears on the wall; owner notified.
- [ ] Try to leave a shoutout on **your own** user wall. **Expected:** blocked with guidance ("post to your feed instead").
- [ ] Delete a shoutout you posted. **Expected:** removed.
- [ ] (As wall owner) delete a shoutout left on your wall. **Expected:** removed.

---

## 12. Messaging (real-time)

- [ ] Start a new conversation with a seller (from a product/store). **Expected:** conversation opens.
- [ ] Send a message. **Expected:** appears instantly in your thread.
- [ ] Send an **empty** message. **Expected:** blocked (can't send blank).
- [ ] With the recipient logged in elsewhere, send a message. **Expected:** appears for them **without refresh** (real-time).
- [ ] Open Inbox. **Expected:** conversations sorted by latest, last-message preview, unread indicator.
- [ ] Open someone else's conversation link you're not part of. **Expected:** access denied (can't read others' chats).

---

## 13. Notifications

- [ ] Trigger one (get a like / follow / order / square request). **Expected:** a notification appears (bell badge / toast).
- [ ] Open the notifications panel. **Expected:** list with types and timestamps.
- [ ] Tap a notification. **Expected:** deep-links to the relevant item (post/order/conversation/square).
- [ ] Mark one as read; mark all as read. **Expected:** unread count updates correctly.
- [ ] Confirm a **square request / wall shoutout** notification is typed correctly (right icon/label, not generic). **Expected:** correct type + working link.

---

## 14. Dasah AI (in-app assistant)

- [ ] Open the Dasah chat. **Expected:** chat opens with a welcome message ("Dasah").
- [ ] Ask for a product ("find me a red dress"). **Expected:** replies with product suggestions/cards.
- [ ] Tap a suggested product. **Expected:** opens that product.
- [ ] Ask it to add something to cart (if supported). **Expected:** prompts/confirms before adding.
- [ ] Send gibberish / empty. **Expected:** graceful reply, no crash.
- [ ] Navigate away and back. **Expected:** chat persists or resets cleanly (no broken state).

---

## 15. Map / Location

- [ ] Open the Map. **Expected:** seller pins render.
- [ ] Tap a pin. **Expected:** seller preview (name, link to store).
- [ ] Filter by category / distance. **Expected:** pins update.
- [ ] Confirm a seller in **ghost mode** does not appear with a precise location. **Expected:** hidden / not pin-pointed.

---

## 16. Final cross-device & polish sweep
- [ ] Re-run flows 2, 4, 9, 10 on a **phone**. **Expected:** layouts adapt, nothing cut off, buttons reachable.
- [ ] Re-check 5 key screens in **dark mode**. **Expected:** readable, on-brand.
- [ ] Rotate phone / resize window on a few screens. **Expected:** no broken layout.
- [ ] Check copy for typos / wrong brand name (should be "Dasah", "MarketX"). **Expected:** consistent naming.
- [ ] Tab through a form with the keyboard (desktop). **Expected:** logical focus order, visible focus ring.

---

## Defect log template

Copy one block per issue into your bug sheet/doc:

```
ID:           BUG-001
Tester:       [name]
Date:
Area:         [e.g. Checkout]
Checklist ref:[e.g. 4.3]
Device/OS:    [e.g. iPhone 13, Safari / Windows Chrome]
Theme:        [light/dark]
Severity:     [S1 / S2 / S3 / S4]
Steps:        1) ... 2) ... 3) ...
Expected:     [what should happen]
Actual:       [what happened]
Screenshot/recording: [attach]
Notes:
```

### Session sign-off
- Tester: ____________   Date: ________   Build/URL: ____________
- Areas covered: ________________________________________________
- Blockers found (S1/S2): _______________________________________
