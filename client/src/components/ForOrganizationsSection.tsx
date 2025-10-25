import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Advanced search filters by expertise, location, and audience size",
  "Verified profiles with social proof and credibility scores",
  "Direct messaging and collaboration requests",
  "Transparent pricing and availability information",
];

export function ForOrganizationsSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6" data-testid="text-section-title">
              For Organizations
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Find the perfect creator match for your brand, event, or content project. Save time with our curated marketplace of verified professionals.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" data-testid="button-start-searching">
              Start Searching
            </Button>
          </div>

          <div className="relative">
            <div className="bg-card border border-card-border rounded-lg p-8 space-y-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-muted rounded-md"></div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="h-6 bg-primary/20 rounded w-16"></div>
                  <div className="h-6 bg-primary/20 rounded w-20"></div>
                  <div className="h-6 bg-primary/20 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
