import type { Metadata } from "next";

import { EditProductPanel } from "./_components/EditProductPanel";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit product — Ahia Seller" };

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  return <EditProductPanel id={id} />;
}
