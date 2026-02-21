import { Link, useLocation } from "wouter";
import { CreatorCard } from "./CreatorCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { featuredProfileApi, profileApi, type Profile } from "@/lib/api";

// Fallback images for profiles without avatars
import creatorImage1 from "@assets/generated_images/Pakistani_female_creator_headshot_b1688276.png";
import creatorImage2 from "@assets/generated_images/Pakistani_male_creator_headshot_3c6570b2.png";
import creatorImage3 from "@assets/generated_images/Pakistani_trainer_headshot_b66d573d.png";

const FALLBACK_IMAGES = [creatorImage1, creatorImage2, creatorImage3];

// Hardcoded fallback for when no featured profiles exist in DB
const FALLBACK_CREATORS = [
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

interface CreatorData {
  id: string;
  name: string;
  title: string;
  location: string;
  imageUrl: string;
  score: number;
  verified: boolean;
  followerCount: number;
  tags: string[];
}

export function FeaturedCreatorsSection() {
  const [, navigate] = useLocation();
  const [creators, setCreators] = useState<CreatorData[]>(FALLBACK_CREATORS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const featured = await featuredProfileApi.getAll('creator');

        if (featured.length === 0) {
          setCreators(FALLBACK_CREATORS);
          setIsLoading(false);
          return;
        }

        // Fetch full profile data for each featured profile
        const profilePromises = featured.slice(0, 6).map(async (fp, index) => {
          try {
            const profile = await profileApi.getById(fp.profile_id);
            return {
              id: profile.id,
              name: profile.name,
              title: profile.title || "Creator",
              location: profile.location || "Pakistan",
              imageUrl: profile.avatar_url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
              score: profile.creasearch_score || 0,
              verified: profile.status === "approved",
              followerCount: profile.follower_total || 0,
              tags: profile.collaboration_types || [],
            } as CreatorData;
          } catch {
            return null;
          }
        });

        const results = await Promise.all(profilePromises);
        const validCreators = results.filter((c): c is CreatorData => c !== null);

        setCreators(validCreators.length > 0 ? validCreators : FALLBACK_CREATORS);
      } catch {
        // Fall back to hardcoded on any error
        setCreators(FALLBACK_CREATORS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeatured();
  }, []);

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

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                {...creator}
                onClick={() => navigate(`/creator/${creator.id}`)}
              />
            ))}
          </div>
        )}

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
