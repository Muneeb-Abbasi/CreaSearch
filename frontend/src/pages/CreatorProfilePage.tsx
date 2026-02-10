import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileHeader } from "@/components/ProfileHeader";
import { InquiryModal } from "@/components/InquiryModal";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star, Loader2, AlertCircle } from "lucide-react";
import { profileApi, reviewsApi, Profile, Review } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import creatorImage from "@assets/generated_images/Pakistani_female_creator_headshot_b1688276.png";

export default function CreatorProfilePage() {
  const [, params] = useRoute("/creator/:id");
  const { user } = useAuth();
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userHasApprovedProfile, setUserHasApprovedProfile] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!params?.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await profileApi.getById(params.id);
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Profile not found or failed to load");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [params?.id]);

  // Fetch reviews when profile is loaded
  useEffect(() => {
    async function fetchReviews() {
      if (!profile?.id) return;
      setReviewsLoading(true);
      try {
        const data = await reviewsApi.getByProfileId(profile.id);
        setReviews(data);
        // Check if current user already reviewed this profile
        if (user?.id) {
          const hasReviewed = data.some(r => r.reviewer_user_id === user.id);
          setUserHasReviewed(hasReviewed);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();
  }, [profile?.id, user?.id]);

  // Check if current user has an approved profile (can leave reviews)
  useEffect(() => {
    async function checkUserProfile() {
      if (!user?.id) {
        setUserHasApprovedProfile(false);
        return;
      }
      try {
        const userProfile = await profileApi.getMyProfile(user.id);
        setUserHasApprovedProfile(userProfile?.status === 'approved');
      } catch {
        setUserHasApprovedProfile(false);
      }
    }
    checkUserProfile();
  }, [user?.id]);

  // Handle new review submission
  const handleReviewSubmitted = (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
    setUserHasReviewed(true); // Hide form after submission
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">{error || "This creator profile doesn't exist."}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ProfileHeader
          name={profile.name}
          title={profile.title || "Creator"}
          location={profile.location || "Pakistan"}
          avatarUrl={profile.avatar_url || creatorImage}
          score={profile.creasearch_score || 80}
          verified={profile.verified_socials?.length > 0}
          followerCount={profile.follower_total || 0}
          completedGigs={profile.gigs_completed || 0}
          tags={profile.collaboration_types || []}
          socialLinks={profile.social_links as { youtube?: string; instagram?: string; linkedin?: string; twitter?: string } | undefined}
          onInquiryClick={() => setInquiryModalOpen(true)}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start" data-testid="tabs-profile">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About Me</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-foreground leading-relaxed">
                        {profile.bio || "No bio provided yet."}
                      </p>
                    </CardContent>
                  </Card>

                  {profile.video_intro_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Video Introduction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {profile.video_intro_url.includes("youtube") ? (
                          <div className="aspect-video">
                            <iframe
                              className="w-full h-full rounded-md"
                              src={profile.video_intro_url.replace("watch?v=", "embed/")}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                            <a href={profile.video_intro_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Watch Video Introduction
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {profile.collaboration_types?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Collaboration Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {profile.collaboration_types.map((type, index) => (
                            <div key={index} className="p-4 border rounded-md">
                              <h4 className="font-semibold mb-2">{type}</h4>
                              <p className="text-sm text-muted-foreground">
                                Available for {type.toLowerCase()} collaborations
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Social Media</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(profile.social_links).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex"
                            >
                              <Badge variant="secondary" className="capitalize hover:bg-primary hover:text-primary-foreground cursor-pointer">
                                {platform}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="portfolio" className="space-y-6 mt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Portfolio items coming soon...</p>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6 mt-6">
                  {/* Review Form - only for verified users who haven't reviewed yet */}
                  {user && profile?.user_id !== user.id && !userHasReviewed && (
                    <ReviewForm
                      profileId={profile.id}
                      onReviewSubmitted={handleReviewSubmitted}
                      userHasProfile={userHasApprovedProfile}
                    />
                  )}
                  {/* Show message if already reviewed */}
                  {userHasReviewed && (
                    <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground">
                      You have already reviewed this profile.
                    </div>
                  )}

                  {/* Reviews List */}
                  <ReviewList reviews={reviews} isLoading={reviewsLoading} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Available for projects</p>
                      <p className="text-sm text-muted-foreground">Contact for availability</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    {profile.status === 'approved' ? 'Accepting Inquiries' : 'Profile Under Review'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creasearch Score</span>
                    <span className="font-semibold">{profile.creasearch_score || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-semibold">{(profile.follower_total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed Gigs</span>
                    <span className="font-semibold">{profile.gigs_completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profile Completion</span>
                    <span className="font-semibold">{profile.profile_completion || 0}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <InquiryModal
        open={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        creatorName={profile.name}
      />
    </div>
  );
}
