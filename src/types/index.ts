export interface Shop {
  id: string;
  name: string;
  handle: string;
  verified: boolean;
  /** Public storefront description. Matches backend column `shops.bio`. */
  bio?: string;
  /** Cloudinary URL — shop avatar. */
  avatarUrl?: string;
  /** Cloudinary URL — shop banner. */
  bannerUrl?: string;
  /** Opt-in: surface the owner's legal name on the storefront. */
  showLegalName?: boolean;
  createdAt?: string;
  updatedAt?: string;
  totalSales?: number;
  /** Nigerian city/state the shop operates from. Used for buyer location filter. */
  location?: string;
  /** Primary category the seller picked at shop creation. */
  category?: string;
  /** Owner user id. Useful when checking "is this my shop". */
  ownerId?: string;
  /** Whether the signed-in viewer currently follows this shop. Returned by
   *  authed `GET /shops/:id`; undefined for guests. */
  isFollowing?: boolean;
  /** Total followers. Returned on all `GET /shops/:id` responses. */
  followerCount?: number;
  /** When false, the shop is paused — hidden from feed/search, new buyer
   *  actions blocked, existing conversations untouched. Defaults to true on
   *  create. Returned on all shop responses (including nested). */
  isActive?: boolean;
  /** Soft-delete timestamp. Non-null = shop is tombstoned. Frontend should
   *  treat null/undefined as "live". Direct lookups 404 once set, so we
   *  rarely see this in practice. */
  deletedAt?: string | null;
  /** Owner's legal name. Only present when `showLegalName === true` (or when
   *  the request is from the owner themselves via /shops/me). */
  ownerName?: string;
  /** Count of visible (non-hidden, non-deleted) products on the shop.
   *  Returned on /shops/:id, /shops/me, and POST/PATCH /shops responses —
   *  not on nested shop objects. */
  productsCount?: number;
}

export interface Story {
  id: string;
  shopId: string;
  media: Media;
  caption?: string;
  /** ISO timestamp — used to compute "X hours ago" and 24h expiry. */
  createdAt: string;
  /** Optional product this story is about, linked to from the viewer. */
  productId?: string;
  /** Total views. Owner-only field; 0 for non-owner reads. */
  viewCount?: number;
  /** Whether the signed-in viewer has already opened this story. False for
   *  guests; the strip dims the ring when true. */
  viewed?: boolean;
}

/** Embedded shop summary returned alongside `GET /stories/:id` so the SSR
 *  permalink page can render OpenGraph meta in one fetch. */
export interface StoryShopSummary {
  name: string;
  handle: string;
  avatarUrl?: string;
}

export type Media =
  | { type: "image"; url: string; alt?: string }
  | { type: "video"; url: string; poster?: string };

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  /** Hero/cover media — used as the thumbnail in feed/discover. */
  media: Media;
  /** Additional images shown in the product detail carousel. */
  gallery?: Media[];
  shop: Shop;
  /** True when this product is rendered in a paid (sponsored) slot. */
  sponsored?: boolean;
}

export type BoostPlanId = "monthly" | "quarterly" | "biannual";

export interface BoostPlan {
  id: BoostPlanId;
  label: string;
  months: number;
  priceNaira: number;
  /** Monthly equivalent, derived; surfaced in UI as "₦X/month". */
  perMonthNaira: number;
  /** Marketing tag, e.g. "Best value" / "Most popular". */
  tag?: string;
}

