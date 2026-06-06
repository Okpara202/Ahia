# Admin app — backend API reference

**Source:** Backend doc 2026-06-07. This is the canonical contract — replaces per-phase docs.
**Status:** Backend shipped all four phases + user-app side changes. Frontend work begins.

> Full original doc preserved below verbatim so we never have to re-ask. Treat as the source of truth for endpoint shapes, error codes, action vocabulary, and socket events.

---

## What v1 ships

Admin app backend with 27 endpoints + 1 socket event + 1 cron + audit log machinery.

- Sign in admins with email + password + TOTP 2FA, backup codes for lost devices, DB-backed sessions for instant revocation
- Resolve disputes — queue → scoped chat history → admin can post into chat as "Ahia Support" → two-button refund/release with mandatory note
- Moderate users + shops — search, view, suspend with reason, restore
- Manage other admins (super-admin only) — invite, suspend, change role, reset 2FA
- Audit log of every admin action — auto-scoped to own actions for regular admins; full view for super-admin
- 14-day auto-resolve cron with refund-buyer default and distinct notification copy
- Real-time `dispute:created` socket event to the `admins` room

---

## 1. Authentication endpoints

### POST /admin/auth/login
Rate-limited: 5 failed attempts per (email + IP) per 15 min.

```
Request:  { email, password }
First-ever login:   200 { ok: true, next: "2fa_setup",  setupToken: "<jwt 10m>" }
Returning login:    200 { ok: true, next: "2fa_verify", loginChallenge: "<jwt 5m>" }
Errors: 401 invalid_credentials | 403 account_suspended | 429 too_many_attempts
```

### GET /admin/auth/2fa/setup
Auth: `Authorization: Bearer <setupToken>` or `?token=...`.

```
200 { secret, qrDataUrl, otpauth }
```

### POST /admin/auth/2fa/setup
```
Request:  { setupToken, totpCode }
200 { ok: true, backupCodes: [10 codes, one-time view] }   // session cookie also set
```

### POST /admin/auth/2fa/verify
```
TOTP:        { loginChallenge, totpCode }
Backup:      { loginChallenge, backupCode }
200 { ok: true, backupCodesRemaining? }
```

### POST /admin/auth/logout
Always 204. Idempotent. Revokes current session.

### GET /admin/auth/me
```
200 { admin: { id, email, name, role, totpEnabled, status } }
```

### POST /admin/auth/change-password
Strict: ≥12 chars + ≥1 digit + ≥1 symbol.
```
Request:  { currentPassword, newPassword }
Side-effect: revokes ALL other sessions for this admin (revoked_reason = "manual")
```

---

## 2. Disputes endpoints

### GET /admin/disputes
Query: `cursor?`, `limit? (1-50, default 20)`, `status? (open|reviewing|resolved|all, default open includes both open AND reviewing)`, `sort? (oldest|newest|amount_desc|amount_asc)`.

Response: `{ items: DisputeQueueItem[], nextCursor }`.

`DisputeQueueItem` = `{ id, status, reason, evidenceUrls[], raisedAt, ageHours, amount, line { id, name, quantity, unitPrice, product? }, invoiceId, conversationId, buyer, seller, raisedBy }`.

### GET /admin/disputes/:id
Full detail + entire conversation via the scoped join.
Writes audit: `read_dispute_messages`.

```
200 { dispute, line, invoice, buyer, seller, raisedBy, messages[], counts { previousDisputesByBuyer, previousDisputesBySeller } }
```

### POST /admin/disputes/:id/messages (multipart/form-data)
Post into the buyer-seller chat as "Ahia Support". Allowed only when status is `open` or `reviewing`. First admin post auto-injects a system message ("Ahia Support joined this conversation to help resolve the dispute.") FIRST.

```
Body: content? (≤4000 text)  AND/OR  image_file? (≤10MB)
Errors: 400 empty_message | VALIDATION_FAILED | 403 dispute_resolved | 404 NOT_FOUND | 413 FILE_TOO_LARGE
```

