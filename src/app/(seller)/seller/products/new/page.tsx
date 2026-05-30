import { Typography } from "@/components/Typography";
import { ProductForm } from "../_components/ProductForm";

export const metadata = { title: "New product — Ahia Seller" };

export default function NewProductPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-1">
        <Typography variant="heading-h1">Add product</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Fill in the details — you can edit anything later.
        </Typography>
      </header>
      <ProductForm mode="create" />
    </div>
  );
}
