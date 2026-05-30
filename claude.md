# CLAUDE.md — Ahia Project Reference

> This document is the single source of truth for building Ahia.
> Read this entirely before writing any code.

---

## 1. What is Ahia?

Ahia (Igbo for "market") is a web-first, multi-tenant marketplace platform built for
informal sellers — primarily students — in Nigeria. It combines a scroll-based product
discovery feed, a search system, per-seller storefronts, real-time buyer-seller chat,
and an in-app escrow payment system.

The name may change later. Build with this name for now.

---

## 2. The Problem It Solves

Most Nigerian students who sell goods do so over WhatsApp — no discovery, no storefront,
no payment protection. Platforms like Jiji have listings but no chat-to-pay flow.
Jumia and Konga are too corporate for informal sellers.

Ahia fills the gap: personal feel of WhatsApp + discovery of a marketplace + payment
protection of a formal platform.

---

## 3. Core User Flows

### 3.1 The Main Loop
```
Scroll feed → Tap product → View shop → Chat with seller → Agree price →
Seller sends payment request in chat → Buyer pays in-app → Escrow holds funds →
Buyer confirms delivery → Funds released to seller → Both get notified
```

### 3.2 Search Flow
```
User types in search bar → Results show matching products AND shops →
User taps result → Goes to product page or shop page
```

### 3.3 Seller Onboarding
```
Sign up → Accept terms → Create shop (name, logo, category, description) →
Add first product → Shop is live
```

### 3.4 Role Switching
```
Any user can be buyer, seller, or both →
A toggle/button switches between buyer shell and seller shell →
If switching to seller and no shop exists → prompt to create shop first
```

### 3.5 Dispute Flow
```
Buyer pays → Funds held in escrow → Buyer receives goods →
If issue: Buyer raises dispute (reason + optional photo evidence) →
Admin reviews chat history + transaction → Admin decides: refund or release →
Both parties notified of outcome
```

---

## 4. Business Rules

### Payments
- Payments MUST go through the platform. This is enforced by the escrow model.
- Every chat has a visible warning: "Pay only through Ahia. Off-platform payments
  are not protected."
- Seller sends a payment request as a special message type inside chat.
- Buyer pays the request through the platform (Paystack handles processing).
- Funds are held (escrow) until buyer confirms delivery.
- Platform takes a percentage fee automatically on release.
- If buyer does not confirm within X days, funds auto-release to seller (define X later).

### Privacy
- Chat messages are private between buyer and seller only.
- Every message request checks: is this user the buyer or seller in this conversation?
- Admin can only read chat history when a formal dispute is raised against that
  specific transaction.
- State this clearly in terms of service.

### Trust & Ranking
- Feed ranking is based on: shop activity, response rate, completed transactions,
  trust score, and paid boosts.
- New shops start with equal visibility. Trust score grows over time.
- Paid boosts (ads) can increase visibility but cannot override trust gating entirely.
- A brand new shop cannot buy its way to the top on day one.

### Role Switching
- One account can be buyer, seller, or both.
- Switching roles changes the UI shell entirely.
- Seller mode shows: dashboard, shop, products, inbox, transactions.
- Buyer mode shows: feed, search, inbox, transactions, profile.
- Both modes share: inbox/:id (same chat UI), notifications, profile.

### Seller Storefronts
- Every user can view any shop regardless of their role.
- Sellers can view competitor shops — this cannot be hidden and should not be blocked.
- Report/moderation system handles abuse of this.

---

## 5. Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Web-first MVP |
| Backend | Express.js | REST API + Socket.io |
| Database | PostgreSQL (Neon) | Free tier, serverless |
| Cache | Redis (Upstash) | Sessions, online status, feed cache |
| Auth | JWT + httpOnly cookies | Never expose tokens to JS |
| Real-time | Socket.io | Chat AND notifications |
| File Storage | Cloudinary | Images upload direct from frontend, save URL to DB |
| Payments | Paystack | All payment logic through backend only, NEVER frontend |
| Email | Resend | Transactional emails for key events |
| Search | PostgreSQL Full-Text Search | Sufficient for MVP, upgrade later if needed |
| Styling | Tailwind CSS v4 | CSS-first config |
| Components | Shadcn/ui | Extend, do not override |
| State | Zustand | Client state only |
| Data Fetching | SWR + Axios | SWR for client fetching, Axios for server calls |
| Hosting (FE) | Vercel | |
| Hosting (BE) | Railway or Render | |

---

## 6. Architecture Overview

```
Next.js (User App)          Next.js (Admin App) — build later
        |                            |
        └──────────┬─────────────────┘
                   |
            Express Backend
            /      |      \
     Paystack   Socket.io  Resend
           \       |
          Neon PostgreSQL
               |
           Upstash Redis

Cloudinary ← direct upload from Next.js frontend
            (save returned URL to PostgreSQL via Express)
```

### Key Rule
**Never call Paystack from the frontend.** All payment logic lives in Express.
Secret keys never touch the browser.

---

## 7. Database Schema

### users
```sql
id              UUID PRIMARY KEY
name            VARCHAR
email           VARCHAR UNIQUE
password        VARCHAR (hashed)
phone           VARCHAR
avatar          VARCHAR (Cloudinary URL)
role            ENUM('buyer', 'seller', 'both', 'admin')
created_at      TIMESTAMP
```

### shops
```sql
id              UUID PRIMARY KEY
owner_id        UUID REFERENCES users(id)
name            VARCHAR
handle          VARCHAR UNIQUE          -- @-handle for chat + storefront URL
description     TEXT
logo            VARCHAR (Cloudinary URL)
category        VARCHAR
location        VARCHAR                  -- Nigerian city, used by buyer location filter
show_legal_name BOOLEAN DEFAULT false    -- opt-in to expose User.name on storefront
is_active       BOOLEAN DEFAULT true
trust_score     INTEGER DEFAULT 0
created_at      TIMESTAMP
```
One user can only have one shop.

