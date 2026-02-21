import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, Building2, MapPin, Globe, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { profileApi, type Profile } from "@/lib/api";

interface BrandData {
    id: string;
    name: string;
    industry: string;
    location: string;
    imageUrl: string | null;
    bio: string | null;
    companySize: string | null;
    website: string | null;
    score: number;
}

function BrandCard({ brand, onClick }: { brand: BrandData; onClick: () => void }) {
    return (
        <Card
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden border">
                        {brand.imageUrl ? (
                            <img src={brand.imageUrl} alt={brand.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <Building2 className="w-7 h-7 text-primary" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {brand.name}
                        </h3>
                        {brand.industry && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                                {brand.industry}
                            </Badge>
                        )}
                    </div>
                </div>

                {brand.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {brand.bio}
                    </p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {brand.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {brand.location}
                        </span>
                    )}
                    {brand.companySize && (
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {brand.companySize}
                        </span>
                    )}
                    {brand.website && (
                        <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Website
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function FeaturedBrandsSection() {
    const [, navigate] = useLocation();
    const [brands, setBrands] = useState<BrandData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchBrands() {
            try {
                // Fetch approved organization profiles
                const profiles = await profileApi.getAll({ profile_type: 'organization' });

                if (profiles && profiles.length > 0) {
                    const brandList = profiles.slice(0, 6).map((profile: Profile) => ({
                        id: profile.id,
                        name: profile.name,
                        industry: profile.industry || profile.niche || "",
                        location: [profile.city, profile.country].filter(Boolean).join(", "),
                        imageUrl: profile.avatar_url || null,
                        bio: profile.bio || null,
                        companySize: profile.title || null,
                        website: profile.social_links?.website || null,
                        score: profile.creasearch_score || 0,
                    }));
                    setBrands(brandList);
                }
            } catch {
                // Silently fail - section just won't display
                setBrands([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchBrands();
    }, []);

    // Don't render section if no brands exist
    if (!isLoading && brands.length === 0) {
        return null;
    }

    return (
        <section className="w-full py-16 md:py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4" data-testid="text-featured-brands-title">
                            Featured Brands
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Connect with top brands looking for creators to collaborate with
                        </p>
                    </div>
                    <Link href="/brands">
                        <Button variant="ghost" className="hidden md:flex" data-testid="button-view-all-brands">
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
                        {brands.map((brand) => (
                            <BrandCard
                                key={brand.id}
                                brand={brand}
                                onClick={() => navigate(`/creator/${brand.id}`)}
                            />
                        ))}
                    </div>
                )}

                <div className="flex justify-center mt-12 md:hidden">
                    <Link href="/brands">
                        <Button variant="ghost" data-testid="button-view-all-brands-mobile">
                            View All Brands
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
