import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/Pakistani_creators_collaborating_in_studio_908e3a51.png";

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Diverse Pakistani creators collaborating"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-2xl">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6" data-testid="text-hero-title">
            Connect with Pakistan's Top Creators
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl" data-testid="text-hero-subtitle">
            Find verified content creators, speakers, and trainers for your next video project, podcast, or event.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/search">
              <Button
                size="lg"
                variant="default"
                className="text-base bg-primary/90 backdrop-blur-sm border border-primary-border hover:bg-primary"
                data-testid="button-find-creators"
              >
                Find Creators
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/create-profile">
              <Button
                size="lg"
                variant="outline"
                className="text-base bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                data-testid="button-join-creator"
              >
                Join as Creator
              </Button>
            </Link>
            <Link href="/create-brand-profile">
              <Button
                size="lg"
                variant="outline"
                className="text-base bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                data-testid="button-join-brand"
              >
                Join as Brand
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