### products
```sql
id              UUID PRIMARY KEY
shop_id         UUID REFERENCES shops(id)
name            VARCHAR
description     TEXT
price           DECIMAL
cover           VARCHAR    -- Cloudinary URL for the cover image (sole field in API responses)
gallery         TEXT[]     -- Cloudinary URLs for additional product images
category        VARCHAR
is_available    BOOLEAN DEFAULT true     -- visible in feed/search
is_hidden       BOOLEAN DEFAULT false    -- explicit seller "hide from feed" toggle
deleted_at      TIMESTAMP                -- soft-delete; preserves dispute references
created_at      TIMESTAMP
```

### conversations
```sql
id              UUID PRIMARY KEY
buyer_id        UUID REFERENCES users(id)
seller_id       UUID REFERENCES users(id)
product_id      UUID REFERENCES products(id)  -- origin only, not a restriction
last_message    TEXT
last_message_at TIMESTAMP
created_at      TIMESTAMP
```
One conversation per buyer-product pair.

### messages
```sql
id                  UUID PRIMARY KEY
conversation_id     UUID REFERENCES conversations(id)
sender_id           UUID REFERENCES users(id)
content             TEXT                  -- text body OR offer note OR image caption
type                ENUM('text', 'payment_request', 'system', 'offer', 'image')
amount              DECIMAL               -- payment_request + offer
status              VARCHAR               -- payment_request: pending|paid|cancelled
                                          -- offer: pending|accepted|declined|countered
image_url           VARCHAR               -- image messages (Cloudinary URL)
created_at          TIMESTAMP
```
- `payment_request` — renders as a payment card UI, not plain text.
- `offer` — buyer-initiated price negotiation; seller can accept/decline.
- `image` — single inline image; populated from chat attach.

### transactions
```sql
id                  UUID PRIMARY KEY
conversation_id     UUID REFERENCES conversations(id)
buyer_id            UUID REFERENCES users(id)
seller_id           UUID REFERENCES users(id)
amount              DECIMAL
platform_fee        DECIMAL
seller_payout       DECIMAL
status              ENUM('pending', 'held', 'released', 'refunded', 'disputed')
paystack_reference  VARCHAR
created_at          TIMESTAMP
```

### disputes
```sql
id              UUID PRIMARY KEY
transaction_id  UUID REFERENCES transactions(id)
raised_by       UUID REFERENCES users(id)
reason          TEXT
evidence        VARCHAR (Cloudinary URL, optional)
status          ENUM('open', 'reviewing', 'resolved')
resolution      ENUM('refunded', 'released')
created_at      TIMESTAMP
resolved_at     TIMESTAMP
```

### notifications
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
title       VARCHAR
body        TEXT
type        ENUM('payment', 'message', 'dispute', 'system')
is_read     BOOLEAN DEFAULT false
created_at  TIMESTAMP
```

### boosts (live in frontend mocks; backend builds when ready)
Boosts a product into reserved sponsored slots in the feed. Distinct from
Discover ad campaigns.
```sql
id          UUID PRIMARY KEY
shop_id     UUID REFERENCES shops(id)
product_id  UUID REFERENCES products(id)
plan        VARCHAR             -- 'monthly' | 'quarterly' | 'biannual'
amount_paid DECIMAL
starts_at   TIMESTAMP
ends_at     TIMESTAMP
is_active   BOOLEAN DEFAULT true
```

### discover_posts
Short-form vertical videos shown in the Discover feed. Separate from the shop
catalog — these only live on the ad surface.
```sql
id           UUID PRIMARY KEY
shop_id      UUID REFERENCES shops(id)
video_url    VARCHAR (Cloudinary URL)
poster_url   VARCHAR (Cloudinary URL, optional)
caption      TEXT
cta_type     ENUM('product', 'shop')
cta_id       UUID                 -- products(id) when product, shops(id) when shop
impressions  INTEGER DEFAULT 0
clicks       INTEGER DEFAULT 0
saves        INTEGER DEFAULT 0
created_at   TIMESTAMP
```

### discover_campaigns
Paid promotion for a Discover post. Used to pick the ~25% paid slots.
```sql
id          UUID PRIMARY KEY
post_id     UUID REFERENCES discover_posts(id)
shop_id     UUID REFERENCES shops(id)
plan        VARCHAR             -- shares pricing with boosts
amount_paid DECIMAL
starts_at   TIMESTAMP
ends_at     TIMESTAMP
is_active   BOOLEAN DEFAULT true
```

### stories
24h-style shop stories surfaced on `/shops/[id]`.
```sql
id          UUID PRIMARY KEY
shop_id     UUID REFERENCES shops(id)
media_url   VARCHAR (Cloudinary URL)
caption     TEXT
product_id  UUID REFERENCES products(id)   -- optional deep link
duration_ms INTEGER DEFAULT 5000
expires_at  TIMESTAMP                       -- created_at + 24h
created_at  TIMESTAMP
```

### reviews
One review per completed transaction. Buyer rates seller.
```sql
id              UUID PRIMARY KEY
product_id      UUID REFERENCES products(id)
shop_id         UUID REFERENCES shops(id)
transaction_id  UUID REFERENCES transactions(id) UNIQUE
author_id       UUID REFERENCES users(id)
rating          INTEGER CHECK (rating BETWEEN 1 AND 5)
body            TEXT
created_at      TIMESTAMP
```

### wishlist_items
Cross-device wishlist. Frontend currently uses localStorage; this enables
sync.
```sql
user_id      UUID REFERENCES users(id)
product_id   UUID REFERENCES products(id)
created_at   TIMESTAMP
PRIMARY KEY (user_id, product_id)
```

### referrals
Per-user invite code with ₦500 credit on invitee's first completed sale.
```sql
id            UUID PRIMARY KEY
referrer_id   UUID REFERENCES users(id)
invitee_id    UUID REFERENCES users(id)   -- nullable until claimed
code          VARCHAR UNIQUE              -- lowercase slug, derived from handle
status        ENUM('pending', 'completed', 'expired')
reward_naira  INTEGER DEFAULT 500
created_at    TIMESTAMP
completed_at  TIMESTAMP
```

---

## 8. API Routes

### Auth
```
POST   /auth/signup
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

