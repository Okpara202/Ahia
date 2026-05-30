import { Skeleton } from "@/components/Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