Both messages broadcast via existing `message:new`.

### POST /admin/disputes/:id/resolve
```
Request:  { resolution: "refunded" | "released", note (≥20, ≤2000) }
Maps:     refunded → refunded_to_buyer; released → released_to_seller
Side effects on success:
  1. Dispute → resolved with note + admin attribution
  2. Invoice line → refunded or released
  3. Money moves (Paystack refund OR seller balance credit)
  4. Invoice status recomputed
  5. invoice:line_refunded or invoice:line_released socket event to both parties
  6. Notifications via disputeResolved renderer
  7. Audit: resolve_dispute with note + resolution metadata
```

---

## 3. Users moderation endpoints

### GET /admin/users
`q? (email + name)`, `status? (active|suspended|all)`, `cursor?`, `limit?`.

### GET /admin/users/:id
Detail + nested shops + counts (buyer/seller conversations, disputes raised, invoices, shops).

### POST /admin/users/:id/suspend
```
Body: { reason (≥20, ≤2000) }
Cascade:
  - users.status = "suspended" + suspendedAt + reason + suspendedById
  - All non-demolished shops → adminSuspendedAt = now, timestamp-matched for restore safety
  - Next authed request → 403 account_suspended
  - Login also rejects
  - Audit: suspend_user
Errors: 404 | 409 already_suspended
```

### POST /admin/users/:id/restore
```
Body: { reason }
- Clears user suspension fields
- Lifts only shop suspensions matching prior cascade timestamp (independent admin shop-actions survive)
- Audit: restore_user
Errors: 404 | 409 not_suspended
```

---

## 4. Shops moderation endpoints

### GET /admin/shops
`q? (handle + name)`, `status? (active|deactivated|demolished|all)`, `cursor?`, `limit?`.

### GET /admin/shops/:id
Detail + counts (products, followers, discoverPosts, stories).

### POST /admin/shops/:id/deactivate
```
Body: { reason }
Errors: 404 | 410 shop_gone | 409 already_deactivated
Audit: deactivate_shop
```

### POST /admin/shops/:id/restore
```
Body: { reason }
Errors: 404 | 410 shop_gone | 409 not_deactivated
Audit: restore_shop
```

---

## 5. Admin management endpoints (super-admin only)

### GET /admin/admins
`q?`, `role? (admin|super_admin|all)`, `status?`, `cursor?`, `limit?`.

### GET /admin/admins/:id
Detail.

### POST /admin/admins
Invite. Backend stores hash; super-admin shares email + temp password out-of-band.

```
Body: { email, name, role: "admin"|"super_admin", initialPassword (≥6) }
New admin's first login → next: "2fa_setup" → after, uses POST /admin/auth/change-password to set strong password (≥12, digit, symbol)
Errors: 409 admin_exists (with fields.email)
```

### POST /admin/admins/:id/suspend
```
Body: { reason }
- admin_users.status = suspended + attribution
- All sessions revoked immediately
- Audit: suspend_admin
Errors: 404 | 409 already_suspended | 409 self_target | 409 last_super_admin
```

### POST /admin/admins/:id/restore
```
Body: { reason }
Audit: restore_admin
Errors: 404 | 409 not_suspended
```

### POST /admin/admins/:id/role
```
Body: { role, reason }
Audit: promote_admin or demote_admin
Errors: 404 | 409 self_target | 409 role_unchanged | 409 last_super_admin
```

### POST /admin/admins/:id/reset-2fa
```
Body: { reason }
- Clears totpSecret, totpEnabled=false
- Deletes all backup codes
- Revokes all sessions
- Audit: reset_admin_2fa
Errors: 404 | 409 totp_not_enabled
```

---

## 6. Audit log endpoint

### GET /admin/audit
`adminId?` (super-admin only; regulars auto-scoped to themselves), `action?`, `targetType? (admin|dispute|user|shop|auth|session)`, `targetId?`, `from?`, `to?`, `cursor?`, `limit? (1-100, default 50)`.

