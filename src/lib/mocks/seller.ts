import type {
  Conversation,
  Message,
  Notification,
  Product,
  Shop,
  Transaction,
} from "@/types";
import { CURRENT_USER } from "./user";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

export const MY_SHOP: Shop = {
  id: "s_me",
  name: "Chi's Closet",
  handle: "@chiscloset",
  verified: true,
  bio: "Curated Y2K, vintage, and modern pieces. Lagos-based, ship nationwide via GIG and DHL.",
  createdAt: "2025-01-15",
  totalSales: 24,
};

const sellerHandle = MY_SHOP.handle;

export const MY_PRODUCTS: Product[] = [
  {
    id: "mp_01",
    name: "Vintage silk slip dress — size 8, champagne",
    price: 18500,
    category: "Fashion",
    description:
      "Y2K silk slip dress in champagne. Light wear, no stains, adjustable straps. UK size 8, fits 6–10.",
    media: {
      type: "image",
      url: IMG("photo-1539109136881-3be0616acf4b"),
      alt: "Champagne silk slip dress",
    },
    shop: MY_SHOP,
  },
  {
    id: "mp_02",
    name: "Cropped leather jacket — black, size M",
    price: 32000,
    category: "Fashion",
    description:
      "Real leather, oversized cropped fit. Bought from Topshop, only worn twice. Size M (UK 10-12).",
    media: {
      type: "image",
      url: IMG("photo-1551028719-00167b16eac5"),
      alt: "Black leather jacket",
    },
    shop: MY_SHOP,
  },
  {
    id: "mp_03",
    name: "High-waist mom jeans — W28, light wash",
    price: 14000,
    category: "Fashion",
    description:
      "Vintage 90s mom jeans, deadstock condition. Light blue wash, tapered leg. Waist 28, length 30.",
    media: {
      type: "image",
      url: IMG("photo-1582418702059-97ebafb35d09"),
      alt: "Light wash mom jeans",
    },
    shop: MY_SHOP,
  },
  {
    id: "mp_04",
    name: "Pleated mini skirt — black, size S",
    price: 9500,
    category: "Fashion",
    description:
      "Y2K-inspired pleated mini skirt. Black with subtle plaid lining. Size S (UK 8).",
    media: {
      type: "image",
      url: IMG("photo-1577900232427-18219b9166a0"),
      alt: "Pleated mini skirt",
    },
    shop: MY_SHOP,
  },
  {
    id: "mp_05",
    name: "Oversized graphic tee — vintage band, M",
    price: 6500,
    category: "Fashion",
    description:
      "Vintage band tee, washed-out cotton. Oversized fit. Cool for layering or tying at the waist.",
    media: {
      type: "image",
      url: IMG("photo-1521572163474-6864f9cf17ab"),
      alt: "Vintage band tee",
    },
    shop: MY_SHOP,
  },
  {
    id: "mp_06",
    name: "Knee-high boots — brown leather, size 39",
    price: 28500,
    category: "Fashion",
    description:
      "Tan leather knee-high boots, low block heel. Real leather, lightly used, no scuffs. Size 39 EU.",
    media: {
      type: "image",
      url: IMG("photo-1543163521-1bf539c55dd2"),
      alt: "Brown knee-high boots",
    },
    shop: MY_SHOP,
  },
  {
    id: "mp_07",
    name: "Crochet bucket hat — handmade, beige",
    price: 4500,
    category: "Fashion",
    description:
      "Handmade crochet bucket hat in beige cotton. One size, fits most. Perfect for sunny Lagos days.",
    media: {
      type: "image",
      url: IMG("photo-1521369909029-2afed882baee"),
      alt: "Crochet bucket hat",
    },
    shop: MY_SHOP,
  },
  {
    id: "mp_08",
    name: "Layered gold necklace set — 3 pieces",
    price: 7800,
    category: "Accessories",
    description:
      "Set of 3 stackable gold-plated necklaces. Tarnish-resistant. Adjustable chain length.",
    media: {
      type: "image",
      url: IMG("photo-1599643478518-a784e5dc4c8f"),
      alt: "Gold layered necklaces",
    },
    shop: MY_SHOP,
  },
];

const me = {
  id: CURRENT_USER.id,
  name: CURRENT_USER.name,
  handle: sellerHandle,
  verified: true,
};

