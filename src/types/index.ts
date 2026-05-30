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
}

export type MessageType =
  | "text"
  | "payment_request"
  | "system"
  | "offer"
  | "image";

export type PaymentRequestStatus = "pending" | "paid" | "cancelled";

export type OfferStatus = "pending" | "accepted" | "declined" | "countered";

export interface BaseMessage {
  id: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  content: string;
}

/**
 * Legacy message kind from earlier mocks. The backend doesn't emit these in
 * v1 — buyer-initiated `offer` + buyer "Pay" via `POST /transactions { productId }`
 * carries that flow now. Kept in the union so existing mock data still
 * type-checks; rendered as a quiet read-only card.
 */
export interface PaymentRequestMessage extends BaseMessage {
  type: "payment_request";
  amount: number;
  status: PaymentRequestStatus;
  note?: string;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  content: string;
}

export interface OfferMessage extends BaseMessage {
  type: "offer";
  amount: number;
  status: OfferStatus;
  note?: string;
}

export interface ImageMessage extends BaseMessage {
  type: "image";
  url: string;
  alt?: string;
  caption?: string;
}

export type Message =
  | TextMessage
  | PaymentRequestMessage
  | SystemMessage
  | OfferMessage
  | ImageMessage;

export interface ConversationParty {
  id: string;
  name: string;
  handle: string;
  verified: boolean;
}

export interface Conversation {
  id: string;
  buyer: ConversationParty;
  seller: ConversationParty;
  product: { id: string; name: string; price: number; media: Media };
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
}

export type TransactionStatus =
  | "pending"
  | "held"
  | "released"
  | "refunded"
  | "cancelled"
  | "disputed"
  /** Dispute resolution outcomes. */
  | "resolved_buyer"
  | "resolved_seller";

export interface Transaction {
  id: string;
  product: { id: string; name: string; media: Media };
  shop: { id: string; name: string; handle: string };
  amount: number;
  platformFee: number;
  status: TransactionStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  /** Product the buyer is rating. */
  productId: string;
  /** Shop the product belongs to. Denormalized for shop-level aggregation. */
  shopId: string;
  /** Originating transaction — every review is anchored to a completed sale. */
  transactionId: string;
  /** Buyer who left the review. */
  authorId: string;
  authorName: string;
  /** 1-5 stars. */
  rating: number;
  /** Optional free-text body, max ~280 chars at write time. */
  body?: string;
  createdAt: string;
}

/**
 * Notification types emitted by the backend. The frontend renders type-specific
 * copy per CLAUDE.md §15. Keep this in sync with the `notifications.type` enum
 * defined in the backend.
 */
export type NotificationType =
  | "payment_paid"
  | "payment_received"
  | "payment_released"
  | "dispute_opened"
  | "dispute_resolved"
  | "boost_purchased"
  | "discover_campaign_started"
  | "referral_completed"
  /** Fan-out to followers when a seller un-pauses (isActive: false → true).
   *  `data` carries `{ shopId, shopName, shopHandle }`. */
  | "shop_reopened";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

/**
 * Dispute lifecycle states from the backend's Prisma enum.
 * - `open` — buyer just raised it; admin hasn't touched yet
 * - `resolved_buyer` — admin sided with the buyer; funds refunded
 * - `resolved_seller` — admin sided with the seller; funds released
 * - `cancelled` — buyer or admin withdrew before resolution
 */
export type DisputeStatus =
  | "open"
  | "resolved_buyer"
  | "resolved_seller"
  | "cancelled";

export interface Dispute {
  id: string;
  transactionId: string;
  raisedById: string;
  reason: string;
  status: DisputeStatus;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