Response: `{ items: AuditEntry[], nextCursor }` where:

```
AuditEntry = {
  id, adminId?, admin? { id, name, email, role },
  actor: "<name>" | "system",
  action, targetType, targetId,
  reason?, metadata?, ipAddress?, userAgent?,
  createdAt
}
```

Regular admin passing `adminId` for someone else → silently scoped to self (no error leak).

---

## 7. Audit action vocabulary

| action | When |
|---|---|
| `login` | Successful login (post-2FA) |
| `login_failed` | Wrong password / TOTP / suspended account (metadata.reason) |
| `logout` | POST /admin/auth/logout |
| `change_admin_password` | POST /admin/auth/change-password |
| `read_dispute_messages` | GET /admin/disputes/:id or POST /admin/disputes/:id/messages |
| `resolve_dispute` | Manual resolve (metadata.resolution) |
| `auto_resolve_dispute` | 14-day cron auto-refund (adminId = NULL) |
| `suspend_user` / `restore_user` | User actions |
| `deactivate_shop` / `restore_shop` | Shop actions |
| `create_admin` / `suspend_admin` / `restore_admin` | Admin lifecycle |
| `promote_admin` / `demote_admin` | Role changes |
| `reset_admin_2fa` | TOTP + backup codes wiped |

---

## 8. User app side: what changed (this repo's work)

### 8.1 Message gains `senderType` (and `senderName` for admin) — VISIBLE

Every message-returning endpoint now includes `senderType`:

| senderType | senderId | senderName | When |
|---|---|---|---|
| `user` | UUID | resolve from participants | Buyer or seller (existing) |
| `system` | null | none | System-injected ("Ahia Support joined...") |
| `admin` | null | `"Ahia Support"` | Admin posted via /admin/disputes/:id/messages |

Render rules:
- `user` → existing bubble
- `system` → centered grey, no bubble
- `admin` → distinct bubble (shield icon + "Ahia Support" + different color)

Affects `mapMessage` + the message bubble components. `message:new` socket event uses the same shape.

### 8.2 403 account_suspended — VISIBLE

When admin suspends a user:
- User's cookie still exists but next authed request → `403 { error: { code: "account_suspended", message: <reason> } }`
- Login also rejects with same code

Frontend work:
- Interceptor on 403 with code `account_suspended` → redirect to a suspended-account page that shows the reason, clears cached state, blocks further requests
- Login form handles the same code

`optionalAuth` middleware still works — suspended users can browse public surfaces as guests.

### 8.3 Notification type `dispute_auto_resolved` — VISIBLE

Cron writes notifications with `type: "dispute_auto_resolved"` (distinct from manual `dispute_resolved`):
- Buyer copy: "Dispute resolved automatically — Refunded" / "<item> · ₦<amount> · We refunded you automatically because the seller didn't respond in 14 days."
- Seller copy: "Dispute auto-resolved — Refunded" / "<item> · ₦<amount> · Auto-resolved after 14 days. ₦<amount> refunded to buyer."

Payload has `"auto": true` so we can use a distinct icon (e.g. clock).

### 8.4 `invoice:line_refunded` socket flag (optional)

The existing event now sometimes carries `"auto": true` when the cron fires. Optional to render distinctly.

### 8.5 Discover counter rate limit — INVISIBLE

`POST /discover/posts/:id/impression`, `/click`, `/save` → 60/min per IP. Already fire-and-forget; errors swallowed. 429 with `code: "too_many_requests"` if hit — treat as silent OK.

### 8.6 Payment-init endpoints accept `Idempotency-Key` (opt-in) — RECOMMENDED

`POST /invoices/:id/pay`, `POST /boosts`, `POST /discover/campaigns` now check `Idempotency-Key` header.

- With header: stored in Redis 5 min; second request with same key → `409 duplicate_request`
- Without header: backend behaves as before

Pattern:
```ts
const idempotencyKey = crypto.randomUUID();
await apiClient().post("/boosts", body, {
  headers: { "Idempotency-Key": idempotencyKey },
});
```