export const SELLER_CONVERSATIONS: Conversation[] = [
  {
    id: "sc_01",
    buyer: { id: "u_buyer_01", name: "Funmi Adeola", handle: "@funmi.a", verified: false },
    seller: me,
    product: { id: MY_PRODUCTS[0].id, name: MY_PRODUCTS[0].name, price: MY_PRODUCTS[0].price, media: MY_PRODUCTS[0].media },
    lastMessage: "Offer • ₦15,000",
    lastMessageAt: "2026-05-24T09:35:00Z",
    unread: true,
  },
  {
    id: "sc_02",
    buyer: { id: "u_buyer_02", name: "Adaeze Onuoha", handle: "@adaeze.o", verified: false },
    seller: me,
    product: { id: MY_PRODUCTS[1].id, name: MY_PRODUCTS[1].name, price: MY_PRODUCTS[1].price, media: MY_PRODUCTS[1].media },
    lastMessage: "Payment held in escrow • ₦32,000",
    lastMessageAt: "2026-05-23T18:10:00Z",
    unread: true,
  },
  {
    id: "sc_03",
    buyer: { id: "u_buyer_03", name: "Tobi Adeyemi", handle: "@tobi.dev", verified: false },
    seller: me,
    product: { id: MY_PRODUCTS[5].id, name: MY_PRODUCTS[5].name, price: MY_PRODUCTS[5].price, media: MY_PRODUCTS[5].media },
    lastMessage: "Will pick up tomorrow morning. Send the location.",
    lastMessageAt: "2026-05-23T15:00:00Z",
    unread: false,
  },
  {
    id: "sc_04",
    buyer: { id: "u_buyer_04", name: "Kemi Lawal", handle: "@kemi.law", verified: false },
    seller: me,
    product: { id: MY_PRODUCTS[2].id, name: MY_PRODUCTS[2].name, price: MY_PRODUCTS[2].price, media: MY_PRODUCTS[2].media },
    lastMessage: "Delivery confirmed. Funds released.",
    lastMessageAt: "2026-05-21T12:15:00Z",
    unread: false,
  },
];

export const SELLER_MESSAGES: Record<string, Message[]> = {
  sc_01: [
    { id: "sm_01", conversationId: "sc_01", senderId: "u_buyer_01", type: "text", content: "Hi! Is the silk dress still available?", createdAt: "2026-05-24T09:30:00Z" },
    { id: "sm_02", conversationId: "sc_01", senderId: CURRENT_USER.id, type: "text", content: "Yes! ₦18,500. Comes with original tags.", createdAt: "2026-05-24T09:32:00Z" },
    { id: "sm_03", conversationId: "sc_01", senderId: "u_buyer_01", type: "offer", amount: 15000, status: "pending", note: "Cash on pickup in Surulere, can come today", createdAt: "2026-05-24T09:35:00Z" },
  ],
  sc_02: [
    { id: "sm_10", conversationId: "sc_02", senderId: "u_buyer_02", type: "text", content: "Loved the jacket photos. Can you ship to Port Harcourt?", createdAt: "2026-05-23T16:20:00Z" },
    { id: "sm_11", conversationId: "sc_02", senderId: CURRENT_USER.id, type: "text", content: "Yes! GIG to PH is ₦4,000. Total ₦32k.", createdAt: "2026-05-23T16:35:00Z" },
    { id: "sm_12", conversationId: "sc_02", senderId: "u_buyer_02", type: "text", content: "Send the payment request please.", createdAt: "2026-05-23T17:00:00Z" },
    { id: "sm_13", conversationId: "sc_02", senderId: CURRENT_USER.id, type: "payment_request", amount: 32000, status: "paid", note: "Cropped leather jacket + PH dispatch", createdAt: "2026-05-23T17:05:00Z" },
    { id: "sm_14", conversationId: "sc_02", senderId: "system" as string, type: "system", content: "Payment held in escrow. Released to seller on delivery confirmation.", createdAt: "2026-05-23T18:10:00Z" },
  ],
  sc_03: [
    { id: "sm_20", conversationId: "sc_03", senderId: "u_buyer_03", type: "text", content: "Boots still up? Size 39?", createdAt: "2026-05-23T13:00:00Z" },
    { id: "sm_21", conversationId: "sc_03", senderId: CURRENT_USER.id, type: "text", content: "Yes, ₦28,500. Pickup in Yaba?", createdAt: "2026-05-23T13:20:00Z" },
    { id: "sm_22", conversationId: "sc_03", senderId: "u_buyer_03", type: "text", content: "Will pick up tomorrow morning. Send the location.", createdAt: "2026-05-23T15:00:00Z" },
  ],
  sc_04: [
    { id: "sm_30", conversationId: "sc_04", senderId: CURRENT_USER.id, type: "payment_request", amount: 14000, status: "paid", note: "Mom jeans W28", createdAt: "2026-05-20T14:00:00Z" },
    { id: "sm_31", conversationId: "sc_04", senderId: "u_buyer_04", type: "text", content: "Got it! Fit perfectly.", createdAt: "2026-05-21T11:00:00Z" },
    { id: "sm_32", conversationId: "sc_04", senderId: "system" as string, type: "system", content: "Delivery confirmed. Funds released.", createdAt: "2026-05-21T12:15:00Z" },
  ],
};