### Users
```
PATCH  /users/profile         update name, avatar, phone
PATCH  /users/role            switch between buyer and seller
```

### Shops
```
POST   /shops                 create shop
GET    /shops/:id             view any shop
PATCH  /shops/:id             update own shop
GET    /shops/me              get my own shop
```

### Products
```
POST   /products                       add product (multipart: image_files[] + JSON)
GET    /products/:id                   view single product
PATCH  /products/:id                   edit product (owner only)
DELETE /products/:id                   soft-delete (owner only)
PATCH  /products/:id/visibility        { hidden: boolean } — hide vs delete
GET    /products?shop=:shopId          all products in a shop
GET    /products/:id/reviews           paginated reviews + aggregate score
```

### Feed
```
GET    /feed?location=&cursor=&limit=  paginated, ranked product feed
```

### Search
```
GET    /search?q=:query&type=products[&location=]
GET    /search?q=:query&type=shops
GET    /search?category=:slug          category chip from landing
```

### Conversations
```
POST   /conversations                          start a conversation
GET    /conversations                          get my inbox
GET    /conversations/:id                      get conversation + messages
POST   /conversations/:id/messages             send a text message
POST   /conversations/:id/payment-request      seller sends payment request
POST   /conversations/:id/offer                buyer offers a price
PATCH  /conversations/:id/offer/:messageId     seller accepts/declines
POST   /conversations/:id/image                multipart image message
```

### Transactions
```
POST   /transactions/:id/pay          buyer pays a payment request
POST   /transactions/:id/confirm      buyer confirms delivery
GET    /transactions                  my transaction history
```

### Disputes
```
POST   /disputes              raise a dispute
GET    /disputes/:id          view dispute details
```

### Notifications
```
GET    /notifications                 get all my notifications
PATCH  /notifications/:id/read        mark one as read
PATCH  /notifications/read-all        mark all as read
```

### Discover ads
```
GET    /discover?cursor=&limit=               paginated ad feed (organic + paid mix)
POST   /discover/posts                        seller uploads ad video (multipart)
POST   /discover/campaigns                    buy/extend campaign (Paystack init)
GET    /discover/campaigns/me                 my campaigns
GET    /discover/campaigns/:id/analytics      per-campaign daily stats
POST   /discover/posts/:id/impression         fire-and-forget; batch on backend
POST   /discover/posts/:id/click              CTA tap
POST   /discover/posts/:id/save               save linked product to wishlist
```

### Boosts (product feed)
```
GET    /boosts/plans                  list active plans + pricing
POST   /boosts                        buy a product boost (Paystack init)
GET    /boosts/me                     my active boosts
```

### Stories
```
GET    /shops/:id/stories             active (non-expired) stories for a shop
POST   /shops/me/stories              multipart: image + caption + product_id?
```

### Reviews
```
POST   /reviews                       buyer leaves a review (one per transaction)
GET    /shops/:id/rating              aggregate score for a shop
```

### Wishlist
```
GET    /wishlist                      my wishlist product IDs
POST   /wishlist                      { productId }
DELETE /wishlist/:productId
```

### Referrals
```
GET    /referrals/me                  my code, link, total completed, total earned
POST   /referrals/claim               { code }  invitee on signup
GET    /r/:code                       public redirect → /signup?ref={code}
```

---

## 9. Real-time Events (Socket.io)

Socket.io handles both chat and notifications. Every user connects on login.
Every critical backend event emits to the affected user's socket AND triggers
a Resend email.

### Events
```
// Chat
message:new               new message in a conversation
payment_request:new       seller sent a payment request in chat
offer:new                 buyer made a price offer
offer:resolved            seller accepted/declined the offer
image:new                 new image attachment in chat

// Payments
transaction:paid          buyer paid — notify seller
transaction:confirmed     buyer confirmed delivery — notify seller (payout incoming)
transaction:released      funds released to seller

// Ads / Boosts
boost:metric              { productId, impressions, clicks } live counter
discover:metric           { postId, impressions, clicks } live counter

// Referrals
referral:completed        invitee's first sale closed; reward credited

// Disputes
dispute:opened            notify both parties
dispute:resolved          notify both parties with outcome

// Notifications (generic)
notification:new          any new notification for the user
```

### Unread notifications on reconnect
When a user reconnects, fetch all unread notifications from PostgreSQL
and emit them immediately.

---

## 10. Frontend Pages

### Public / Marketing
```
/                         marketing landing (Hero, HowItWorks, Comparison,
                          ForBuyers, ForSellers, Testimonials,
                          PopularCategories, FAQ, FinalCTA)
/legal/terms              terms of service
/legal/privacy            privacy policy
/help/escrow              escrow walk-through (linked from FAQ + chat banner)
/r/:code                  referral redirect → /signup?ref={code}
```

### Auth
```
/login
/signup                   accepts ?role=seller to preselect onboarding role
/forgot-password
```

### Onboarding (shown once after signup)
```
/onboarding               accept terms, pick starting role (reads ?role=)
```

### Buyer Pages
```
/feed                     scroll feed + location filter chip
/discover                 vertical video ad surface (separate from catalog)
/search                   results — Products + Shops tabs; ?q= or ?category=
/shops/[id]               shop storefront + stories strip + product grid
/products/[id]            product detail + carousel + reviews + sticky mobile CTA
/inbox                    all conversations; ?product= or ?shop= deep-links
/inbox/[id]               single conversation (most complex page)
/saved                    wishlist (Zustand-persisted)
/transactions             purchase history + post-purchase review prompt
/notifications            all notifications
/profile                  account, role, referral, preferences, sign out
```

