import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CountrySelect } from "@/components/ui/country-select";
import { CitySelect } from "@/components/ui/city-select";
import { Upload, CheckCircle2, Loader2, Clock, XCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, uploadApi, Profile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getCountryName } from "@/data/countries-cities";
import {
  validateName,
  validateIndustry,
  validateNiche,
  validatePhone,
  validateCountry,
  validateCity,
  validateInstagramUrl,
  validateYouTubeUrl,
  validateLinkedInUrl,
  validateTwitterUrl,
  ValidationResult
} from "@/utils/validation";

export default function ProfileCreationPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    industry: "",
    niche: "",
    city: "",
    country: "",
    phone: "",
    bio: "",
    followerCount: "",
    collaborationTypes: [] as string[],
    videoIntroUrl: "",
    youtube: "",
    instagram: "",
    linkedin: "",
    twitter: "",
    agreedToTerms: false,
  });

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    "Basic Info",
    "Media Upload",
    "Social Links",
    "Review & Submit"
  ];

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Check for existing profile
  const checkExistingProfile = async () => {
    if (user?.id) {
      setIsLoadingProfile(true);
      try {
        const profile = await profileApi.getMyProfile(user.id);
        setExistingProfile(profile);
      } catch (error) {
        // Profile not found (was deleted)
        setExistingProfile(null);
      }
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      checkExistingProfile();
    }
  }, [user, authLoading]);

  // Re-fetch profile when page becomes visible (fixes stale cache after admin delete)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        checkExistingProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Prefill name from Google profile
  useEffect(() => {
    if (user?.user_metadata?.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: user.user_metadata.name }));
    }
  }, [user]);

  const handleCollaborationTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        collaborationTypes: [...prev.collaborationTypes, type]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        collaborationTypes: prev.collaborationTypes.filter(t => t !== type)
      }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.agreedToTerms) {
      toast({
        title: "Please agree to terms",
        description: "You must agree to the Terms of Service and Privacy Policy",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const socialLinks: Record<string, any> = {};
      if (formData.youtube) socialLinks.youtube = { url: formData.youtube, status: 'PENDING' };
      if (formData.instagram) socialLinks.instagram = { url: formData.instagram, status: 'PENDING' };
      if (formData.linkedin) socialLinks.linkedin = formData.linkedin;
      if (formData.twitter) socialLinks.twitter = formData.twitter;

      // Upload photo first if selected
      let avatarUrl: string | null = null;
      if (photoFile && user?.id) {
        setIsUploadingPhoto(true);
        try {
          const uploadResult = await uploadApi.uploadPhoto(user.id, photoFile);
          avatarUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Photo upload failed:", uploadError);
          toast({
            title: "Photo upload failed",
            description: "Profile will be created without photo. You can add it later.",
            variant: "destructive"
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      const createdProfile = await profileApi.create({
        user_id: user?.id,
        name: formData.name,
        title: formData.title,
        industry: formData.industry,
        niche: formData.niche,
        city: formData.city,
        country: formData.country,
        phone: formData.phone,
        location: `${formData.city}, ${getCountryName(formData.country)}`, // Backward compatibility
        bio: formData.bio,
        avatar_url: avatarUrl,
        follower_total: formData.followerCount ? parseInt(formData.followerCount) : 0,
        collaboration_types: formData.collaborationTypes,
        video_intro_url: formData.videoIntroUrl || null,
        social_links: socialLinks,
        role: 'creator',
        status: 'pending',
        profile_completion: calculateCompletion(),
      });

      // Verify YouTube channel immediately if provided
      if (formData.youtube && createdProfile.id) {
        try {
          const { verificationApi } = await import("@/lib/api");
          const ytResult = await verificationApi.verifyYouTube(formData.youtube, createdProfile.id);

          if (ytResult.success) {
            toast({
              title: "YouTube Verified!",
              description: `Channel: ${ytResult.channelTitle} • ${ytResult.subscribers?.toLocaleString()} subscribers`,
            });
          } else if (ytResult.status === 'HIDDEN') {
            toast({
              title: "YouTube Subscriber Count Hidden",
              description: "Your channel was found but subscriber count is hidden.",
              variant: "destructive"
            });
          }
        } catch (ytError) {
          console.error("YouTube verification failed:", ytError);
          // Don't block profile creation for verification failure
        }
      }

      // Queue Instagram verification if provided (background processing)
      if (formData.instagram && createdProfile.id) {
        try {
          const { verificationApi } = await import("@/lib/api");
          await verificationApi.verifyInstagram(formData.instagram, createdProfile.id);
          toast({
            title: "Instagram Queued",
            description: "Your Instagram will be verified within 24 hours.",
          });
        } catch (igError) {
          console.error("Instagram queue failed:", igError);
          // Don't block profile creation
        }
      }

      toast({
        title: "Profile submitted!",
        description: "Your profile is pending review. We'll notify you once approved.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateCompletion = () => {
    let score = 0;
    if (formData.name) score += 10;
    if (formData.title) score += 10;
    if (formData.industry) score += 10;
    if (formData.niche) score += 10;
    if (formData.country && formData.city) score += 10;
    if (formData.phone) score += 10;
    if (formData.bio) score += 15;
    if (formData.collaborationTypes.length > 0) score += 10;
    if (formData.youtube || formData.instagram || formData.linkedin || formData.twitter) score += 15;
    return score;
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Profile exists - show appropriate status page
  if (existingProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-16">
            <Card className="text-center">
              <CardHeader>
                {existingProfile.status === 'pending' && (
                  <>
                    <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                    <CardTitle className="text-2xl">Profile Under Review</CardTitle>
                  </>
                )}
                {existingProfile.status === 'approved' && (
                  <>
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <CardTitle className="text-2xl">Profile Approved!</CardTitle>
                  </>
                )}
                {existingProfile.status === 'rejected' && (
                  <>
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <CardTitle className="text-2xl">Profile Needs Updates</CardTitle>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {existingProfile.status === 'pending' && (
                  <>
                    <p className="text-muted-foreground">
                      Your creator profile is currently being reviewed by our team.
                      You'll receive a notification once it's approved.
                    </p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Profile: {existingProfile.name}</p>
                      <p className="text-xs text-muted-foreground">Submitted on {new Date(existingProfile.created_at).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
                {existingProfile.status === 'approved' && (
                  <>
                    <p className="text-muted-foreground">
                      Congratulations! Your profile is now live and visible to organizations.
                    </p>
                    <Button onClick={() => navigate(`/creator/${existingProfile.id}`)}>
                      View My Profile
                    </Button>
                  </>
                )}
                {existingProfile.status === 'rejected' && (
                  <>
                    <p className="text-muted-foreground">
                      Your profile wasn't approved. Please update your information and resubmit.
                    </p>
                    <Button onClick={() => {
                      // Pre-fill form with existing data for editing
                      setFormData({
                        name: existingProfile.name,
                        title: existingProfile.title || "",
                        industry: existingProfile.industry || "",
                        niche: existingProfile.niche || "",
                        city: existingProfile.city || "",
                        country: existingProfile.country || "",
                        phone: existingProfile.phone || "",
                        bio: existingProfile.bio || "",
                        followerCount: existingProfile.follower_total?.toString() || "",
                        collaborationTypes: existingProfile.collaboration_types || [],
                        videoIntroUrl: existingProfile.video_intro_url || "",
                        youtube: existingProfile.social_links?.youtube || "",
                        instagram: existingProfile.social_links?.instagram || "",
                        linkedin: existingProfile.social_links?.linkedin || "",
                        twitter: existingProfile.social_links?.twitter || "",
                        agreedToTerms: false,
                      });
                      setExistingProfile(null); // Clear to show form
                    }}>
                      Edit Profile
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => navigate("/")}>
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold mb-4" data-testid="text-page-title">
              Create Your Creator Profile
            </h1>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Step {currentStep} of {totalSteps}</span>
                <span className="font-medium">{progress}% Complete</span>
              </div>
              <Progress value={progress} data-testid="progress-profile" />
            </div>
            <div className="flex gap-2 mt-4">
              {steps.map((step, index) => (
                <Badge
                  key={index}
                  variant={currentStep > index + 1 ? "default" : currentStep === index + 1 ? "default" : "secondary"}
                  className="flex-1 justify-center"
                >
                  {currentStep > index + 1 && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {step}
                </Badge>
              ))}
            </div>
          </div>

          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name *</Label>
                    <Input
                      id="full-name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Tech Content Creator"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      data-testid="input-title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Technology, Fashion, Gaming"
                      value={formData.industry}
                      onChange={(e) => {
                        setFormData({ ...formData, industry: e.target.value });
                        const result = validateIndustry(e.target.value);
                        setErrors(prev => ({ ...prev, industry: result.error || '' }));
                      }}
                      data-testid="input-industry"
                    />
                    {errors.industry && <p className="text-xs text-red-500">{errors.industry}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="niche">Niche/Specialization *</Label>
                    <Input
                      id="niche"
                      placeholder="e.g., Tech Reviews, Lifestyle Vlogs"
                      value={formData.niche}
                      onChange={(e) => {
                        setFormData({ ...formData, niche: e.target.value });
                        const result = validateNiche(e.target.value);
                        setErrors(prev => ({ ...prev, niche: result.error || '' }));
                      }}
                      data-testid="input-niche"
                    />
                    {errors.niche && <p className="text-xs text-red-500">{errors.niche}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <CountrySelect
                      value={formData.country}
                      onValueChange={(value) => {
                        setFormData({ ...formData, country: value, city: '' });
                        const result = validateCountry(value);
                        setErrors(prev => ({ ...prev, country: result.error || '', city: '' }));
                      }}
                      placeholder="Select country..."
                    />
                    {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <CitySelect
                      value={formData.city}
                      countryCode={formData.country}
                      onValueChange={(value) => {
                        setFormData({ ...formData, city: value });
                        const result = validateCity(value, formData.country);
                        setErrors(prev => ({ ...prev, city: result.error || '' }));
                      }}
                      placeholder="Select city..."
                      disabled={!formData.country}
                    />
                    {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      const result = validatePhone(e.target.value);
                      setErrors(prev => ({ ...prev, phone: result.error || '' }));
                    }}
                    data-testid="input-phone"
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  <p className="text-xs text-muted-foreground">Include country code (e.g., +92 for Pakistan)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followerCount">Total Followers/Subscribers</Label>
                  <Input
                    id="followerCount"
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.followerCount}
                    onChange={(e) => setFormData({ ...formData, followerCount: e.target.value })}
                    data-testid="input-follower-count"
                  />
                  <p className="text-xs text-muted-foreground">Combined followers across all your platforms</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About You *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your experience and what makes you unique..."
                    rows={6}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    data-testid="textarea-bio"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Collaboration Types *</Label>
                  <div className="space-y-3">
                    {["Video Content", "Podcasts", "Events/Speaking", "Training Sessions"].map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={type}
                          checked={formData.collaborationTypes.includes(type)}
                          onCheckedChange={(checked) => handleCollaborationTypeChange(type, checked as boolean)}
                          data-testid={`checkbox-${type}`}
                        />
                        <label htmlFor={type} className="text-sm cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Media Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a clear, face-visible photo for verification
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                    data-testid="input-photo"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="border-2 border-dashed rounded-md p-8 text-center hover:bg-muted/50 cursor-pointer block transition-colors"
                  >
                    {photoPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-32 h-32 rounded-full object-cover mb-3"
                        />
                        <p className="text-sm font-medium text-green-600">Photo selected!</p>
                        <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Video Introduction (30-50 seconds)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Introduce yourself and your work in a short video
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Paste a YouTube/Vimeo link:
                  </p>
                  <Input
                    placeholder="https://youtube.com/..."
                    value={formData.videoIntroUrl}
                    onChange={(e) => setFormData({ ...formData, videoIntroUrl: e.target.value })}
                    data-testid="input-video-url"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Add at least one social media handle for verification
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube Channel</Label>
                    <Input
                      id="youtube"
                      placeholder="https://youtube.com/@username"
                      value={formData.youtube}
                      onChange={(e) => {
                        setFormData({ ...formData, youtube: e.target.value });
                        const result = validateYouTubeUrl(e.target.value);
                        setErrors(prev => ({ ...prev, youtube: result.error || '' }));
                      }}
                      data-testid="input-youtube"
                    />
                    {errors.youtube && <p className="text-xs text-red-500">{errors.youtube}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="https://instagram.com/username"
                      value={formData.instagram}
                      onChange={(e) => {
                        setFormData({ ...formData, instagram: e.target.value });
                        const result = validateInstagramUrl(e.target.value);
                        setErrors(prev => ({ ...prev, instagram: result.error || '' }));
                      }}
                      data-testid="input-instagram"
                    />
                    {errors.instagram && <p className="text-xs text-red-500">{errors.instagram}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedin}
                      onChange={(e) => {
                        setFormData({ ...formData, linkedin: e.target.value });
                        const result = validateLinkedInUrl(e.target.value);
                        setErrors(prev => ({ ...prev, linkedin: result.error || '' }));
                      }}
                      data-testid="input-linkedin"
                    />
                    {errors.linkedin && <p className="text-xs text-red-500">{errors.linkedin}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                      placeholder="https://twitter.com/username"
                      value={formData.twitter}
                      onChange={(e) => {
                        setFormData({ ...formData, twitter: e.target.value });
                        const result = validateTwitterUrl(e.target.value);
                        setErrors(prev => ({ ...prev, twitter: result.error || '' }));
                      }}
                      data-testid="input-twitter"
                    />
                    {errors.twitter && <p className="text-xs text-red-500">{errors.twitter}</p>}
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm">
                    <strong>Note:</strong> We'll automatically fetch your follower counts from
                    connected social media accounts for your Creasearch Score calculation.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Profile Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Review your information before submitting for approval
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="font-medium">{formData.name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Title</p>
                      <p className="font-medium">{formData.title || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Industry</p>
                      <p className="font-medium">{formData.industry || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Niche</p>
                      <p className="font-medium">{formData.niche || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="font-medium">
                        {formData.city && formData.country
                          ? `${formData.city}, ${getCountryName(formData.country)}`
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{formData.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Collaboration Types</p>
                      <p className="font-medium">
                        {formData.collaborationTypes.length > 0
                          ? formData.collaborationTypes.join(", ")
                          : "None selected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Profile Completion</p>
                      <p className="font-medium">{calculateCompletion()}%</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">About</p>
                      <p className="font-medium text-sm">{formData.bio || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-4 border rounded-md">
                    <Checkbox
                      id="terms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked as boolean })}
                      data-testid="checkbox-terms"
                    />
                    <label htmlFor="terms" className="text-sm cursor-pointer">
                      I confirm that all information provided is accurate and I agree to
                      Creasearch's Terms of Service and Privacy Policy
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              data-testid="button-previous"
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (currentStep < totalSteps) {
                  setCurrentStep(currentStep + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={isSubmitting}
              data-testid="button-next"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : currentStep === totalSteps ? (
                "Submit for Review"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