export interface Boost {
  id: string;
  productId: string;
  shopId: string;
  plan: BoostPlanId;
  amountPaid: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

/**
 * A vertical-video creative that lives ONLY on /discover.
 * Distinct from a Product — sellers post these explicitly for the ad surface
 * and they never appear on the shop storefront grid.
 */
export interface DiscoverPost {
  id: string;
  shopId: string;
  video: { url: string; poster?: string };
  caption?: string;
  /** Where the CTA inside the post navigates to. */
  cta:
    | { type: "product"; productId: string }
    | { type: "shop"; shopId: string };
  createdAt: string;
  /** Discover v2: 30-day TTL on every post. When boost-later replaces or
   *  extends the clock, this moves accordingly. Optional because older
   *  backend responses may not carry it yet — treat absence as "no TTL
   *  data, render without countdown." */
  expiresAt?: string;
  /** True when an active paid campaign is attached. Drives the "boost
   *  this" CTA on organic posts and unlocks the edit controls on paid
   *  ones. */
  sponsored?: boolean;
  /** Lifetime edit cap counter (starts at 3, decremented on each accepted
   *  edit). Backend writes this; frontend gates the UI on it. Undefined
   *  for posts uploaded before v2 — treat as 0 (no edits allowed) since
   *  pre-v2 had no edit feature. */
  editsRemaining?: number;
  /** Lifetime counters (mocked; updated by backend in production). */
  impressions: number;
  clicks: number;
  saves: number;
}

/**
 * A paid campaign that pushes a DiscoverPost into guaranteed slots.
 * Reuses BoostPlanId for pricing parity with the feed-boost flow.
 */
export interface DiscoverAdCampaign {
  id: string;
  postId: string;
  shopId: string;
  plan: BoostPlanId;
  amountPaid: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface DailyAdStat {
  /** ISO date (yyyy-mm-dd). */
  date: string;
  impressions: number;
  clicks: number;
}

export interface DiscoverFeedItem extends DiscoverPost {
  sponsored: boolean;
}

/**
 * Cursor-paginated product list. Service layer maps the backend's
 * `{ items, nextCursor }` shape onto this `{ products, nextCursor }` shape
 * so UI consumers stay stable.
 */
export interface FeedPage {
  products: Product[];
  nextCursor: string | null;
}

/**
 * Backend's Prisma enum is `buyer | seller | admin`. There's no `both`
 * — flipping role doesn't disable the other capability (a `seller` can still
 * buy, a `buyer` can still chat sellers). UI defaults to `seller` if the
 * user wants seller capabilities.
 */
export type UserRole = "buyer" | "seller";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Cloudinary URL — set via PATCH /users/profile when supported. */
  avatarUrl?: string;
  createdAt: string;
  /** Whether shops the user follows can start fresh conversations with them.
   *  Default true. Toggle exposed in /profile. */
  allowsColdDMs?: boolean;
  /** Count of shops the user follows. Drives the "Following X shops" badge
   *  in /profile and the buyer nav. */
  followingCount?: number;
  /** True when the user has a verified Paystack payout account on file.
   *  Drives the reminder banner in the seller shell and the inline note on
   *  /seller/transactions. */
  hasPayoutAccount?: boolean;
  /** Seller-only: kobo-precision decimal string of funds released to this
   *  seller since the last daily payout sweep. Phase 7 (option C). Drives
   *  the "Pending payout" card on /seller and the Cash out now button. */
  owedBalance?: string;
}

/* -------------------------------------------------------------------------- */
/*  Chat v1 types (shipped 2026-05-30 with backend's redesigned chat layer)   */
/* -------------------------------------------------------------------------- */

export type MessageType = "text" | "voice" | "image" | "invoice" | "system";

/** Minimal user shape returned inside conversations/messages. Backend returns
 *  `{id, name, avatarUrl}` — no `handle`/`verified` on chat embeds (those
 *  live on the full Shop record). */
export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** Shop embedded on conversation responses. Carries enough for the chat
 *  header link + paused-state guard. */
export interface ChatShop {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  isActive: boolean;
}

/** Per-message "Asking about: X" snapshot. Embedded at send time so a later
 *  product rename doesn't rewrite history. Backend returns `price` as a
 *  decimal string. */
export interface MessageContextProduct {
  id: string;
  name: string;
  price: string;
  coverUrl: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface BaseMessage {
  id: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  /** Non-null when the message has been edited (text-only, 15-min window). */
  editedAt: string | null;
  /** For messages YOU sent: when counterparty received it. For incoming
   *  messages: when you received it. */
  deliveredAt: string | null;
  /** Same convention as deliveredAt. Read-receipt tick state. */
  readAt: string | null;
  reactions: MessageReaction[];
  /** Optional product context attached WhatsApp-reply-style at send time. */
  contextProduct: MessageContextProduct | null;
  /** Optional story context — populated when the buyer replied to a story
   *  inside the StoryViewer. Snapshotted server-side at send time so the
   *  preview block keeps rendering after the story expires. */
  storyContext: StoryContext | null;
}

/** Embedded story snapshot carried on a chat message. Same fields that the
 *  original Story exposed at send time. Backend populates these server-side
 *  (frontend sends only `storyId`). */
export interface StoryContext {
  storyId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  posterUrl?: string;
  caption?: string;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  content: string;
}

export interface VoiceMessage extends BaseMessage {
  type: "voice";
  voiceUrl: string;
  voiceDurationMs: number;
  /** Voice messages don't have body content — backend returns null. */
  content: null;
}

export interface ImageMessage extends BaseMessage {
  type: "image";
  imageUrl: string;
  /** Caption stored in `content` per backend. Null when omitted. */
  content: string | null;
}

export interface InvoiceMessage extends BaseMessage {
  type: "invoice";
  invoice: Invoice;
  content: null;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  content: string;
}

export type Message =
  | TextMessage
  | VoiceMessage
  | ImageMessage
  | InvoiceMessage
  | SystemMessage;

/* -- Invoices --------------------------------------------------------------- */

export type InvoiceLineKind = "product" | "custom" | "discount";

export type InvoiceLineStatus = "pending" | "released" | "refunded";

export interface InvoiceLine {
  id: string;
  kind: InvoiceLineKind;
  /** Non-null only when kind='product'. */
  productId: string | null;
  /** Snapshotted at invoice creation. Stable even if product is renamed later. */
  name: string;
  quantity: number;
  /** Decimal string. Negative for kind='discount'. */
  unitPrice: string;
  status: InvoiceLineStatus;
  position: number;
  /** When status moved to released or refunded. */
  resolvedAt: string | null;
  /** When status='pending', this is the auto-release timestamp (paidAt + 7d).
   *  When a dispute is opened on this line, backend CLEARS this to null —
   *  so `status='pending' && autoReleaseAt === null` is how the UI detects
   *  a line that's frozen pending admin review. */
  autoReleaseAt: string | null;
  /** When the buyer extended their review window (one extension max per
   *  line). Non-null = the extension was used. */
  extendedAt: string | null;
  /** Short reason the buyer gave when extending. Shown on the seller's
   *  line badge so they understand why their money's held longer. */
  extensionReason: string | null;
}

export type InvoiceStatus =
  | "pending"
  | "paid"
  | "partial_released"
  | "fully_released"
  | "partial_refunded"
  | "fully_refunded"
  | "cancelled"
  | "disputed";

export interface Invoice {
  id: string;
  status: InvoiceStatus;
  /** Sum of line totals (qty × unitPrice incl. discounts). Decimal string. */
  totalAmount: string;
  paystackRef: string | null;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  lines: InvoiceLine[];
}

/* -- Conversation: list view vs detail view --------------------------------- */

/** Entry in `GET /conversations`. The list shape is different from the
 *  detail shape — list collapses the buyer/seller into "counterparty"
 *  (the one that ISN'T the requester) and includes a server-rendered
 *  message snippet. */
export interface ConversationListItem {
  id: string;
  counterparty: ChatUser;
  shop: ChatShop;
  lastMessage: {
    id: string;
    type: MessageType;
    /** Pre-rendered preview text — already includes emoji prefix for
     *  non-text types ("🎤 Voice (0:42)", "📷 Photo", "🧾 Invoice ₦25,500"). */
    snippet: string;
    senderId: string;
    createdAt: string;
  } | null;
  lastActivityAt: string;
  unreadCount: number;
}

/** The `conversation` field inside `GET /conversations/:id`. Explicit
 *  buyer + seller (no `participants[]` array). The product reference is
 *  per-message now — there's no longer one product per conversation. */
export interface ConversationDetail {
  id: string;
  buyer: ChatUser;
  seller: ChatUser;
  shop: ChatShop;
  createdAt: string;
  lastActivityAt: string;
}

/* -- Transactions (invoice-backed) ----------------------------------------- */

export type TransactionStatus =
  | "held"
  | "partial_released"
  | "fully_released"
  | "partial_refunded"
  | "fully_refunded";

/** Transactions are now read-only and back the invoice flow.
 *  Money movement happens via invoice-line confirm/dispute, not on
 *  the transaction itself. */
export interface Transaction {
  id: string;
  invoiceId: string;
  buyerId: string;
  sellerId: string;
  /** Decimal string. */
  totalPaid: string;
  /** Decimal string. */
  platformFee: string;
  paystackRef: string;
  status: TransactionStatus;
  paidAt: string;
  invoice: Invoice;
  buyer: ChatUser;
  seller: ChatUser;
}

/* -- Reviews (per invoice line) -------------------------------------------- */

export interface Review {
  id: string;
  productId: string;
  shopId: string;
  /** Originating invoice line — each released line earns one optional review. */
  invoiceLineId: string;
  authorId: string;
  authorName: string;
  rating: number;
  body?: string;
  createdAt: string;
}

/* -- Notifications --------------------------------------------------------- */

/**
 * Notification types emitted by the backend. Keep in sync with backend's
 * `notifications.type` enum. Chat v1 replaced the old `payment_*` types
 * with invoice-flow events.
 */
export type NotificationType =
  | "invoice_received"
  | "invoice_paid"
  | "invoice_received_payment"
  | "invoice_line_released"
  | "invoice_line_disputed"
  | "invoice_line_extended"
  | "dispute_resolved"
  | "boost_purchased"
  | "discover_campaign_started"
  | "referral_completed"
  /** Fan-out to followers when a seller un-pauses (isActive: false → true).
   *  `data` carries `{ shopId, shopName, shopHandle }`. */
  | "shop_reopened"
  /** Fan-out to followers when a shop posts a new story. `data` carries
   *  `{ shopId, shopHandle }`. Links to `/shops/:shopId`. */
  | "story_posted"
  /** Fired when funds are ready for release but the seller has no payout
   *  account on file. `data` carries `{ transactionId, amount }`. */
  | "payout_awaiting_account";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
  /** Soft-delete timestamp. Set when the user archives via DELETE
   *  /notifications/:id — backend then excludes the row from future
   *  GET /notifications responses. Frontend uses this only as a sanity
   *  flag; we usually drop archived rows from local state directly. */
  archivedAt?: string | null;
}

/* -- Disputes (per invoice line) ------------------------------------------- */

export type DisputeStatus = "open" | "reviewing" | "resolved";

export type DisputeResolution = "refunded_to_buyer" | "released_to_seller";

export interface Dispute {
  id: string;
  invoiceLineId: string;
  raisedById: string;
  reason: string;
  evidenceUrl: string | null;
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  createdAt: string;
  resolvedAt: string | null;
}
