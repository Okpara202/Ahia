import type { Transaction } from "@/types";
import { MOCK_PRODUCTS } from "./products";

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "t_01",
    product: { id: MOCK_PRODUCTS[0].id, name: MOCK_PRODUCTS[0].name, media: MOCK_PRODUCTS[0].media },
    shop: { id: MOCK_PRODUCTS[0].shop.id, name: MOCK_PRODUCTS[0].shop.name, handle: MOCK_PRODUCTS[0].shop.handle },
    amount: 47500,
    platformFee: 2375,
    status: "held",
    createdAt: "2026-05-23T14:22:00Z",
  },
  {
    id: "t_02",
    product: { id: MOCK_PRODUCTS[2].id, name: MOCK_PRODUCTS[2].name, media: MOCK_PRODUCTS[2].media },
    shop: { id: MOCK_PRODUCTS[2].shop.id, name: MOCK_PRODUCTS[2].shop.name, handle: MOCK_PRODUCTS[2].shop.handle },
    amount: 25000,
    platformFee: 1250,
    status: "held",
    createdAt: "2026-05-22T17:30:00Z",
  },
  {
    id: "t_03",
    product: { id: MOCK_PRODUCTS[5].id, name: MOCK_PRODUCTS[5].name, media: MOCK_PRODUCTS[5].media },
    shop: { id: MOCK_PRODUCTS[5].shop.id, name: MOCK_PRODUCTS[5].shop.name, handle: MOCK_PRODUCTS[5].shop.handle },
    amount: 15000,
    platformFee: 750,
    status: "released",
    createdAt: "2026-05-20T19:30:00Z",
  },
  {
    id: "t_04",
    product: { id: MOCK_PRODUCTS[8].id, name: MOCK_PRODUCTS[8].name, media: MOCK_PRODUCTS[8].media },
    shop: { id: MOCK_PRODUCTS[8].shop.id, name: MOCK_PRODUCTS[8].shop.name, handle: MOCK_PRODUCTS[8].shop.handle },
    amount: 195000,
    platformFee: 9750,
    status: "released",
    createdAt: "2026-05-15T11:10:00Z",
  },
  {
    id: "t_05",
    product: { id: MOCK_PRODUCTS[7].id, name: MOCK_PRODUCTS[7].name, media: MOCK_PRODUCTS[7].media },
    shop: { id: MOCK_PRODUCTS[7].shop.id, name: MOCK_PRODUCTS[7].shop.name, handle: MOCK_PRODUCTS[7].shop.handle },
    amount: 7500,
    platformFee: 375,
    status: "disputed",
    createdAt: "2026-05-12T20:45:00Z",
  },
  {
    id: "t_06",
    product: { id: MOCK_PRODUCTS[3].id, name: MOCK_PRODUCTS[3].name, media: MOCK_PRODUCTS[3].media },
    shop: { id: MOCK_PRODUCTS[3].shop.id, name: MOCK_PRODUCTS[3].shop.name, handle: MOCK_PRODUCTS[3].shop.handle },
    amount: 18500,
    platformFee: 925,
    status: "refunded",
    createdAt: "2026-05-08T14:00:00Z",
  },
];
