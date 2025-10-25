import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6" data-testid="text-cta-title">
          Ready to Start Collaborating?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of creators and organizations building amazing content together
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" data-testid="button-cta-creator">
            Join as Creator
          </Button>
          <Button size="lg" variant="outline" data-testid="button-cta-organization">
            Find Creators
          </Button>
        </div>
      </div>
    </section>
  );
}
