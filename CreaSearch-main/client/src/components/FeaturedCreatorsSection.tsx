import { Link, useLocation } from "wouter";
import { CreatorCard } from "./CreatorCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import creatorImage1 from "@assets/generated_images/Pakistani_female_creator_headshot_b1688276.png";
import creatorImage2 from "@assets/generated_images/Pakistani_male_creator_headshot_3c6570b2.png";
import creatorImage3 from "@assets/generated_images/Pakistani_trainer_headshot_b66d573d.png";

const featuredCreators = [
  {
    id: "1",
    name: "Ayesha Khan",
    title: "Tech Content Creator & Speaker",
    location: "Karachi, Pakistan",
    imageUrl: creatorImage1,
    score: 85,
    verified: true,
    followerCount: 125000,
    tags: ["Tech", "Education", "YouTube", "Podcasts"],
  },
  {
    id: "2",
    name: "Ahmed Ali",
    title: "Podcast Host & Event MC",
    location: "Lahore, Pakistan",
    imageUrl: creatorImage2,
    score: 92,
    verified: true,
    followerCount: 280000,
    tags: ["Podcasts", "Events", "Business", "Entertainment"],
  },
  {
    id: "3",
    name: "Bilal Hassan",
    title: "Corporate Trainer & Speaker",
    location: "Islamabad, Pakistan",
    imageUrl: creatorImage3,
    score: 78,
    verified: true,
    followerCount: 85000,
    tags: ["Training", "Leadership", "Events", "Corporate"],
  },
];

export function FeaturedCreatorsSection() {
  const [, navigate] = useLocation();

  return (
    <section className="w-full py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4" data-testid="text-section-title">
              Featured Creators
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover top-rated creators ready to collaborate
            </p>
          </div>
          <Link href="/search">
            <Button variant="ghost" className="hidden md:flex" data-testid="button-view-all">
              View All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCreators.map((creator) => (
            <CreatorCard
              key={creator.id}
              {...creator}
              onClick={() => navigate(`/creator/${creator.id}`)}
            />
          ))}
        </div>

        <div className="flex justify-center mt-12 md:hidden">
          <Link href="/search">
            <Button variant="ghost" data-testid="button-view-all-mobile">
              View All Creators
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

