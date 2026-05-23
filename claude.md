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
description     TEXT
logo            VARCHAR (Cloudinary URL)
category        VARCHAR
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
images          TEXT[] (array of Cloudinary URLs)
category        VARCHAR
is_available    BOOLEAN DEFAULT true
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
content             TEXT
type                ENUM('text', 'payment_request', 'system')
created_at          TIMESTAMP
```
`payment_request` is a special message type — renders as a payment card UI, not plain text.

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

### boosts (schema ready, feature built later)
```sql
id          UUID PRIMARY KEY
shop_id     UUID REFERENCES shops(id)
product_id  UUID REFERENCES products(id)
amount_paid DECIMAL
starts_at   TIMESTAMP
ends_at     TIMESTAMP
is_active   BOOLEAN DEFAULT true
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
POST   /products                    add product (seller only)
GET    /products/:id                view single product
PATCH  /products/:id                edit product (owner only)
DELETE /products/:id                delete product (owner only)
GET    /products?shop=:shopId       all products in a shop
```

### Feed
```
GET    /feed                  paginated, ranked product feed
```

### Search
```
GET    /search?q=:query&type=products
GET    /search?q=:query&type=shops
```

### Conversations
```
POST   /conversations                       start a conversation
GET    /conversations                       get my inbox
GET    /conversations/:id                   get conversation + messages
POST   /conversations/:id/messages          send a message
POST   /conversations/:id/payment-request   seller sends payment request
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

// Payments
transaction:paid          buyer paid — notify seller
transaction:confirmed     buyer confirmed delivery — notify seller (payout incoming)
transaction:released      funds released to seller

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

### Auth
```
/signup
/login
```

### Onboarding (shown once after signup)
```
/onboarding               accept terms, pick starting role
```

### Buyer Pages
```
/                         scroll feed (homepage)
/search                   search results — products and shops tabs
/shops/[id]               shop storefront + all products
/products/[id]            single product detail
/inbox                    all conversations
/inbox/[id]               single conversation (most complex page)
/transactions             purchase history
/notifications            all notifications
/profile                  edit profile, switch role
```

### Seller Pages
```
/seller                   seller dashboard overview
/seller/shop              manage shop details
/seller/products          all my products
/seller/products/new      add a product
/seller/products/[id]/edit  edit a product
/seller/inbox             seller conversations
/seller/inbox/[id]        single conversation
/seller/transactions      earnings and payout history
/seller/notifications     seller notifications
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

1. **Transaction fee** — platform takes a % cut on every completed sale (auto-deducted on release)
2. **Seller boosts** — sellers pay to appear higher in the feed (schema ready, build later)
3. **Seller subscription** — optional monthly plan for advanced features (future)

At MVP, only transaction fees are active.

---

## 18. What is NOT in MVP

Do not build these yet:

- Boost/ads system (schema exists, UI does not)
- Trust scores and reviews
- Push notifications (web or mobile)
- Mobile app
- Seller analytics dashboard
- Automated dispute resolution
- Admin frontend (separate Next.js app, built after user app)
- Email verification on signup (add post-MVP)
- Social login (add post-MVP)

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