import { notFound } from "next/navigation";

import { getProduct } from "@/lib/services/products";
import { getProductReviews } from "@/lib/services/reviews";
import { ProductDetails } from "./_components/ProductDetails";
import { ProductMedia } from "./_components/ProductMedia";
import { ProductReviews } from "./_components/ProductReviews";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product not found — Ahia" };
  return {
    title: `${product.name} — Ahia`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, reviewsData] = await Promise.all([
    getProduct(id),
    getProductReviews(id),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-36 sm:px-6 sm:py-10 lg:px-8 lg:py-12 md:pb-12">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <ProductMedia
          media={product.media}
          gallery={product.gallery}
          shop={product.shop}
          name={product.name}
        />
        <ProductDetails
          product={product}
          rating={reviewsData.count > 0 ? reviewsData.average : null}
          reviewCount={reviewsData.count}
        />
      </div>
      <div className="mt-10 lg:mt-12">
        <ProductReviews
          reviews={reviewsData.reviews}
          average={reviewsData.average}
          count={reviewsData.count}
        />
      </div>
    </div>
  );
}