### Seller Pages
```
/seller                   dashboard — earnings momentum + KPIs + recent activity
/seller/shop              manage shop details + pseudonym opt-in
/seller/products          grid + search + category chips
/seller/products/new      add a product (cover + gallery upload)
/seller/products/[id]/edit  edit a product
/seller/ads               Discover campaigns list + KPIs
/seller/ads/new           create a Discover ad campaign
/seller/ads/[id]          per-campaign analytics with SVG sparkline
/seller/inbox             seller conversations
/seller/inbox/[id]        single conversation
/seller/transactions      earnings and payout history
/seller/notifications     seller notifications
/seller/settings          preferences (tooltip toggle, etc.)
```

### Error Pages
```
/not-found
/unauthorized
```

---

## 11. /inbox/[id] — The Most Complex Page

This single page must handle:
- Real-time chat messages via Socket.io
- Payment request rendered as a special UI card (not plain text)
- Pay button for buyer when an unpaid payment request exists
- Confirm delivery button after payment is made
- Raise dispute button within allowed time window
- Warning banner: "Pay only through Ahia. Off-platform payments are not protected."
- Message input and send

Split this page into focused sub-components, each under 150 lines:
```
/inbox/[id]/
  page.tsx
  _components/
    ChatHeader.tsx
    MessageList.tsx
    MessageBubble.tsx
    PaymentRequestCard.tsx
    ChatInput.tsx
    WarningBanner.tsx
    ConfirmDeliveryButton.tsx
    DisputeButton.tsx
```

---

## 11b. Build Progress (as of 2026-05-26)

The frontend MVP shell is fully scaffolded against mock data. Every route below
returns 200 in `npm run dev` and the codebase passes `tsc --noEmit`.

### Routes shipped

**Public / Auth / Legal**
- `/` — marketing landing (Hero + HowItWorks + Comparison + ForBuyers + ForSellers + Testimonials + PopularCategories + FAQ + FinalCTA + founding-cohort urgency banner)
- `/login`, `/signup`, `/forgot-password` — split-screen brand panel + OAuth UI stubs
- `/signup?role=seller` — preselects seller role through onboarding
- `/legal/terms`, `/legal/privacy` — public legal stubs with NG-marketplace boilerplate

**Onboarding**
- `/onboarding` — terms + role pick (reads `?role=` from signup)

**Buyer shell** (top nav + mobile bottom-tab)
- `/feed` — paginated infinite scroll grid (IntersectionObserver sentinel) + location filter chip
- `/discover` — TikTok-style vertical snap-scroll, ad surface separate from shop catalog
- `/search` — Products + Shops tabs, URL-driven query, reads `?q` AND `?category`
- `/shops/[id]` — storefront + product grid + stories strip + chat-the-shop CTA
- `/products/[id]` — image carousel + sticky mobile CTA + Reviews + escrow note
- `/inbox` — conversation list; `?product=` and `?shop=` deep-link to or create a conversation
- `/inbox/[id]` — chat thread (text, payment_request, system, offer, image)
- `/saved` — wishlist persisted via Zustand `persist`
- `/help/escrow` — escrow explainer
- `/notifications`, `/transactions` (with post-purchase review prompt), `/profile`

**Seller shell** (left sidebar on desktop, slide-in drawer on mobile)
- `/seller` — dashboard with `EarningsMomentum` (week-on-week), KPIs, dispute alert, recent sales, unread messages, `PostStoryButton`
- `/seller/products` — grid + search + category chips, per-card actions: boost, preview-as-buyer (new tab), share-to-WhatsApp, hide-toggle, delete (AlertDialog confirm)
- `/seller/products/new`, `/seller/products/[id]/edit` — shared ProductForm with cover + gallery upload (file picker + URL fallback)
- `/seller/ads`, `/seller/ads/new`, `/seller/ads/[id]` — Discover ad funnel + per-campaign analytics with SVG sparkline
- `/seller/inbox`, `/seller/inbox/[id]` — uses shared chat machinery
- `/seller/transactions`, `/seller/notifications`, `/seller/shop` (with pseudonym helper text + "show legal name" opt-in), `/seller/settings` (preferences mirror of `/profile`)

**Error pages**
- `app/not-found.tsx` — global 404
- `/unauthorized` — sign-in required surface

### Architectural decisions made during build

- **Shared chat machinery lives in `src/components/chat/`**, not inside either inbox's `_components/`. `ChatThread`, `ChatHeader`, `ConversationRow` take a `perspective: "buyer" | "seller"` prop and an `inboxHref` / `basePath` so the same components render both sides.
- **Mocks-first data layer.** Every service function in `src/lib/services/` simulates a delay and returns mock data from `src/lib/mocks/`. Service functions are the swap point — replace bodies with Axios calls when the backend lands; pages and components don't change.
- **Server Actions handle mutations**, even in the mock phase. `src/lib/actions/conversations.ts` exposes `startConversation({ productId? , shopId? })`, which finds an existing thread or creates one and mutates the in-memory mock store. The "Chat with seller" buttons on product/shop pages call this and `router.push` to `/inbox/[id]`.
- **Zustand stores in `src/store/`** hold client state: `authStore` (user + `activeRole` toggle), `chatStore` (conversations, messagesByConversation, unreadCount), `notificationStore` (items + unreadCount). A `<StoreHydrator>` placed in each layout seeds the stores from server-fetched data on first render using a `useState` initializer (React 19 idiom for once-only render-time init). Nav badges and chat reads subscribe to the stores so changes (e.g. marking a conversation read on open) propagate without page reloads.
- **Theme bootstrap is an inline script** in `<head>` reading `localStorage` + `prefers-color-scheme`, with `suppressHydrationWarning` on `<html>`. Tried next-themes and `<Script beforeInteractive>` — both surfaced React 19 dev-only warnings without solving the underlying need.
- **No `<form>` elements per §14.7.** All forms (login, signup, product create/edit, shop settings) use individual `onChange` + an `onClick` submit handler. Native `<select>` is used directly because shadcn Select isn't installed yet.
- **`next.config.ts` allowlists `images.unsplash.com`** for next/image. Mixkit video URLs work without config because video isn't optimized by next/image.

