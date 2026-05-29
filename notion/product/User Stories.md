# User Stories

> Format: **As a [user], I want to [action] so that [outcome].**
> Acceptance criteria define when the story is done.

---

## Buyer Stories

### Discovery

**B-01 — Find stores near me**
As a buyer, I want to open the map and see stores within my area so that I can discover who is selling nearby without searching manually.

*Acceptance criteria:*
- Map loads with my GPS location as centre point
- Store pins visible within selected radius (default 50km)
- Market Square zones visible as labelled clusters
- Filter pills (All, Deals, Verified, Premium) update pin count in real time

---

**B-02 — Deep-link to a specific store**
As a buyer, I want to tap a "View on Map" link from a product page and land directly on that store's location so that I don't have to search for it.

*Acceptance criteria:*
- URL with `?store=slug` centres map on the store's coordinates
- Store preview sheet opens automatically
- Works even if I have no cached location

---

**B-03 — Filter by what matters to me**
As a buyer, I want to filter stores by active deals or verified status so that I find trustworthy sellers with current offers first.

*Acceptance criteria:*
- Deal filter shows only stores with active, non-expired deals
- Verified filter shows only verified badge holders
- Filter persists through map pan and zoom

---

### Browsing

**B-04 — Preview a store before visiting**
As a buyer, I want to tap a pin and see a store's name, distance, top products, and hours so that I can decide if it's worth visiting.

*Acceptance criteria:*
- Bottom sheet (mobile) or side panel (desktop) shows on pin tap
- Preview includes: logo, name, distance, open/closed status, top 6 products
- "Visit Store" and "Get Directions" both functional

---

**B-05 — Browse a seller's full product range**
As a buyer, I want to open a seller's storefront page and scroll their products so that I can find what I need and compare prices.

*Acceptance criteria:*
- Product grid loads with thumbnail, title, and price
- Deal badge visible on discounted products
- Sold-out variants marked, not hidden

---

### Transacting

**B-06 — Message a seller before buying**
As a buyer, I want to send a message to a seller directly so that I can ask about availability, custom sizing, or delivery before committing.

*Acceptance criteria:*
- Message button accessible from store preview and product page
- Message thread persists in inbox
- Seller receives notification

---

**B-07 — Complete a purchase**
As a buyer, I want to add a product to cart and pay with my card or bank transfer so that I can buy without needing to negotiate on WhatsApp.

*Acceptance criteria:*
- Add to cart from product page
- Paystack checkout opens with correct amount
- Order confirmation shown after successful payment
- Order visible in buyer account

---

### AI (Dassa)

**B-08 — Ask Dassa to find a product**
As a buyer, I want to describe what I'm looking for in plain language so that Dassa finds relevant products without me having to browse manually.

*Acceptance criteria:*
- Dassa returns relevant product results with name, price, and image
- Results are tappable (links to product page)
- Response time under 3 seconds

---

**B-09 — Ask Dassa to manage my cart**
As a buyer, I want to tell Dassa "add that to my cart" or "remove the red one" so that I can shop conversationally.

*Acceptance criteria:*
- Dassa correctly identifies the product in context
- Cart updates reflected immediately
- Confirmation message shown

---

## Seller Stories

### Onboarding

**S-01 — Set up my storefront**
As a seller, I want to create my store profile with a name, logo, description, and business hours so that buyers know who I am and when I'm open.

*Acceptance criteria:*
- Seller can upload logo (min 200×200px)
- Business hours configurable per day with open/close times and closed toggle
- Storefront visible publicly after saving

---

**S-02 — Pin my store location**
As a seller, I want to place a pin on the map at my exact stall or shop location so that buyers can find me physically.

*Acceptance criteria:*
- Seller can search for their address or drag pin to correct position
- Location saved and visible on buyer map
- Option to hide location if seller is online-only

---

### Listing Products

**S-03 — List a product with photos**
As a seller, I want to upload photos or a video of my product and add a price and description so that buyers can see exactly what I'm selling.

*Acceptance criteria:*
- Up to 10 media files per listing
- Price, title, and description are required
- Product visible on storefront and in search after publishing

---

**S-04 — Use AI to write my listing**
As a seller, I want to upload a product photo and have AI generate a title, description, and price suggestion so that I don't have to write listings from scratch.

*Acceptance criteria:*
- Upload one photo → receive title, description, price, Instagram caption, Facebook post, and Pinterest description
- Seller can edit all fields before publishing
- Response within 5 seconds

---

**S-05 — Mark a product as a deal**
As a seller, I want to set a discount and deal expiry date so that buyers see my offers in the Deals filter on the map.

*Acceptance criteria:*
- Deal toggle enables discount percentage and expiry date fields
- Product shows deal badge on storefront and map pin
- Deal automatically deactivates after expiry

---

### Managing the Store

**S-06 — Reply to buyer messages**
As a seller, I want to see all buyer messages in one inbox so that I never miss an enquiry.

*Acceptance criteria:*
- Inbox shows all threads with unread count
- Seller can reply from web interface
- Messages timestamped and ordered by recency

---

**S-07 — Show buyers I'm available**
As a seller, I want to toggle my online status so that buyers know I'm actively responding right now.

*Acceptance criteria:*
- Online toggle visible in seller dashboard
- Online dot appears on map pin when active
- "Last seen X ago" shown to buyers when offline

---

## Admin Stories

**A-01 — Review and approve new sellers**
As an admin, I want to review new seller registrations and approve or reject them so that only legitimate traders appear on the platform.

*Acceptance criteria:*
- Admin sees queue of pending sellers
- Can approve, reject, or request more info
- Seller notified of decision

---

**A-02 — Remove a violating listing**
As an admin, I want to flag and remove a product listing that violates platform rules so that buyers are protected from fraudulent listings.

*Acceptance criteria:*
- Admin can search and view any listing
- Remove action unpublishes immediately
- Seller notified with reason
