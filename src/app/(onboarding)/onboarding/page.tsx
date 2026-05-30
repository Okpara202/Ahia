import { Suspense } from "react";

import { Typography } from "@/components/Typography";
import { OnboardingForm } from "./_components/OnboardingForm";

export const metadata = {
  title: "Welcome to Ahia",
};

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 text-center">
        <Typography variant="overline" className="text-primary">
          Welcome to Ahia
        </Typography>
        <Typography variant="heading-h1">How will you use Ahia?</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Pick a starting role — you can switch anytime from your profile.
        </Typography>
      </div>
      {/* useSearchParams() inside OnboardingForm bails out of static prerender;
          Suspense lets Next.js prerender the shell and stream the form in. */}
      <Suspense fallback={null}>
        <OnboardingForm />
      </Suspense>
    </div>
  );
}
