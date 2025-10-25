import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreatorCard } from "@/components/CreatorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import creatorImage1 from "@assets/generated_images/Pakistani_female_creator_headshot_b1688276.png";
import creatorImage2 from "@assets/generated_images/Pakistani_male_creator_headshot_3c6570b2.png";
import creatorImage3 from "@assets/generated_images/Pakistani_trainer_headshot_b66d573d.png";

const mockCreators = [
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
  {
    id: "4",
    name: "Sara Malik",
    title: "Lifestyle Vlogger & Influencer",
    location: "Karachi, Pakistan",
    imageUrl: creatorImage1,
    score: 88,
    verified: true,
    followerCount: 310000,
    tags: ["Lifestyle", "Fashion", "YouTube", "Instagram"],
  },
  {
    id: "5",
    name: "Usman Raza",
    title: "Business Coach & Mentor",
    location: "Lahore, Pakistan",
    imageUrl: creatorImage2,
    score: 91,
    verified: true,
    followerCount: 95000,
    tags: ["Business", "Training", "Coaching", "Events"],
  },
  {
    id: "6",
    name: "Fatima Shah",
    title: "Food Content Creator",
    location: "Islamabad, Pakistan",
    imageUrl: creatorImage1,
    score: 76,
    verified: true,
    followerCount: 180000,
    tags: ["Food", "Cooking", "YouTube", "Instagram"],
  },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [followerRange, setFollowerRange] = useState([0]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const collaborationTypes = [
    "Video Content",
    "Podcasts",
    "Events",
    "Training",
  ];

  const cities = [
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-muted/30 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            <h1 className="font-heading text-3xl font-bold mb-6" data-testid="text-page-title">
              Find Creators
            </h1>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, expertise, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Button
                variant="outline"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {selectedTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    {type}
                    <button
                      onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== type))}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex gap-8">
            <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
              <div className="sticky top-24 space-y-6">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">
                    Collaboration Type
                  </Label>
                  <div className="space-y-3">
                    {collaborationTypes.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={type}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTypes([...selectedTypes, type]);
                            } else {
                              setSelectedTypes(selectedTypes.filter(t => t !== type));
                            }
                          }}
                          data-testid={`checkbox-${type}`}
                        />
                        <label
                          htmlFor={type}
                          className="text-sm cursor-pointer"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-3 block">
                    Location
                  </Label>
                  <div className="space-y-3">
                    {cities.map((city) => (
                      <div key={city} className="flex items-center gap-2">
                        <Checkbox id={city} data-testid={`checkbox-${city}`} />
                        <label
                          htmlFor={city}
                          className="text-sm cursor-pointer"
                        >
                          {city}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-3 block">
                    Follower Range
                  </Label>
                  <Slider
                    value={followerRange}
                    onValueChange={setFollowerRange}
                    max={500000}
                    step={10000}
                    className="mb-2"
                    data-testid="slider-followers"
                  />
                  <div className="text-xs text-muted-foreground">
                    Up to {followerRange[0].toLocaleString()} followers
                  </div>
                </div>

                <Button variant="outline" className="w-full" data-testid="button-clear-filters">
                  Clear All Filters
                </Button>
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {mockCreators.length} creators
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCreators.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    {...creator}
                    onClick={() => console.log(`Clicked creator ${creator.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
