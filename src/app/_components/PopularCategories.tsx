import Link from "next/link";
import {
  Book,
  Cookie,
  Laptop,
  Shirt,
  Smartphone,
  Sparkles,
  Wrench,
  PenTool,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";

interface Category {
  name: string;
  icon: LucideIcon;
  slug: string;
  shops: string;
}

const CATEGORIES: Category[] = [
  { name: "Fashion", icon: Shirt, slug: "fashion", shops: "1.2k shops" },
  { name: "Phones", icon: Smartphone, slug: "phones", shops: "640 shops" },
  { name: "Beauty", icon: Sparkles, slug: "beauty", shops: "880 shops" },
  { name: "Snacks", icon: Cookie, slug: "snacks", shops: "420 shops" },
  { name: "Books", icon: Book, slug: "books", shops: "310 shops" },
  { name: "Stationery", icon: PenTool, slug: "stationery", shops: "260 shops" },
  { name: "Electronics", icon: Laptop, slug: "electronics", shops: "510 shops" },
  { name: "Services", icon: Wrench, slug: "services", shops: "190 shops" },
];

export function PopularCategories() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Typography variant="overline" className="text-primary">
              Browse
            </Typography>
            <Typography variant="heading-h2">Popular categories</Typography>
          </div>
          <Link
            href="/search"
            className="hidden text-sm font-medium text-primary underline-offset-4 hover:underline sm:inline"
          >
            See all
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {CATEGORIES.map(({ name, icon: Icon, slug, shops }) => (
            <Link
              key={slug}
              href={`/search?category=${slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <div className="flex flex-col">
                <Typography variant="label-lg">{name}</Typography>
                <Typography
                  variant="caption"
                  className="text-muted-foreground"
                >
                  {shops}
                </Typography>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
