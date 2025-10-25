import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle2, Star, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "2,500+",
    label: "Verified Creators",
  },
  {
    icon: CheckCircle2,
    value: "5,000+",
    label: "Successful Collaborations",
  },
  {
    icon: Star,
    value: "4.8/5",
    label: "Average Rating",
  },
  {
    icon: TrendingUp,
    value: "98%",
    label: "Verification Rate",
  },
];

export function TrustSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4" data-testid="text-section-title">
            Trusted by the Best
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join Pakistan's fastest-growing creator collaboration platform
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} data-testid={`card-stat-${index}`}>
              <CardContent className="pt-8 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="font-heading text-3xl font-bold mb-2" data-testid="text-stat-value">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
