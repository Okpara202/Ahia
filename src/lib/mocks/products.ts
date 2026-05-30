import type { Product } from "@/types";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p_01",
    name: "Nike Air Force 1 — Size 42, Triple White",
    price: 45000,
    category: "Fashion",
    description:
      "Brand new in box, never worn. Bought from Nike Lagos last month, size doesn't fit my brother. Comes with original receipt and dust bag. Pickup in Lekki or send via dispatch (₦2,500 within Lagos).",
    media: { type: "image", url: IMG("photo-1542291026-7eec264c27ff"), alt: "Nike Air Force 1 sneakers" },
    gallery: [
      { type: "image", url: IMG("photo-1600185365926-3a2ce3cdb9eb"), alt: "AF1 side view" },
      { type: "image", url: IMG("photo-1605408499391-6368c628ef42"), alt: "AF1 sole" },
      { type: "image", url: IMG("photo-1595950653106-6c9ebd614d3a"), alt: "AF1 box" },
    ],
    shop: { id: "s_01", name: "Sneaker Plug UI", handle: "@sneakerplug.ui", verified: true, location: "Ibadan" },
  },
  {
    id: "p_02",
    name: "iPhone 13 — 128GB, Midnight, factory unlocked",
    price: 420000,
    category: "Phones",
    description:
      "9 months old, battery health 92%, no scratches or dents. Factory unlocked, works on all networks. Comes with charger and original box. Face ID and all features working perfectly.",
    media: { type: "image", url: IMG("photo-1592750475338-74b7b21085ab"), alt: "iPhone 13 Midnight" },
    gallery: [
      { type: "image", url: IMG("photo-1632661674596-df8be070a5c5"), alt: "iPhone 13 back" },
      { type: "image", url: IMG("photo-1605236453806-6ff36851218e"), alt: "iPhone 13 in hand" },
    ],
    shop: { id: "s_02", name: "Lagos Phone Co.", handle: "@lagosphone", verified: true, location: "Lagos" },
  },
  {
    id: "p_03",
    name: "Y2K leather shoulder bag — barely used",
    price: 22000,
    category: "Fashion",
    description:
      "Vintage leather shoulder bag, 90s style. Used twice, still in great condition. Real leather, two inner pockets, adjustable strap.",
    media: {
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-with-a-floral-summer-dress-39763-medium.mp4",
      poster: IMG("photo-1548036328-c9fa89d128fa"),
    },
    shop: { id: "s_03", name: "Thrifted by Ada", handle: "@thrifted.ada", verified: false, location: "Lagos" },
  },
  {
    id: "p_04",
    name: "Fenty Beauty Pro Filt'r foundation — shade 380",
    price: 18500,
    category: "Beauty",
    description:
      "Sealed, never opened. Bought as a gift but wrong shade. Original Fenty packaging, full 32ml bottle. Soft matte finish, full coverage.",
    media: { type: "image", url: IMG("photo-1522335789203-aaa0e6a3b06d"), alt: "Foundation bottle" },
    shop: { id: "s_04", name: "Glow by Tomi", handle: "@glowbytomi", verified: true, location: "Lagos" },
  },
  {
    id: "p_05",
    name: "MacBook Air M1 — 256GB, English keyboard",
    price: 680000,
    category: "Electronics",
    description:
      "M1 chip, 8GB RAM, 256GB SSD. Bought from US, perfect condition, 96% battery health. Comes with charger and a clear case. Used mostly for university work.",
    media: { type: "image", url: IMG("photo-1496181133206-80ce9b88a853"), alt: "MacBook Air" },
    gallery: [
      { type: "image", url: IMG("photo-1517336714731-489689fd1ca8"), alt: "MacBook open" },
      { type: "image", url: IMG("photo-1611186871348-b1ce696e52c9"), alt: "MacBook with case" },
    ],
    shop: { id: "s_05", name: "Mac Hub Abuja", handle: "@machubabj", verified: true, location: "Abuja" },
  },
  {
    id: "p_06",
    name: "Ankara two-piece set — size 12",
    price: 15000,
    category: "Fashion",
    description:
      "Custom-made Ankara set: cropped top and matching wide-leg trousers. Size 12 (UK). Made in Lagos by my tailor — quality fabric, clean stitching.",
    media: {
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-modeling-a-summer-floral-dress-41530-medium.mp4",
      poster: IMG("photo-1490481651871-ab68de25d43d"),
    },
    shop: { id: "s_06", name: "Ankara Studio", handle: "@ankarastudio", verified: true, location: "Lagos" },
  },
  {
    id: "p_07",
    name: "Atomic Habits — paperback, like new",
    price: 4500,
    category: "Books",
    description:
      "James Clear's bestseller. Read once, no marks or folds inside. Selling because I'm graduating and downsizing my library.",
    media: { type: "image", url: IMG("photo-1544947950-fa07a98d237f"), alt: "Atomic Habits book" },
    shop: { id: "s_07", name: "Campus Reads", handle: "@campusreads", verified: false, location: "Ibadan" },
  },
  {
    id: "p_08",
    name: "Pringles party pack — 6 cans, assorted",
    price: 7500,
    category: "Snacks",
    description:
      "6 cans of Pringles, mixed flavours (sour cream, paprika, original). All sealed, expiry March 2027. Perfect for hostel movie nights.",
    media: { type: "image", url: IMG("photo-1599629954294-14df9f8291bc"), alt: "Snacks" },
    shop: { id: "s_08", name: "Hostel Snacks", handle: "@hostelsnacks", verified: false, location: "Enugu" },
  },
  {
    id: "p_09",
    name: "Apple AirPods Pro (2nd gen) — sealed",
    price: 195000,
    category: "Electronics",
    description:
      "Brand new, factory sealed AirPods Pro 2. USB-C version. Bought 2 weeks ago, never opened. Has 1-year Apple warranty.",
    media: { type: "image", url: IMG("photo-1606220945770-b5b6c2c55bf1"), alt: "AirPods Pro" },
    shop: { id: "s_02", name: "Lagos Phone Co.", handle: "@lagosphone", verified: true, location: "Lagos" },
  },
  {
    id: "p_10",
    name: "Vintage Levi's 501 — W30 L32, deadstock",
    price: 28000,
    category: "Fashion",
    description:
      "Original Levi's 501 jeans from the 90s, deadstock condition (never washed, original tags still attached). Sourced from a vintage warehouse in the UK.",
    media: {
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-clothes-on-a-rack-in-a-store-4651-medium.mp4",
      poster: IMG("photo-1542272604-787c3835535d"),
    },
    shop: { id: "s_03", name: "Thrifted by Ada", handle: "@thrifted.ada", verified: false, location: "Lagos" },
  },
  {
    id: "p_11",
    name: "Notebook + pen set — back-to-school bundle",
    price: 3200,
    category: "Stationery",
    description:
      "Bundle of 3 A5 hardcover notebooks (120 pages each) + 5 gel pens (blue, black). Perfect for the new semester.",
    media: { type: "image", url: IMG("photo-1531346878377-a5be20888e57"), alt: "Notebook bundle" },
    shop: { id: "s_09", name: "UI Stationery", handle: "@ui.stationery", verified: true, location: "Ibadan" },
  },
  {
    id: "p_12",
    name: "Sony WH-1000XM4 — noise cancelling, black",
    price: 220000,
    category: "Electronics",
    description:
      "Industry-best noise cancelling headphones. 1 year old, excellent condition. Comes with carrying case, original cable, and 3.5mm jack adapter.",
    media: { type: "image", url: IMG("photo-1583394838336-acd977736f90"), alt: "Sony headphones" },
    shop: { id: "s_10", name: "Sound Garage", handle: "@soundgarage", verified: true, location: "Port Harcourt" },
  },
  {
    id: "p_13",
    name: "Cropped denim jacket — Y2K wash, oversized",
    price: 19500,
    category: "Fashion",
    description:
      "Oversized cropped denim with vintage wash. Fits UK 10–14 (oversized fit). Excellent thrifted condition, no rips or stains.",
    media: {
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-a-fashion-model-in-a-blue-and-white-outfit-39767-medium.mp4",
      poster: IMG("photo-1551488831-00ddcb6c6bd3"),
    },
    shop: { id: "s_03", name: "Thrifted by Ada", handle: "@thrifted.ada", verified: false, location: "Lagos" },
  },
  {
    id: "p_14",
    name: "MAC lipstick — Ruby Woo, brand new",
    price: 9500,
    category: "Beauty",
    description:
      "Classic matte red lipstick. Sealed, never used. Bought a duplicate by accident. Long-wearing formula, the most iconic MAC red.",
    media: {
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-doing-makeup-in-the-mirror-39842-medium.mp4",
      poster: IMG("photo-1586495777744-4413f21062fa"),
    },
    shop: { id: "s_04", name: "Glow by Tomi", handle: "@glowbytomi", verified: true, location: "Lagos" },
  },
  {
    id: "p_15",
    name: "Zara dress — size M, only worn once",
    price: 12500,
    category: "Fashion",
    description:
      "Zara midi dress, size M (UK 10). Worn once to a wedding, dry-cleaned afterwards. Selling because I prefer trousers now.",
    media: {
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-woman-trying-on-clothes-in-a-clothing-store-4633-medium.mp4",
      poster: IMG("photo-1572804013309-59a88b7e92f1"),
    },
    shop: { id: "s_11", name: "Closet by Bisi", handle: "@closet.bisi", verified: true, location: "Kano" },
  },
];
