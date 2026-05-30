import { Skeleton } from "@/components/Skeleton";

export default function ProductLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-36 sm:px-6 sm:py-10 lg:px-8 lg:py-12 md:pb-12">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="hidden flex-col gap-3 pt-2 md:flex">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