export const SELLER_TRANSACTIONS: Transaction[] = [
  {
    id: "st_01",
    product: { id: MY_PRODUCTS[1].id, name: MY_PRODUCTS[1].name, media: MY_PRODUCTS[1].media },
    shop: { id: MY_SHOP.id, name: MY_SHOP.name, handle: MY_SHOP.handle },
    amount: 32000,
    platformFee: 1600,
    status: "held",
    createdAt: "2026-05-23T17:05:00Z",
  },
  {
    id: "st_02",
    product: { id: MY_PRODUCTS[2].id, name: MY_PRODUCTS[2].name, media: MY_PRODUCTS[2].media },
    shop: { id: MY_SHOP.id, name: MY_SHOP.name, handle: MY_SHOP.handle },
    amount: 14000,
    platformFee: 700,
    status: "released",
    createdAt: "2026-05-20T14:00:00Z",
  },
  {
    id: "st_03",
    product: { id: MY_PRODUCTS[3].id, name: MY_PRODUCTS[3].name, media: MY_PRODUCTS[3].media },
    shop: { id: MY_SHOP.id, name: MY_SHOP.name, handle: MY_SHOP.handle },
    amount: 9500,
    platformFee: 475,
    status: "released",
    createdAt: "2026-05-18T09:30:00Z",
  },
  {
    id: "st_04",
    product: { id: MY_PRODUCTS[6].id, name: MY_PRODUCTS[6].name, media: MY_PRODUCTS[6].media },
    shop: { id: MY_SHOP.id, name: MY_SHOP.name, handle: MY_SHOP.handle },
    amount: 4500,
    platformFee: 225,
    status: "released",
    createdAt: "2026-05-15T16:20:00Z",
  },
  {
    id: "st_05",
    product: { id: MY_PRODUCTS[7].id, name: MY_PRODUCTS[7].name, media: MY_PRODUCTS[7].media },
    shop: { id: MY_SHOP.id, name: MY_SHOP.name, handle: MY_SHOP.handle },
    amount: 7800,
    platformFee: 390,
    status: "disputed",
    createdAt: "2026-05-10T13:00:00Z",
  },
  {
    id: "st_06",
    product: { id: MY_PRODUCTS[4].id, name: MY_PRODUCTS[4].name, media: MY_PRODUCTS[4].media },
    shop: { id: MY_SHOP.id, name: MY_SHOP.name, handle: MY_SHOP.handle },
    amount: 6500,
    platformFee: 325,
    status: "released",
    createdAt: "2026-05-05T11:45:00Z",
  },
];

export const SELLER_NOTIFICATIONS: Notification[] = [
  {
    id: "sn_01",
    type: "payment_received",
    title: "Payment received • ₦32,000",
    body: "@adaeze.o paid for the cropped leather jacket. Funds held in escrow.",
    read: false,
    createdAt: "2026-05-23T18:10:00Z",
    link: "/seller/transactions",
  },
  {
    id: "sn_02",
    type: "payment_released",
    title: "Payout released • ₦13,300",
    body: "Funds for the mom jeans (less 5% fee) released to your bank.",
    read: true,
    createdAt: "2026-05-21T12:20:00Z",
    link: "/seller/transactions",
  },
  {
    id: "sn_03",
    type: "dispute_opened",
    title: "Dispute opened on gold necklace set",
    body: "@buyer_x raised a dispute. We'll review within 48 hours.",
    read: true,
    createdAt: "2026-05-10T14:00:00Z",
    link: "/seller/transactions",
  },
  {
    id: "sn_04",
    type: "boost_purchased",
    title: "Boost active on the silk slip dress",
    body: "Your boost is live for the next 30 days.",
    read: true,
    createdAt: "2026-05-19T08:00:00Z",
    link: "/seller/products",
  },
  {
    id: "sn_05",
    type: "discover_campaign_started",
    title: "Discover campaign live",
    body: "Your Y2K thrift haul ad just went live to buyers nationwide.",
    read: true,
    createdAt: "2026-05-18T10:00:00Z",
    link: "/seller/ads",
  },
];
