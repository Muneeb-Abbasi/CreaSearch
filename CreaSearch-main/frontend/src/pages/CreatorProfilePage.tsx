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
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Handshake, CheckCircle2, ExternalLink } from "lucide-react";
import { profileApi, reviewsApi, collaborationApi, Profile, Review, Collaboration } from "@/lib/api";
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

  // Collaboration state
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [collabsLoading, setCollabsLoading] = useState(false);
  const [showCollabForm, setShowCollabForm] = useState(false);
  const [collabSubmitting, setCollabSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [collabForm, setCollabForm] = useState({
    description: '',
    proof_urls: [''],
    title: '',
    campaign_name: '',
  });

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
        const up = await profileApi.getMyProfile(user.id);
        setUserProfile(up);
        setUserHasApprovedProfile(up?.status === 'approved');
      } catch {
        setUserHasApprovedProfile(false);
      }
    }
    checkUserProfile();
  }, [user?.id]);

  // Fetch collaborations
  useEffect(() => {
    async function fetchCollabs() {
      if (!profile?.id) return;
      setCollabsLoading(true);
      try {
        const data = await collaborationApi.getByProfileId(profile.id);
        setCollaborations(data.filter(c => c.status === 'approved'));
      } catch (err) {
        console.error("Error fetching collaborations:", err);
      } finally {
        setCollabsLoading(false);
      }
    }
    fetchCollabs();
  }, [profile?.id]);

  // Handle new review submission
  const handleReviewSubmitted = (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
    setUserHasReviewed(true);
  };

  // Handle collab submission
  const handleCollabSubmit = async () => {
    if (!profile?.id || !userProfile?.id) return;
    if (!collabForm.description.trim()) return;
    const validProofUrls = collabForm.proof_urls.filter(u => u.trim() !== '');
    if (validProofUrls.length === 0) return;

    setCollabSubmitting(true);
    try {
      await collaborationApi.create({
        requester_profile_id: userProfile.id,
        partner_profile_id: profile.id,
        description: collabForm.description,
        title: collabForm.title || undefined,
        campaign_name: collabForm.campaign_name || undefined,
        proof_urls: validProofUrls,
      });
      setShowCollabForm(false);
      setCollabForm({ description: '', proof_urls: [''], title: '', campaign_name: '' });
    } catch (err) {
      console.error("Error submitting collaboration:", err);
    } finally {
      setCollabSubmitting(false);
    }
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
          verified={(profile.verified_socials?.length || 0) > 0}
          followerCount={profile.follower_total || 0}
          verifiedCollabCount={collaborations.length}
          tags={profile.collaboration_types || []}
          socialLinks={profile.social_links as unknown as { youtube?: string; instagram?: string; facebook?: string; linkedin?: string; twitter?: string } | undefined}
          onInquiryClick={() => setInquiryModalOpen(true)}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start" data-testid="tabs-profile">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="collaborations">
                    Collaborations
                    {collaborations.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">{collaborations.length}</Badge>
                    )}
                  </TabsTrigger>
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


                </TabsContent>


                <TabsContent value="collaborations" className="space-y-6 mt-6">
                  {/* Submit Collab Button - only for other users with approved profiles */}
                  {user && profile?.user_id !== user.id && userHasApprovedProfile && (
                    <Card>
                      <CardContent className="pt-6">
                        {!showCollabForm ? (
                          <div className="text-center">
                            <Handshake className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-3">
                              Worked with {profile.name}? Submit a collaboration for verification.
                            </p>
                            <Button onClick={() => setShowCollabForm(true)} variant="outline">
                              <Handshake className="w-4 h-4 mr-2" />
                              Submit Collaboration
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm">Submit Collaboration with {profile.name}</h4>
                            <div>
                              <label className="text-sm font-medium">Title</label>
                              <input
                                className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                                placeholder="e.g. Product Review Video"
                                value={collabForm.title}
                                onChange={(e) => setCollabForm(prev => ({ ...prev, title: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Campaign / Project Name</label>
                              <input
                                className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                                placeholder="e.g. Summer 2026 Campaign"
                                value={collabForm.campaign_name}
                                onChange={(e) => setCollabForm(prev => ({ ...prev, campaign_name: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Description *</label>
                              <textarea
                                className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                                rows={3}
                                placeholder="Describe your collaboration..."
                                value={collabForm.description}
                                onChange={(e) => setCollabForm(prev => ({ ...prev, description: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Proof Links * (at least one required)</label>
                              {collabForm.proof_urls.map((url, index) => (
                                <div key={index} className="flex gap-2 mt-1">
                                  <input
                                    className="flex-1 border rounded-md p-2 text-sm bg-background"
                                    placeholder="https://..."
                                    value={url}
                                    onChange={(e) => {
                                      const updated = [...collabForm.proof_urls];
                                      updated[index] = e.target.value;
                                      setCollabForm(prev => ({ ...prev, proof_urls: updated }));
                                    }}
                                  />
                                  {collabForm.proof_urls.length > 1 && (
                                    <Button size="sm" variant="ghost" onClick={() => {
                                      setCollabForm(prev => ({
                                        ...prev,
                                        proof_urls: prev.proof_urls.filter((_, i) => i !== index),
                                      }));
                                    }}>✕</Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => setCollabForm(prev => ({ ...prev, proof_urls: [...prev.proof_urls, ''] }))}
                              >
                                + Add Link
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleCollabSubmit} disabled={collabSubmitting || !collabForm.description.trim() || !collabForm.proof_urls.some(u => u.trim())}>
                                {collabSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                                Submit for Review
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowCollabForm(false)}>
                                Cancel
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Your partner will need to confirm, then an admin will review before it counts.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Collaboration History */}
                  {collabsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : collaborations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Handshake className="w-12 h-12 mx-auto mb-4 opacity-40" />
                      <p>No verified collaborations yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {collaborations.map((collab) => (
                        <Card key={collab.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Handshake className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-sm">
                                    {collab.title || collab.description.slice(0, 50)}
                                  </span>
                                  {collab.is_external && (
                                    <Badge variant="outline" className="text-xs">External</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Partner: <strong>
                                    {collab.is_external
                                      ? collab.external_partner_name
                                      : (collab.requester_profile_id === profile?.id ? 'Partner' : profile?.name)}
                                  </strong>
                                  {collab.campaign_name && <> · Campaign: <strong>{collab.campaign_name}</strong></>}
                                  {collab.date_range && <> · {collab.date_range}</>}
                                </p>
                                <p className="text-sm text-muted-foreground">{collab.description}</p>
                                {/* Proof links */}
                                {(collab.proof_urls?.length > 0 || collab.proof_url) && (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {(collab.proof_urls?.length > 0 ? collab.proof_urls : [collab.proof_url]).filter(Boolean).map((url, i) => (
                                      <a key={i} href={url!} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                        Proof {i + 1} ↗
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="default" className="bg-green-500 text-xs">Verified</Badge>
                                {collab.external_partner_url && (
                                  <a href={collab.external_partner_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3 text-blue-500" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
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
                    <span className="text-muted-foreground">Verified Collaborations</span>
                    <span className="font-semibold">{collaborations.length}</span>
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
