import { Card, CardContent } from "@/components/ui/card";
import { Search, MessageSquare, Handshake } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Browse verified creator profiles with detailed portfolios, ratings, and social proof.",
  },
  {
    icon: MessageSquare,
    title: "Connect",
    description: "Send collaboration requests directly to creators that match your project needs.",
  },
  {
    icon: Handshake,
    title: "Collaborate",
    description: "Work together on video content, podcasts, or events with trusted professionals.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4" data-testid="text-section-title">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to find and collaborate with the perfect creator for your project
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="text-center" data-testid={`card-step-${index}`}>
              <CardContent className="pt-8 pb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
