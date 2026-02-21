import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { FeaturedCreatorsSection } from "@/components/FeaturedCreatorsSection";
import { ForOrganizationsSection } from "@/components/ForOrganizationsSection";
import { ForCreatorsSection } from "@/components/ForCreatorsSection";
import { TrustSection } from "@/components/TrustSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturedCreatorsSection />
        <ForOrganizationsSection />
        <ForCreatorsSection />
        <TrustSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
