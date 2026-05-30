import { Typography } from "@/components/Typography";
import { FeedGrid } from "./_components/FeedGrid";

export const metadata = {
  title: "Feed — Ahia",
};

export default function FeedPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-1 sm:mb-8">
        <Typography variant="overline" className="text-primary">
          Discover
        </Typography>
        <Typography variant="heading-h1">For you</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Real shops, real chat, protected payments. Tap any product to start a
          conversation.
        </Typography>
      </div>
      <FeedGrid />
    </div>
  );
}