Retry with the SAME key on failure. 409 = original request landed; treat as success.

Key regex: `^[A-Za-z0-9_-]{8,128}$` (UUID satisfies).

Prevents the "user double-clicks Pay during slow network → two Paystack pages → two charges" failure.

### 8.7 N+1 batching + Cloudinary retries — INVISIBLE

`GET /discover/posts/me` and `GET /shops/me/stories` faster; Cloudinary destroy retries on transient blips. No API shape change.

---

## 9. Socket events

### New: `dispute:created` (admin room only)

Fires when a buyer raises a dispute. Sent to the `admins` Socket.io room only. Buyers and sellers do NOT receive this (they get the existing `invoice:line_disputed`).

```
{ disputeId, lineId, invoiceId, conversationId, raisedAt, amount, reason }
```

### New: `admin:watch` / `admin:unwatch` (client → server, admin only)

Admin opts in to receive live `message:new` for a specific conversation (three-way live chat).

```js
// On entering dispute detail page
socket.emit("admin:watch", { conversationId });
// Backend joins admin's socket to conversation:<id> room IF an open/reviewing
// dispute exists on that conversation. Silent no-op otherwise.

// On leaving page / dispute resolve / tab close
socket.emit("admin:unwatch", { conversationId });
// Auto-cleanup on disconnect as belt-and-suspenders.
```

After `admin:watch`, admin receives `message:new` for buyer/seller messages, admin's own posts (echo), and the system "Ahia Support joined…" message.

**Frontend must dedupe by `message.id`** — POST response and socket echo arrive separately. Use a `Map<id, message>` or upsert pattern.

### Changed: `message:new`

Now sometimes carries `senderType: "admin"` when admin posts into a buyer-seller chat. Existing handler must branch on `senderType`. Also reaches admin's socket when watching a conversation.

### Changed: `invoice:line_refunded`

Now sometimes carries `auto: true` as a top-level field (cron-triggered auto-resolve). Treat `auto !== true` as admin-resolved.

### Admin socket connection

Same Socket.io endpoint as users. Backend tries user cookie first, falls back to `ahia_admin_session`. On valid admin connection, socket auto-joins the `admins` room.

Don't send user-only events (`heartbeat`, `typing:start`) from admin sockets — ignored.

---

## 9b. Confirmed behavior (2026-06-08 reply)

### Dispute lifecycle

- **`reviewing` status is unused at v1** — disputes stay `open` until `resolved`. No claim endpoint. Treat queue as flat list.
- **Conflict on simultaneous resolve:** `409 { error: { code: "dispute_already_resolved", message: "..." } }`. Branch on the code, toast, refetch the dispute.
- **After resolve:** conversation stays open for buyer + seller chat. Admin loses write + read access. Admin's posts + system messages stay in chat history forever.
- **14-day auto-resolve race:** if cron resolves while admin is on the page, admin's POST also returns `409 dispute_already_resolved`. Same handler pattern.

### Auth + session

- **`403 account_suspended`** fires from `requireAuth` middleware — `/auth/me`, any authed write. Body: `{ error: { code: "account_suspended", message: "<reason>" } }`.
- **Backend does NOT clear cookie on suspension** — frontend must call `signOut()` to clean up locally.
- **`optionalAuth` routes treat suspended users as guests** — `/feed`, `/discover`, public product pages return 200 with no `user` field.
- **Suspended users blocked from EVERY authed write** — including raising disputes on previously-paid invoices. Manual support escalation only.
- **Last super-admin loses 2FA + backup codes:** DB intervention required (`UPDATE admin_users SET totp_secret = NULL, totp_enabled = false; DELETE FROM admin_backup_codes; DELETE FROM admin_sessions`).
- **Admin sockets DO NOT disconnect on session revoke** — only HTTP requests 401. Acceptable for v1.

### Idempotency-Key