### What's been added since 2026-05-24

- **Tooltip system** — `src/components/ui/tooltip.tsx` reads `preferencesStore.tooltipsEnabled` and locks closed when disabled. Toggle is on `/profile` and `/seller/settings`. Global `<TooltipProvider>` at root layout enables Radix skipDelay.
- **AlertDialog** — `src/components/ui/alert-dialog.tsx` built on `radix-ui`. Used by destructive product delete in `ProductGridCard`. Reusable for any future destructive confirm.
- **Discover ad funnel** — full type split (`DiscoverPost` vs `Product`), curated organic + paid mix (~25% paid at slots `[2,6,10]`), `/seller/ads` list + new + analytics. See `src/lib/services/discover.ts`.
- **Reviews** — `src/lib/services/reviews.ts` + mock data + `ProductReviews` on `/products/[id]` + `RateRecentPurchase` prompt on `/transactions`. One review per transaction.
- **Stories creator** — `PostStoryButton` on `/seller` opens a sheet that captures file + caption and posts via `createStory` server action. Stories auto-expire 24h.
- **Earnings momentum** — `EarningsMomentum` on `/seller` shows week-on-week earnings delta with trend arrow.
- **Share-to-WhatsApp** — seller product cards open WhatsApp with a pre-filled message and product URL.
- **Referral** — `ReferralSection` on `/profile` with copy-link + WhatsApp share. Code derived from user handle.
- **Landing additions** — `FoundingBanner`, `Comparison`, `Testimonials`, `FAQ` plus Hero CTA pointing to `/feed` (browse-before-signup).

### What's deliberately deferred until the backend exists

- Real Paystack flow (the "Pay" button just simulates a delay)
- Real Cloudinary upload (file picker shows local blob URL; production sends `File` to backend → Cloudinary)
- Real auth (any submit on `/login` just routes to `/feed`)
- Socket.io for live messages / notifications — the store setters (`chatStore.addMessage`, `notificationStore.add`) are the integration seam; call them from socket event handlers
- `StoreHydrator` only seeds on first render; if a Server Action mutates mock data, the client store won't see it until a hard reload. Acceptable for prototype.
- Discover impression/click event firing — `recordImpression(postId)` / `recordClick(postId)` to be wired into `DiscoverItem` once endpoints exist.

---

## 11c. Architecture Decisions (2026-05-29 backend integration)

These are real production decisions that affect every auth-gated and shop-related feature. Newcomers and future-me should read this before touching auth, role-switching, or shop creation flows.

### Cross-origin auth — client-side `/auth/me` reconcile

Frontend deploys to Vercel, backend to Render, **on different root domains** until the user buys `ahia.ng`. Browsers refuse to share cookies cross-origin, so Next.js SSR running on `localhost:3000` (or `*.vercel.app`) **cannot see** the session cookie that backend sets on `ahia-backend-4bio.onrender.com`. As a result:

- `getCurrentUser()` in server components returns `null` even for signed-in users
- Any SSR redirect like `if (!user) redirect("/login")` boots authed users
- Layouts must accept `user: null` without crashing

**The reconcile mechanism** ([src/components/StoreHydrator.tsx](src/components/StoreHydrator.tsx)):

