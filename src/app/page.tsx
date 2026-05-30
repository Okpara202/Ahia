import { LandingNav } from "./_components/LandingNav";
import { FoundingBanner } from "./_components/FoundingBanner";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { Comparison } from "./_components/Comparison";
import { ForBuyers } from "./_components/ForBuyers";
import { ForSellers } from "./_components/ForSellers";
import { Testimonials } from "./_components/Testimonials";
import { PopularCategories } from "./_components/PopularCategories";
import { FAQ } from "./_components/FAQ";
import { FinalCTA } from "./_components/FinalCTA";
import { LandingFooter } from "./_components/LandingFooter";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <FoundingBanner />
      <LandingNav />
      <main className="flex flex-1 flex-col">
        <Hero />
        <HowItWorks />
        <Comparison />
        <ForBuyers />
        <ForSellers />
        <Testimonials />
        <PopularCategories />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
