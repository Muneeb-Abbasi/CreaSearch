import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Build a professional profile with video introduction and portfolio",
  "Get discovered by brands and organizations seeking talent",
  "Increase your credibility with our Creasearch Score system",
  "Connect your social media for automatic follower verification",
];

export function ForCreatorsSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="bg-card border border-card-border rounded-lg p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
              <div className="aspect-video bg-muted rounded-md"></div>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
                <div className="h-3 bg-muted rounded w-4/6"></div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6" data-testid="text-section-title">
              For Creators
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Showcase your talent, grow your brand, and get hired for exciting collaboration opportunities. Build trust with verified credentials.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" data-testid="button-create-profile">
              Create Your Profile
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
