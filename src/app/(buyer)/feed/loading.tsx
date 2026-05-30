import { Skeleton } from "@/components/Skeleton";
import { Typography } from "@/components/Typography";
import { ProductCardSkeleton } from "./_components/ProductCardSkeleton";

export default function FeedLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-1 sm:mb-8">
        <Typography variant="overline" className="text-primary">
          Discover
        </Typography>
        <Typography variant="heading-h1">For you</Typography>
        <Skeleton className="mt-1 h-4 w-3/4 max-w-md" />
      </div>
      <div className="mb-5">
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
