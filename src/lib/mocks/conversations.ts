import type { Conversation, Message } from "@/types";
import { MOCK_PRODUCTS } from "./products";
import { CURRENT_USER } from "./user";

const SELLER_01 = MOCK_PRODUCTS[0].shop;
const SELLER_02 = MOCK_PRODUCTS[1].shop;
const SELLER_03 = MOCK_PRODUCTS[2].shop;
const SELLER_05 = MOCK_PRODUCTS[4].shop;
const SELLER_06 = MOCK_PRODUCTS[5].shop;

const buyerSelf = {
  id: CURRENT_USER.id,
  name: CURRENT_USER.name,
  handle: "@chidera",
  verified: false,
};

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c_01",
    buyer: buyerSelf,
    seller: {
      id: SELLER_01.id,
      name: SELLER_01.name,
      handle: SELLER_01.handle,
      verified: SELLER_01.verified,
    },
    product: {
      id: MOCK_PRODUCTS[0].id,
      name: MOCK_PRODUCTS[0].name,
      price: MOCK_PRODUCTS[0].price,
      media: MOCK_PRODUCTS[0].media,
    },
    lastMessage: "Payment held in escrow • ₦45,000",
    lastMessageAt: "2026-05-23T14:22:00Z",
    unread: true,
  },
  {
    id: "c_02",
    buyer: buyerSelf,
    seller: {
      id: SELLER_02.id,
      name: SELLER_02.name,
      handle: SELLER_02.handle,
      verified: SELLER_02.verified,
    },
    product: {
      id: MOCK_PRODUCTS[1].id,
      name: MOCK_PRODUCTS[1].name,
      price: MOCK_PRODUCTS[1].price,
      media: MOCK_PRODUCTS[1].media,
    },
    lastMessage: "Can you do ₦400k? Cash on pickup in Lekki.",
    lastMessageAt: "2026-05-23T11:08:00Z",
    unread: false,
  },
  {
    id: "c_03",
    buyer: buyerSelf,
    seller: {
      id: SELLER_03.id,
      name: SELLER_03.name,
      handle: SELLER_03.handle,
      verified: SELLER_03.verified,
    },
    product: {
      id: MOCK_PRODUCTS[2].id,
      name: MOCK_PRODUCTS[2].name,
      price: MOCK_PRODUCTS[2].price,
      media: MOCK_PRODUCTS[2].media,
    },
    lastMessage: "Sent! Let me know when it arrives 🙏",
    lastMessageAt: "2026-05-22T17:45:00Z",
    unread: false,
  },
  {
    id: "c_04",
    buyer: buyerSelf,
    seller: {
      id: SELLER_05.id,
      name: SELLER_05.name,
      handle: SELLER_05.handle,
      verified: SELLER_05.verified,
    },
    product: {
      id: MOCK_PRODUCTS[4].id,
      name: MOCK_PRODUCTS[4].name,
      price: MOCK_PRODUCTS[4].price,
      media: MOCK_PRODUCTS[4].media,
    },
    lastMessage: "Battery health is 96%, sending you a screenshot now.",
    lastMessageAt: "2026-05-21T09:12:00Z",
    unread: true,
  },
  {
    id: "c_05",
    buyer: buyerSelf,
    seller: {
      id: SELLER_06.id,
      name: SELLER_06.name,
      handle: SELLER_06.handle,
      verified: SELLER_06.verified,
    },
    product: {
      id: MOCK_PRODUCTS[5].id,
      name: MOCK_PRODUCTS[5].name,
      price: MOCK_PRODUCTS[5].price,
      media: MOCK_PRODUCTS[5].media,
    },
    lastMessage: "Delivery confirmed. Funds released to seller.",
    lastMessageAt: "2026-05-20T19:30:00Z",
    unread: false,
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  c_01: [
    { id: "m_01", conversationId: "c_01", senderId: "u_me", type: "text", content: "Hey! Is the Nike AF1 still available?", createdAt: "2026-05-23T13:40:00Z" },
    { id: "m_02", conversationId: "c_01", senderId: SELLER_01.id, type: "text", content: "Yes, brand new, size 42. ₦45k.", createdAt: "2026-05-23T13:42:00Z" },
    { id: "m_03", conversationId: "c_01", senderId: "u_me", type: "text", content: "Can you deliver to Yaba?", createdAt: "2026-05-23T13:44:00Z" },
    { id: "m_04", conversationId: "c_01", senderId: SELLER_01.id, type: "text", content: "Yes, ₦2,500 dispatch. Total ₦47,500.", createdAt: "2026-05-23T13:45:00Z" },
    { id: "m_05", conversationId: "c_01", senderId: "u_me", type: "text", content: "Deal. Send the payment request.", createdAt: "2026-05-23T13:50:00Z" },
    { id: "m_06", conversationId: "c_01", senderId: SELLER_01.id, type: "payment_request",amount: 47500, status: "paid", note: "Nike AF1 size 42 + dispatch to Yaba", createdAt: "2026-05-23T13:52:00Z" },
    { id: "m_07", conversationId: "c_01", senderId: "u_me", type: "system", content: "Payment held in escrow. Released to seller on delivery confirmation.", createdAt: "2026-05-23T14:22:00Z" },
  ],
  c_02: [
    { id: "m_10", conversationId: "c_02", senderId: "u_me", type: "text", content: "Hi, is the iPhone 13 still up? Looking to buy ASAP.", createdAt: "2026-05-23T10:30:00Z" },
    { id: "m_11", conversationId: "c_02", senderId: SELLER_02.id, type: "text", content: "Yes, midnight 128GB. ₦420k.", createdAt: "2026-05-23T10:35:00Z" },
    { id: "m_12", conversationId: "c_02", senderId: "u_me", type: "text", content: "Can you do ₦400k? Cash on pickup in Lekki.", createdAt: "2026-05-23T11:08:00Z" },
  ],
  c_03: [
    { id: "m_20", conversationId: "c_03", senderId: "u_me", type: "text", content: "The bag — can you ship to Abuja?", createdAt: "2026-05-22T16:00:00Z" },
    { id: "m_21", conversationId: "c_03", senderId: SELLER_03.id, type: "text", content: "Yes! GIG dispatch, ₦3,000.", createdAt: "2026-05-22T16:30:00Z" },
    { id: "m_22", conversationId: "c_03", senderId: SELLER_03.id, type: "payment_request", amount: 25000, status: "paid", note: "Y2K bag + Abuja dispatch", createdAt: "2026-05-22T17:00:00Z" },
    { id: "m_23", conversationId: "c_03", senderId: "u_me", type: "text", content: "Sent! Let me know when it arrives 🙏", createdAt: "2026-05-22T17:45:00Z" },
  ],
  c_04: [
    { id: "m_30", conversationId: "c_04", senderId: "u_me", type: "text", content: "Hi, considering the MacBook Air. What's the battery health?", createdAt: "2026-05-21T08:50:00Z" },
    { id: "m_31", conversationId: "c_04", senderId: SELLER_05.id, type: "text", content: "Battery health is 96%, sending you a screenshot now.", createdAt: "2026-05-21T09:12:00Z" },
    { id: "m_32", conversationId: "c_04", senderId: SELLER_05.id, type: "image", url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80", caption: "Battery condition: Normal, 96% max capacity", createdAt: "2026-05-21T09:13:00Z" },
  ],
  c_05: [
    { id: "m_40", conversationId: "c_05", senderId: "u_me", type: "text", content: "Loved the fit! Got it today.", createdAt: "2026-05-20T18:00:00Z" },
    { id: "m_41", conversationId: "c_05", senderId: "u_me", type: "system", content: "Delivery confirmed. Funds released to seller.", createdAt: "2026-05-20T19:30:00Z" },
    { id: "m_42", conversationId: "c_05", senderId: SELLER_06.id, type: "text", content: "Thank you! 5 stars 🙏", createdAt: "2026-05-20T19:35:00Z" },
  ],
};
