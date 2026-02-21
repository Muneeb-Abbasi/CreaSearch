import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Building2, Globe, Loader2, Filter, X, Briefcase } from "lucide-react";
import { profileApi, categoryApi, type Profile, type Category, type Niche } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { countries, getCountryName } from "@/data/countries-cities";

export default function FindBrandsPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    const [brands, setBrands] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedNiche, setSelectedNiche] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [niches, setNiches] = useState<Niche[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await categoryApi.getAll();
                setCategories(cats);
            } catch {
                // non-critical
            }
        };
        fetchCategories();
    }, []);

    // Fetch niches when category changes
    useEffect(() => {
        const fetchNiches = async () => {
            if (!selectedCategory) {
                setNiches([]);
                setSelectedNiche("");
                return;
            }
            try {
                const n = await categoryApi.getAllNiches(selectedCategory);
                setNiches(n);
            } catch {
                setNiches([]);
            }
        };
        fetchNiches();
    }, [selectedCategory]);

    // Fetch brands
    const fetchBrands = useCallback(async () => {
        setIsLoading(true);
        try {
            const filters: Record<string, any> = {
                profile_type: 'organization',
            };
            if (searchQuery) filters.search = searchQuery;
            if (selectedCountry) filters.country = selectedCountry;
            if (selectedCategory) filters.category_id = selectedCategory;
            if (selectedNiche) filters.niche_id = selectedNiche;

            const results = await profileApi.getAll(filters);
            setBrands(results);
        } catch (error) {
            console.error("Error fetching brands:", error);
            toast({
                title: "Error",
                description: "Failed to load brands",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedCountry, selectedCategory, selectedNiche, toast]);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCountry("");
        setSelectedCategory("");
        setSelectedNiche("");
    };

    const hasActiveFilters = searchQuery || selectedCountry || selectedCategory || selectedNiche;

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="font-heading text-3xl font-bold mb-2">Find Brands</h1>
                        <p className="text-muted-foreground">
                            Discover brands and organizations looking for creators to collaborate with.
                        </p>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="mb-6 space-y-4">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search brands by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className={showFilters ? "bg-primary/10" : ""}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" onClick={clearFilters} size="sm">
                                    <X className="w-4 h-4 mr-1" /> Clear
                                </Button>
                            )}
                        </div>

                        {/* Expandable Filters */}
                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-background">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Country</label>
                                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All countries" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Countries</SelectItem>
                                            {countries.map((c: { code: string; name: string }) => (
                                                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Industry</label>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All industries" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Industries</SelectItem>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Niche</label>
                                    <Select
                                        value={selectedNiche}
                                        onValueChange={setSelectedNiche}
                                        disabled={!selectedCategory}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={selectedCategory ? "Select niche" : "Select industry first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Niches</SelectItem>
                                            {niches.map(n => (
                                                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : brands.length === 0 ? (
                        <div className="text-center py-16">
                            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                            <h3 className="text-lg font-semibold mb-2">No brands found</h3>
                            <p className="text-muted-foreground">
                                {hasActiveFilters
                                    ? "Try adjusting your filters or search query."
                                    : "No brand profiles have been listed yet."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">
                                {brands.length} brand{brands.length !== 1 ? "s" : ""} found
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {brands.map((brand) => (
                                    <Card
                                        key={brand.id}
                                        className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                                        onClick={() => navigate(`/creator/${brand.id}`)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4 mb-4">
                                                <Avatar className="w-16 h-16 rounded-lg">
                                                    <AvatarImage src={brand.avatar_url || undefined} alt={brand.name} />
                                                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg">
                                                        {brand.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                                        {brand.name}
                                                    </h3>
                                                    {brand.title && (
                                                        <p className="text-sm text-muted-foreground">{brand.title}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Industry & Location */}
                                            <div className="space-y-2 mb-4">
                                                {brand.industry && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Briefcase className="w-4 h-4 shrink-0" />
                                                        <span className="truncate">{brand.industry}</span>
                                                        {brand.niche && (
                                                            <Badge variant="secondary" className="text-xs">{brand.niche}</Badge>
                                                        )}
                                                    </div>
                                                )}
                                                {(brand.city || brand.country) && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="w-4 h-4 shrink-0" />
                                                        <span className="truncate">
                                                            {brand.city}{brand.city && brand.country ? ", " : ""}
                                                            {brand.country ? getCountryName(brand.country) : ""}
                                                        </span>
                                                    </div>
                                                )}
                                                {brand.social_links?.website && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Globe className="w-4 h-4 shrink-0" />
                                                        <a
                                                            href={brand.social_links.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:underline truncate"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {brand.social_links.website.replace(/^https?:\/\/(www\.)?/, '')}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bio */}
                                            {brand.bio && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">{brand.bio}</p>
                                            )}

                                            {/* Score */}
                                            {brand.creasearch_score > 0 && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">Creasearch Score</span>
                                                        <Badge variant={brand.creasearch_score >= 70 ? "default" : "secondary"}>
                                                            {brand.creasearch_score}/100
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