1. SSR fetches `user` via `getCurrentUser()`. Cross-origin → returns null.
2. Layout passes that null `user` to `StoreHydrator`.
3. `StoreHydrator` always fires `GET /auth/me` from the browser on first render. The browser sends the cookie because the request is direct-to-backend.
4. On 200 → seeds `authStore` with the real user, sets `authReady: true`.
5. On 401 → calls `signOut()`, sets `authReady: true`.
6. On other errors (5xx, network) → leaves user state intact, still sets `authReady: true` (so gates don't hang).

**The gating mechanism** ([src/components/AuthGate.tsx](src/components/AuthGate.tsx)):

- Wrap any protected page or layout subtree in `<AuthGate>`.
- Shows a spinner until `authReady === true`.
- Once ready, renders children if `user` is set, else `router.replace("/login?next=<path>")`.
- **Never gate server-side** — every server `redirect("/login")` is a bug now.

When the user buys `ahia.ng`:
1. Backend cookie becomes `Domain=.ahia.ng; SameSite=Lax`
2. CORS allowlist tightens to `https://app.ahia.ng`
3. SSR will see cookies directly → `StoreHydrator`'s `/auth/me` becomes a no-op (kept as defense-in-depth, harmless)
4. `AuthGate` can be migrated to Next.js middleware if desired; not required

### Open Shop flow — one form, three entry points

Single reusable [OpenShopForm](src/components/OpenShopForm.tsx) triggered from:

1. **New signup picks Seller** — onboarding completes → routes to `/seller` → `SellerShellGate` sees no shop → renders the form
2. **Buyer clicks "Switch to seller" in top nav** ([SwitchToSellerButton.tsx](src/app/(buyer)/_components/SwitchToSellerButton.tsx)) — flips role if needed, navigates to `/seller`, form shows if no shop
3. **Buyer toggles role on `/profile`** ([RoleSelector.tsx](src/app/(buyer)/profile/_components/RoleSelector.tsx)) — same as above but from profile

The form:
- Calls `PATCH /users/role { role: "seller" }` if user is currently a buyer
- Calls `POST /shops { name, handle, category, location?, bio?, showLegalName }`
- Populates `useSellerShopStore` directly on success → SellerShell renders without an extra fetch
- Shows inline field errors for `handle_taken`, `shop_exists`, and Zod `VALIDATION_FAILED` (via `apiErr.fields`)

### Role-flip semantics — bidirectional, shop persists

`PATCH /users/role` is fully bidirectional. **The shop is never deleted on flip**. When a seller flips to buyer:

- `Shop` row stays in the DB untouched
- All `shopId` references on conversations, transactions, products, reviews remain valid
- `GET /shops/me` still returns the shop
- The shop becomes invisible in `/feed`, `/search?type=shops`, `/locations` because backend filters by `shop.owner.role === "seller"`
- Direct lookups (`/shops/:id`, `/products/:id`, `/products?shop=`) are unchanged — in-flight conversations and transactions resolve normally
- Flipping back to seller → shop reappears in feed/search; same row, same id, same history

This means a seller can take seasonal breaks without losing their shop, and "Switch to seller" in the top nav is a one-click reactivation.

### Field naming — match backend exactly, no mapping layer

Earlier the frontend had a `mapUser()` wrapper that renamed backend's `createdAt` to a frontend-only `joinedAt`. Removed 2026-05-29 because:

- Every new field is another silent-bug risk (e.g. backend returns `avatarUrl`, frontend's `Shop.avatar` was always undefined)
- For an MVP with one consumer + one controlled backend, the insulation has no value
- The mapper made it easy to forget at new call sites

**Convention going forward:**

- Frontend types use the **same field names** the backend returns
- Service mappers cast `unknown` → typed object but **do not rename**
- If backend changes a field name, we rename ours too — single search-and-replace
- Field naming convention is camelCase ISO strings for timestamps (`createdAt`, `updatedAt`) and `*Url` suffix for media URLs (`avatarUrl`, `bannerUrl`, `imageUrl`)

### Toast placement — corner vs center

[toastStore](src/store/toastStore.ts) supports `placement: "corner" | "center"` (default `corner`).

- **`corner`** — top-right on desktop, top-center on mobile. Used by `toast.success`, `toast.error`, `toast.info`. Default for everyday feedback ("Saved", "Couldn't sign in").
- **`center`** — viewport-centered, larger card with bigger icon. Used by `toast.confirm(title, description)`. Reserved for **identity-level events the user must notice**: role flips, shop opened, payment confirmed.

Use sparingly. If everything is a `confirm`, nothing is.

### Session lifetime

Backend confirmed 2026-05-30: session cookie + JWT both live **7 days**. No refresh-token endpoint. Frontend's "any 401 from `/auth/me` → sign out and redirect to /login" behavior is correct — when the cookie expires the user just signs in again.

### Authed pages use "thin server shell + client loader" — keep after `ahia.ng`

Cross-origin SSR can't see the backend cookie, so any page that fetches authed data has to fetch client-side. Pattern:

```tsx
// page.tsx — server component, ~10 lines
export const metadata = { title: "Conversation — Ahia" };
export default async function ChatPage({ params }) {
  const { id } = await params;
  return <ChatThreadLoader id={id} perspective="buyer" inboxHref="/inbox" />;
}
```

```tsx
// _components/ChatThreadLoader.tsx — client component
"use client";
export function ChatThreadLoader({ id, ... }) {
  // useEffect → apiClient().get(...) → render <ChatThread>
  // states: loading → loaded | not_found | other
}
```

Canonical examples: [ChatThreadLoader](src/components/chat/ChatThreadLoader.tsx), [InboxListClient](src/components/chat/InboxListClient.tsx). Both used by their buyer + seller routes.

**When to use:** any page whose primary data is auth-gated (inbox, transactions, notifications, seller dashboards, profile-scoped settings).

**When NOT to use:** pages whose primary data is guest-readable. Public product detail (`/products/[id]`), public storefronts (`/shops/[id]`), feed listings — these can SSR fine because no cookie is needed to fetch them.

**Why the loader-not-skeleton pattern is OK:**
- 200–400ms loader before paint is what users expect for chat-shaped UIs (WhatsApp Web, Slack, Discord, Linear all show loaders/skeletons for authed content)
- The server shell still pays for itself — it handles the route, params, and static metadata. So we're not a pure SPA; we're the standard Next.js hybrid.

**Why we keep this even after `ahia.ng`:**

Once we're same-origin, SSR *could* fetch authed data again. But we deliberately keep the loader pattern because:
1. One pattern for all authed pages is cheaper to maintain than two
2. First-paint cost is not measurable for our flows (chat, dashboards, inbox — all interactive surfaces where the first frame doesn't matter)
3. Refetch-on-focus, mutation invalidation, optimistic updates all live in the client layer anyway; moving the initial fetch to SSR splits that logic awkwardly
4. Server fetches force `unstable_cache` / `revalidateTag` choreography for live data; client fetch + Socket.io live events is simpler

Only migrate a specific page back to SSR if first-paint becomes a measurable problem on that page. Default: stick with the loader pattern.

### Brave Shields and cross-site cookies

Brave's **Bounce tracking protection** Shield (separate from generic cross-site cookie blocking) detects the Google OAuth redirect chain — frontend → backend → Google → backend → frontend — and drops the session cookie set in the final redirect response. Symptom: OAuth handshake completes, user row gets created in DB, but every subsequent authed call (including the first `/auth/me`) returns 401 because the cookie was never stored. Confirmed by backend log dump 2026-05-30 — same code in Edge/Chrome works on the first try.

**Manual email/password sign-in is NOT affected.** `POST /auth/login` is a direct fetch, not a bounce chain, so Brave's bounce-tracking heuristic doesn't fire. The cookie stores and rides along on subsequent `/auth/me` calls cleanly. This means the workaround for Brave users is simple: use email sign-in instead of Google.

This is **not a bug in our code or backend's code** — both correctly set `SameSite=None; Secure; withCredentials: true`. It's Brave being aggressive about redirect-chain cookies, which is reasonable tracking defense that happens to catch our OAuth flow as collateral damage.

Goes away permanently when we move to `app.ahia.ng` + `api.ahia.ng` (shared eTLD+1 → cookie is same-site by every browser's definition, including Brave). Until then, Brave users either need to lower Shields for our origins or use a different browser.

**Stopgap shipped 2026-05-30 (delete on `ahia.ng` migration):**
- [src/hooks/useIsBrave.ts](src/hooks/useIsBrave.ts) — detect Brave via the API it exposes for sites
- [src/components/BraveAuthWarning.tsx](src/components/BraveAuthWarning.tsx) — dismissible top banner shown on auth + onboarding layouts
- [src/lib/authSignal.ts](src/lib/authSignal.ts) — `markJustAuthed` / `consumeJustAuthed` sessionStorage flag
- [src/lib/authInterceptor.ts](src/lib/authInterceptor.ts) — global axios 401 handler: if `authStore.isAuthed` or `justAuthed` is true and `/auth/me` (or any authed call) returns 401, redirect to `/help/sign-in-blocked` and swallow the rejection so callers don't flash misleading toasts
- [src/app/help/sign-in-blocked/page.tsx](src/app/help/sign-in-blocked/page.tsx) — explainer page with Brave Shields fix + browser alternatives
- `markJustAuthed()` calls in [LoginForm.tsx](src/app/(auth)/login/_components/LoginForm.tsx), [SignupForm.tsx](src/app/(auth)/signup/_components/SignupForm.tsx), [OAuthButtons.tsx](src/app/(auth)/_components/OAuthButtons.tsx)
- `<BraveAuthWarning />` mounts in [(auth)/layout.tsx](src/app/(auth)/layout.tsx) and [(onboarding)/layout.tsx](src/app/(onboarding)/layout.tsx)

When the migration ships:
1. Delete the files above
2. Remove all `markJustAuthed()` callsites and the `<BraveAuthWarning />` mounts
3. Remove the `installAuthInterceptor` line in [src/lib/api.ts](src/lib/api.ts)
4. Tighten backend CORS to single allowlist entry (`https://app.ahia.ng`)
5. Flip backend cookie to `SameSite=Lax; Domain=.ahia.ng`

---

## 12. Project Folder Structure

```
ahia/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (onboarding)/
│   │   └── onboarding/
│   │       └── page.tsx
│   ├── (buyer)/
│   │   ├── layout.tsx               buyer shell layout
│   │   ├── page.tsx                 feed
│   │   ├── search/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   ├── shops/
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── _components/
│   │   ├── products/
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── _components/
│   │   ├── inbox/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   ├── transactions/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── (seller)/
│   │   ├── layout.tsx               seller shell layout
│   │   └── seller/
│   │       ├── page.tsx             dashboard
│   │       ├── shop/
│   │       │   ├── page.tsx
│   │       │   └── _components/
│   │       ├── products/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       ├── inbox/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx
│   │       │       └── _components/
│   │       ├── transactions/
│   │       │   └── page.tsx
│   │       └── notifications/
│   │           └── page.tsx
│   ├── not-found.tsx
│   ├── unauthorized.tsx
│   └── layout.tsx                   root layout
├── components/                      shared across multiple pages
│   ├── ui/                          shadcn components
│   ├── ProductCard.tsx
│   ├── ShopCard.tsx
│   ├── Avatar.tsx
│   ├── NotificationBell.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── services/                    per-domain API calls
│   │   ├── auth.ts
│   │   ├── shops.ts
│   │   ├── products.ts
│   │   ├── conversations.ts
│   │   ├── transactions.ts
│   │   └── notifications.ts
│   ├── socket.ts                    Socket.io client setup
│   ├── axios.ts                     Axios instance
│   └── utils.ts
├── store/                           Zustand stores
│   ├── authStore.ts
│   ├── notificationStore.ts
│   └── chatStore.ts
├── hooks/                           custom hooks
│   ├── useSocket.ts
│   ├── useNotifications.ts
│   └── useAuth.ts
├── types/
│   └── index.ts                     all TypeScript interfaces
└── middleware.ts                    route protection
```

---

## 13. Design System

### Colors

```css
/* Light Mode */
--color-primary:        #1A7A4A;   /* Deep Green — brand, trust */
--color-accent:         #F97316;   /* Warm Orange — CTAs, actions */
--color-background:     #F9FAFB;
--color-surface:        #FFFFFF;
--color-text-primary:   #111827;
--color-text-secondary: #6B7280;
--color-border:         #E5E7EB;
--color-success:        #22C55E;
--color-danger:         #EF4444;

/* Dark Mode */
--color-background:     #0F172A;
--color-surface:        #1E293B;
--color-text-primary:   #F9FAFB;
--color-text-secondary: #94A3B8;
--color-border:         #334155;

/* Primary and accent stay the same in dark mode */
```

### Typography

```
Headings:   Plus Jakarta Sans
Body:       Inter
Monospace:  Geist Mono (prices, references)
```

Load via `next/font` for zero layout shift.

### Visual Rules
- Rounded corners: `rounded-xl` to `rounded-2xl` throughout
- Cards: subtle shadow, no heavy borders
- Product images are the hero — full width, prominent
- Orange (`accent`) for primary CTA buttons only — one per screen
- Green (`primary`) for trust signals — verified, protected, confirmed
- No decoration clutter — minimal icons, clean whitespace
- Shadcn/ui base components extended with Tailwind, not overridden

### Dark Mode
- Implemented via Tailwind `dark:` variant
- Toggled by user preference, persisted in localStorage
- System preference respected on first load

---

## 14. Component Rules

1. **No component file exceeds 150 lines.** If it grows beyond this, split it.
2. **File collocation** — components live in `_components/` next to their page.
   Only components used in 2+ pages go in the top-level `components/` folder.
3. **One responsibility per component.** A component does one thing well.
4. **No inline logic in JSX.** Extract handlers and derived values above the return.
5. **TypeScript interfaces** for all props. No `any`.
6. **No unnamed exports.** Every component is a named export.
7. Never use `<form>` HTML element. Use `onClick` / `onChange` handlers instead.

---

## 15. Notifications

Every important event triggers:
1. A Socket.io emit to the affected user in real time
2. A record saved to the `notifications` table in PostgreSQL
3. A Resend email for critical events (payment, dispute)

### Notification events by user

**Buyer receives:**
- Payment confirmed and held
- Seller sent a message
- Dispute status updated
- Delivery confirmed, payout complete

**Seller receives:**
- New message from buyer
- Payment received and held in escrow
- Buyer confirmed delivery, payout incoming
- Dispute raised against your shop
- Payout sent to your account

**Both receive:**
- Account actions (password changed, profile updated)

---

## 16. Competitive Context

| Platform | Strength | Gap Ahia Fills |
|---|---|---|
| Jiji.ng | Huge inventory, free listings | No chat, no payments, no escrow |
| Jumia/Konga | Logistics, brand trust | Too corporate, no informal sellers |
| WhatsApp | Familiar, personal, fast | No discovery, no storefront, no protection |
| Facebook Marketplace | Free, local selling | Old UI, no escrow, not Nigeria-focused |

**Ahia's unique position:** Discovery (feed + search) + Personal negotiation (chat) +
Payment protection (escrow) — all in one flow. No competitor combines all three.

---

## 17. Revenue Model

1. **Transaction fee** — platform takes a % cut on every completed sale (auto-deducted on release). Default 5%.
2. **Discover ads** — sellers pay to put short-form video in front of the buyer Discover feed. Flat-fee monthly plans: ₦5,000 / 1mo, ₦12,000 / 3mo, ₦20,000 / 6mo. Frontend funnel is `/seller/ads*`.
3. **Product boosts** — sellers pay to surface a product in the feed's reserved sponsored slots. Shares pricing with Discover ads.
4. **Seller subscription** — optional monthly plan for advanced features (future).

At MVP, transaction fees + Discover ads + product boosts are all wired in
the frontend and ready for backend hookup. Seller subscriptions are still future.

---

## 18. What is NOT in MVP

Do not build these yet:

- Push notifications (web or mobile)
- Mobile app
- Seller analytics dashboard beyond the per-campaign Discover analytics that already ships
- Automated dispute resolution (manual admin review remains the path)
- Admin frontend (separate Next.js app, built after user app)
- Email verification on signup (add post-MVP)
- Social login (add post-MVP)
- AI background removal for product uploads (parked for cost; see backlog)
- School filter (needs `school` column on users + shops)
- Pay-on-delivery option (needs alternate transaction state machine)
- Mobile OTP onboarding (needs real auth + SMS provider)
- Bulk WhatsApp catalog import for sellers
- In-chat dispatch booking (GIG/Kwik/Gokada/Sendbox quotes inside conversation)
- Delivery tracking as in-chat system messages
- Quick-reply templates for sellers
- Seller verification tiers (phone → BVN → ID badges)
- Public buyer reputation (X successful purchases stat)
- Multipart avatar/banner upload on shop creation — backend supports `POST /shops` multipart; frontend `OpenShopForm` currently sends JSON only. Add when image upload is wired more broadly across product/profile flows.
- Wiring additional socket events as their features get tested — backend already emits `image:new`, `transaction:paid`, `transaction:confirmed`, `transaction:released`, `dispute:opened`, `dispute:resolved`, `boost:purchased`, `discover:campaign_started`. Frontend currently subscribes only to `message:new`, `offer:new`, `offer:resolved`, `notification:new`. Subscribe one at a time as each feature is tested end-to-end.
- Vercel preview-deploy CORS — backend needs the preview URL format added to `CLIENT_URL`. Send when known.
- Locking shop `category` and `location` to enums — backend accepts free-form strings today. Lock down if the catalog turns spammy or filter UX gets messy.

---

## 19. Admin App (Build Later)

Admin is a separate Next.js app. Same PostgreSQL database. Same Express backend.
Admin routes are protected by `role: admin` on the JWT.

Admin needs:
- Dashboard overview (users, shops, revenue, disputes)
- User management (view, suspend, ban)
- Shop management (view, deactivate)
- Dispute resolution (read chat, view transaction, decide outcome)
- Transaction history
- Boost/ads management (when built)

---

## 20. Environment Variables Needed

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# Backend (.env)
PORT=
DATABASE_URL=                  # Neon PostgreSQL
REDIS_URL=                     # Upstash Redis
JWT_SECRET=
JWT_EXPIRES_IN=7d
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
RESEND_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=                    # Frontend URL for CORS
PLATFORM_FEE_PERCENT=          # e.g. 5
```

---

## 21. Key Reminders

- Paystack is always called from Express, never from Next.js
- Every conversation fetch must verify the requester is the buyer or seller in it
- Socket.io serves both chat and notifications — do not add another real-time service
- Cloudinary images upload directly from the browser, only the URL is saved to the DB
- Dark mode uses Tailwind `dark:` variant with CSS variables
- Next.js 15 `params` is a Promise — always `await params` in page components
- Use `next/font` for all fonts
- All TypeScript, no JavaScript files
- Shadcn/ui components go in `components/ui/`, never modified directly
- **Never gate auth server-side cross-origin.** No `redirect("/login")` in server components or layouts — SSR can't see the backend cookie. Use `<AuthGate>` (client) instead. See §11c.
- **Match backend field names exactly** in frontend types — no mapping layer. Renames are search-and-replace. Convention: camelCase ISO timestamps (`createdAt`, `updatedAt`), `*Url` suffix for media URLs (`avatarUrl`, `bannerUrl`, `imageUrl`). See §11c.
- **`role` is the visibility switch, not a permission gate.** A seller can browse as a buyer via the client-side `activeRole` without changing `user.role`. Flipping `user.role` to "buyer" hides the shop from feed/search but never deletes it. See §11c.
- Use `toast.confirm()` (center) only for identity-level events. Everything else is corner placement. See §11c.