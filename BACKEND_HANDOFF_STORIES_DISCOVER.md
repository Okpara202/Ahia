# Backend handoff — Stories + Discover gaps

Sent 2026-06-06. Frontend is mid-test on these two surfaces. None of this is a blocker for sign-up / shopping / payments — but each item below either shows a visible bug to the seller or makes a counter read zero.

Please ack each numbered item with: **shipped / will ship / won't ship / clarifying question**.

---

## 1. Stories

### 1.1 `GET /shops/me/stories` rejects the `me` sentinel

**Symptom:** seller hits `/seller/stories`, the page renders the empty state even though they've posted stories. Backend returns `400 VALIDATION_FAILED { fields: { id: "Invalid uuid" } }`.

**Cause:** the route handler treats the `:id` segment as a UUID and validates it against a uuid regex before checking for the `me` literal.

**Ask:** accept `me` as a special case (resolve to the session user's shop), the same way `/shops/me`, `/shops/me/stories` (POST), and `/users/me` already do.

### 1.2 `DELETE /shops/me/stories/:id` — confirm exists

Frontend has been calling this since the story-delete UI shipped. If it returns 404/405, sellers see "Couldn't delete" on every attempt. Confirm or ship.

### 1.3 Story view tracking — confirm working

Frontend calls `POST /stories/:id/view` (fire-and-forget) every time a story panel renders for a viewer. Backend confirmed dedupe per session + Redis counter. Confirm the `viewCount` on `GET /stories/:id` and `GET /shops/me/stories` is being populated — the seller-side "Your stories" page shows `0 views` on every story we test against.

---

## 2. Discover ads

### 2.1 `DELETE /discover/posts/:id` — confirm exists

Frontend just shipped a Danger-zone "Remove post" action on `/seller/ads/[id]`. Same shape as `DELETE /products/:id`. Confirm or ship.

- For boosted posts, please cancel the campaign on delete (no refund — seller initiated).
- For free posts, just remove from the rotation.

### 2.2 `GET /discover/posts/:id` — direct single-post lookup

Right now `/seller/ads/[id]` paginates through `/discover/posts/me` until it finds the post. Works for the typical seller (<12 posts) but wasteful. A direct GET makes the page one request instead of N.

### 2.3 `GET /discover/posts/me?limit=` cap

Frontend tried `limit=100` and got `VALIDATION_FAILED { fields: { limit: "Number must be less than or equal to ..." } }`. Two questions:

- What's the cap?
- Document it on the existing handoff doc so we don't trip it again.

(Frontend has switched to walking pages with the default limit, so this isn't currently broken — but knowing the cap lets us tune page sizes.)

### 2.4 Impression + click counters reading zero

Symptom: every Discover post shows `Impressions: 0`, `Clicks: 0`, `CTR: 0.0%` on `/seller/ads/[id]` even after multiple views from different sessions.

**Frontend status (today):** `POST /discover/posts/:id/impression` is now fired from `DiscoverItem` the first time a video crosses 70% intersection ratio, and `POST /discover/posts/:id/click` is fired on CTA tap. Both are fire-and-forget — we swallow errors.

**Please verify:**

- The two endpoints exist and bump the counter.
- The counters are reflected on the `DiscoverPost` payload (we read `post.impressions` / `post.clicks`).
- Daily breakdown (`GET /discover/campaigns/:id/analytics`) reflects the same data for boosted posts.
- If you want a different threshold than "70% intersection" (e.g. minimum playback time), let us know — we'll match it.

### 2.5 Either add `campaignId` to DiscoverPost OR ship `GET /discover/posts/:id/analytics`

The seller analytics page makes two calls per boosted post: first `/discover/campaigns/me` to find the matching campaign id, then `/discover/campaigns/:id/analytics`. Either fix below collapses to one call:

- **Option A (cheap):** include `campaignId: string | null` on every DiscoverPost payload.
- **Option B (cleaner):** add `GET /discover/posts/:id/analytics` that internally resolves the campaign.

We don't care which — pick whichever fits backend's data model better.

### 2.6 `follow` notification link

Backend writes `link: "/seller/shop/followers"` on follow notifications — that route doesn't exist. The actual route is `/seller/followers`. Frontend has been rewriting it in `normalizeLink()` (NotificationRow.tsx). Five-character backend fix removes the dead link from the DB; we'll delete the rewrite.

---

## Summary table

| # | Item | Type |
|---|---|---|
| 1.1 | `GET /shops/me/stories` accept `me` sentinel | Fix |
| 1.2 | `DELETE /shops/me/stories/:id` confirm | Confirm |
| 1.3 | Story `viewCount` populated | Confirm |
| 2.1 | `DELETE /discover/posts/:id` confirm | Confirm |
| 2.2 | `GET /discover/posts/:id` direct lookup | New |
| 2.3 | `/discover/posts/me?limit=` cap value | Doc |
| 2.4 | Impression + click counters working | Confirm |
| 2.5 | `campaignId` on post OR post-keyed analytics | New |
| 2.6 | `follow` notification link | Fix |

Frontend has shipped all client-side wiring for these. Once you confirm / ship, we can delete the workarounds (pagination loop in `getDiscoverPostById`, `normalizeLink` in NotificationRow).
