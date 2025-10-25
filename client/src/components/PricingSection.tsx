import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "For creators getting started",
    features: [
      "Basic profile listing",
      "Limited visibility in search",
      "Receive up to 3 inquiries/month",
      "Basic analytics",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Creator Pro",
    price: "999",
    description: "For professional creators",
    features: [
      "Enhanced profile visibility",
      "Unlimited inquiries",
      "Video introduction hosting",
      "Priority search placement",
      "Advanced analytics",
      "Verification badge",
    ],
    cta: "Upgrade Now",
    highlighted: true,
  },
  {
    name: "Organization",
    price: "2,499",
    description: "For brands and agencies",
    features: [
      "Unlimited creator searches",
      "Advanced filtering options",
      "Direct messaging",
      "Saved creator lists",
      "Team collaboration tools",
      "Priority support",
    ],
    cta: "Start Searching",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4" data-testid="text-section-title">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={plan.highlighted ? "border-primary shadow-lg" : ""}
              data-testid={`card-plan-${index}`}
            >
              <CardHeader className="text-center pb-8">
                <h3 className="font-heading text-2xl font-bold mb-2">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">₨{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  data-testid={`button-plan-${index}`}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
