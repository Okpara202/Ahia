import { notFound } from "next/navigation";

import { ProductCard } from "@/components/ProductCard";
import { Typography } from "@/components/Typography";
import { getShop, getShopProducts } from "@/lib/services/shops";
import { getShopStories } from "@/lib/services/stories";
import { ShopHeader } from "./_components/ShopHeader";
import { StoriesStrip } from "./_components/StoriesStrip";

interface ShopPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ShopPageProps) {
  const { id } = await params;
  const shop = await getShop(id);
  if (!shop) return { title: "Shop not found — Ahia" };
  return { title: `${shop.name} — Ahia` };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { id } = await params;
  const [shop, products, stories] = await Promise.all([
    getShop(id),
    getShopProducts(id),
    getShopStories(id),
  ]);

  if (!shop) notFound();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <ShopHeader shop={shop} productCount={products.length} />

      <StoriesStrip
        stories={stories}
        shopName={shop.name}
        sellerId={shop.ownerId}
      />

      <section className="flex flex-col gap-4">
        <Typography variant="heading-h2">All products</Typography>
        {products.length === 0 ? (
          <Typography variant="body-md" className="text-muted-foreground">
            This shop hasn&apos;t listed anything yet.
          </Typography>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
