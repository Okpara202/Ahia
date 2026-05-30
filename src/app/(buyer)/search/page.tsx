import { Suspense } from "react";

import { Typography } from "@/components/Typography";
import { SearchResults } from "./_components/SearchResults";

export const metadata = { title: "Search — Ahia" };

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex flex-col gap-1">
        <Typography variant="overline" className="text-primary">
          Find
        </Typography>
        <Typography variant="heading-h1">Search</Typography>
      </div>
      <Suspense fallback={null}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
