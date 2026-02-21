import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import creatorProfileImage from "@assets/generated_images/creator_profile_mockup.png";

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
            <img
              src={creatorProfileImage}
              alt="Creator profile preview"
              className="w-full max-w-md mx-auto rounded-lg shadow-xl"
            />
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
            <Link href="/login">
              <Button size="lg" data-testid="button-create-profile">
                Create Your Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

