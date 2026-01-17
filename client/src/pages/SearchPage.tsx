import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreatorCard } from "@/components/CreatorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  {
    id: "7",
    name: "Hassan Javed",
    title: "Travel Vlogger & Photographer",
    location: "Karachi, Pakistan",
    imageUrl: creatorImage2,
    score: 82,
    verified: true,
    followerCount: 220000,
    tags: ["Travel", "Photography", "YouTube", "Adventure"],
  },
  {
    id: "8",
    name: "Zara Ahmed",
    title: "Fashion & Beauty Influencer",
    location: "Lahore, Pakistan",
    imageUrl: creatorImage1,
    score: 89,
    verified: true,
    followerCount: 450000,
    tags: ["Fashion", "Beauty", "Instagram", "Lifestyle"],
  },
  {
    id: "9",
    name: "Imran Siddiqui",
    title: "Fitness Coach & Motivator",
    location: "Islamabad, Pakistan",
    imageUrl: creatorImage3,
    score: 84,
    verified: true,
    followerCount: 175000,
    tags: ["Fitness", "Health", "YouTube", "Training"],
  },
  {
    id: "10",
    name: "Mehwish Khan",
    title: "Education Content Creator",
    location: "Karachi, Pakistan",
    imageUrl: creatorImage1,
    score: 90,
    verified: true,
    followerCount: 320000,
    tags: ["Education", "Learning", "YouTube", "Courses"],
  },
  {
    id: "11",
    name: "Ali Haider",
    title: "Gaming & Esports Streamer",
    location: "Lahore, Pakistan",
    imageUrl: creatorImage2,
    score: 77,
    verified: true,
    followerCount: 198000,
    tags: ["Gaming", "Esports", "YouTube", "Streaming"],
  },
  {
    id: "12",
    name: "Nadia Hussain",
    title: "Parenting & Family Blogger",
    location: "Islamabad, Pakistan",
    imageUrl: creatorImage1,
    score: 81,
    verified: true,
    followerCount: 145000,
    tags: ["Parenting", "Family", "Lifestyle", "Instagram"],
  },
  {
    id: "13",
    name: "Kamran Shah",
    title: "Finance & Investment Advisor",
    location: "Karachi, Pakistan",
    imageUrl: creatorImage3,
    score: 93,
    verified: true,
    followerCount: 280000,
    tags: ["Finance", "Investment", "YouTube", "Business"],
  },
  {
    id: "14",
    name: "Sana Tariq",
    title: "Art & Design Creator",
    location: "Lahore, Pakistan",
    imageUrl: creatorImage1,
    score: 75,
    verified: true,
    followerCount: 98000,
    tags: ["Art", "Design", "Instagram", "Creative"],
  },
  {
    id: "15",
    name: "Faisal Malik",
    title: "Tech Reviewer & Unboxer",
    location: "Islamabad, Pakistan",
    imageUrl: creatorImage2,
    score: 86,
    verified: true,
    followerCount: 410000,
    tags: ["Tech", "Reviews", "YouTube", "Gadgets"],
  },
];

export default function SearchPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [followerRange, setFollowerRange] = useState([0]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const creatorsPerPage = 6;

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

  // Filter creators based on search, city, follower count, and collaboration type
  const filteredCreators = mockCreators.filter((creator) => {
    // Search query filter
    if (searchQuery && !creator.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !creator.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // City filter
    if (selectedCities.length > 0 && !selectedCities.some(city => creator.location.includes(city))) {
      return false;
    }

    // Follower range filter (slider value is in K, e.g., 100 = 100K = 100,000)
    if (followerRange[0] > 0 && creator.followerCount < followerRange[0] * 1000) {
      return false;
    }

    // Collaboration type filter
    if (selectedTypes.length > 0 && !selectedTypes.some(type =>
      creator.tags.some(tag => tag.toLowerCase().includes(type.toLowerCase().split(' ')[0]))
    )) {
      return false;
    }

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCreators.length / creatorsPerPage);
  const startIndex = (currentPage - 1) * creatorsPerPage;
  const displayedCreators = filteredCreators.slice(startIndex, startIndex + creatorsPerPage);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

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
                        <Checkbox
                          id={city}
                          checked={selectedCities.includes(city)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCities([...selectedCities, city]);
                            } else {
                              setSelectedCities(selectedCities.filter(c => c !== city));
                            }
                            handleFilterChange();
                          }}
                          data-testid={`checkbox-${city}`}
                        />
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
                    Min Followers
                  </Label>
                  <Slider
                    value={followerRange}
                    onValueChange={(value) => {
                      setFollowerRange(value);
                      handleFilterChange();
                    }}
                    max={500}
                    step={10}
                    className="mb-2"
                    data-testid="slider-followers"
                  />
                  <div className="text-xs text-muted-foreground">
                    {followerRange[0] > 0 ? `${followerRange[0]}K+ followers` : 'Any followers'}
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
                  Showing {startIndex + 1}-{Math.min(startIndex + creatorsPerPage, mockCreators.length)} of {mockCreators.length} creators
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCreators.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    {...creator}
                    onClick={() => navigate(`/creator/${creator.id}`)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
