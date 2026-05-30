import { PreferencesSection } from "@/components/PreferencesSection";
import { Typography } from "@/components/Typography";

export const metadata = { title: "Settings — Ahia Seller" };

export default function SellerSettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col gap-1">
        <Typography variant="heading-h1">Settings</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Tweak app behaviour. Account changes live on your{" "}
          <span className="font-medium text-foreground">Profile</span>.
        </Typography>
      </div>

      <PreferencesSection />
    </div>
  );
}
