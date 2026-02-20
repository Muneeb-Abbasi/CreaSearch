import { useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { FeaturedCreatorsSection } from "@/components/FeaturedCreatorsSection";
import { FeaturedBrandsSection } from "@/components/FeaturedBrandsSection";
import { ForOrganizationsSection } from "@/components/ForOrganizationsSection";
import { ForCreatorsSection } from "@/components/ForCreatorsSection";
import { TrustSection } from "@/components/TrustSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  const [location] = useLocation();

  useEffect(() => {
    // Handle hash navigation on mount or location change
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturedCreatorsSection />
        <FeaturedBrandsSection />
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