- **Generate a fresh UUID per Pay click**, not per component mount. Click = intent.
- **Collision returns `409 duplicate_request`** — strictly an error, no response replay. On 409, route to `/payments/return?reference=<unknown>` and let polling resolve.
- **5-minute Redis TTL.** A user sitting on Paystack >5 min then re-clicking gets a new key naturally (fresh click), which is correct.

### Evidence (dispute creation)

- **Images only**, 10MB cap per file, 5 files max
- **Public Cloudinary URLs**, no TTL/signed URLs at v1 — don't hard-cache, refetch on mount
- PDFs/videos deferred to v1.1

### Notification + socket payload locations

- **`dispute_auto_resolved` notification link** = same shape as `dispute_resolved` → `/inbox/:conversationId` (buyer) / `/seller/inbox/:conversationId` (seller).
- **`auto: true` on `invoice:line_refunded`** is top-level on the event payload:
  ```json
  { lineId, invoiceId, conversationId, resolution: "refunded", invoiceStatus: "refunded", disputeId, auto: true }
  ```
  For admin-resolved refunds, `auto` is absent.
- **`senderType` always present on messages** — historical rows map to `"user"` via the backend mapper. Frontend's defensive default is fine but redundant.

### Bootstrap operator runbook (per backend C3)

1. Set Render env: `ADMIN_BOOTSTRAP_EMAIL` + `ADMIN_BOOTSTRAP_PASSWORD` (min 6 chars, temporary)
2. Trigger redeploy
3. Check boot logs: `Bootstrap admin created: <email>`
4. Navigate to `admin.ahia.ng/login` → log in with bootstrap creds
5. Forced through 2FA setup flow — scan QR, save 10 backup codes
6. Force-change password via `/admin/auth/change-password` (admin app should redirect first-login users)
7. **Remove `ADMIN_BOOTSTRAP_*` env vars from Render**

Bootstrap conditions: creates admin ONLY if both env vars set AND `admin_users` table is empty. Idempotent — won't duplicate. But env hygiene matters (Render dashboard access = password access).

---

## 10. DB migrations applied

| Migration | Adds |
|---|---|
| `20260606200000_admin_phase1` | admin_users, admin_backup_codes, admin_sessions (revocation + IP/UA), admin_actions; User.status + suspension cols; Shop.adminSuspendedAt + suspension cols; Dispute.resolvedByAdminId + resolutionNote; Dispute.evidence_url → evidence_urls TEXT[] |
| `20260607100000_admin_phase2_messages` | messages.admin_author_id FK + index |

Both on dev + prod.

---

## 11. v1 deferred (v2+)

- Email notifications (admin + resolve emails) — Resend not wired
- Forgot-password flow for admin — needs Resend
- Per-action permission scopes — roles enough for v1
- Bulk operations
- Manual SLA configuration UI — 14-day cap hard-coded
- Forensics: super-admin views other admins' sessions — possible from table, no API yet
- Analytics dashboards
- Fraud rule engine
- Payout reconciliation UI
- Customer support inbox
- GDPR / NDPR data export + right-to-be-forgotten
- Email-based admin invite link

Operational deferred:
- Paystack live mode activation — still `sk_test_`. Refunds don't move real money until activated
- Manual session list/revoke endpoint for super-admin
- Inbox unread N+1 batching

---

## 12. Frontend work owed to backend (this repo)

| Priority | Task | Endpoints |
|---|---|---|
| HIGH | Handle `senderType: "admin"`/`"system"` in chat rendering | All message-returning |
| HIGH | Handle `403 account_suspended` interceptor + suspended-account page | POST /auth/login + every authed |
| MEDIUM | Render `dispute_auto_resolved` notification with distinct icon | notifications |
| MEDIUM | Optional: render `auto: true` on `invoice:line_refunded` distinctly | dispute history |
| LOW | Add `Idempotency-Key` to payment POSTs (3 services) | /invoices/:id/pay, /boosts, /discover/campaigns |

Admin app frontend (separate repo `ahia-admin`) work is deferred to its own session.
