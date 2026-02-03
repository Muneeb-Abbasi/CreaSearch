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
import { Upload, CheckCircle2, Loader2, Clock, XCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, uploadApi, Profile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CountrySelect } from "@/components/ui/country-select";
import { CitySelect } from "@/components/ui/city-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  validateName,
  validateIndustry,
  validateNiche,
  validatePhone,
  validateCountry,
  validateCity,
  validateUrl,
  validateInstagramUrl,
  validateLinkedInUrl,
  validateTwitterUrl
} from "@/utils/validation";

export default function BrandProfileCreationPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Form state
  const [formData, setFormData] = useState({
    name: "", // Company/Organization name
    industry: "", // Required
    niche: "", // Required
    city: "", // Required
    country: "", // Required
    phone: "", // Required
    companySize: "", // Company size
    website: "", // Website URL
    bio: "", // Company description
    linkedin: "",
    twitter: "",
    facebook: "",
    instagram: "",
    agreedToTerms: false,
  });

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    "Company Info",
    "Logo Upload",
    "Online Presence",
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
        // Only show if it's an organization profile
        if (profile?.role === 'organization') {
          setExistingProfile(profile);
        } else {
          setExistingProfile(null);
        }
      } catch (error) {
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

  // Real-time validation handler
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    let validation: { isValid: boolean; error?: string };
    switch (field) {
      case 'name':
        validation = validateName(value);
        break;
      case 'industry':
        validation = validateIndustry(value);
        break;
      case 'niche':
        validation = validateNiche(value);
        break;
      case 'phone':
        validation = validatePhone(value);
        break;
      case 'website':
        validation = validateUrl(value, "Website URL");
        break;
      case 'country':
        validation = validateCountry(value);
        if (validation.isValid) {
          setErrors(prev => ({ ...prev, country: '' }));
        }
        break;
      case 'city':
        validation = validateCity(value, formData.country);
        break;
      default:
        validation = { isValid: true };
    }

    // Update errors
    setErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? '' : validation.error || ''
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 2MB",
          variant: "destructive"
        });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Validate all required fields
    const nameValidation = validateName(formData.name);
    const industryValidation = validateIndustry(formData.industry);
    const nicheValidation = validateNiche(formData.niche);
    const phoneValidation = validatePhone(formData.phone);
    const countryValidation = validateCountry(formData.country);
    const cityValidation = validateCity(formData.city, formData.country);

    // Collect all errors
    const allErrors: Record<string, string> = {};
    if (!nameValidation.isValid) allErrors.name = nameValidation.error!;
    if (!industryValidation.isValid) allErrors.industry = industryValidation.error!;
    if (!nicheValidation.isValid) allErrors.niche = nicheValidation.error!;
    if (!phoneValidation.isValid) allErrors.phone = phoneValidation.error!;
    if (!countryValidation.isValid) allErrors.country = countryValidation.error!;
    if (!cityValidation.isValid) allErrors.city = cityValidation.error!;

    // Set errors and prevent submission if validation fails
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast({
        title: "Validation failed",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      const firstErrorField = Object.keys(allErrors)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Check required logo
    if (!logoFile) {
      toast({
        title: "Logo required",
        description: "Please upload a company logo before submitting",
        variant: "destructive"
      });
      return;
    }

    // Check required website
    if (!formData.website) {
      toast({
        title: "Website required",
        description: "Please provide your company website URL",
        variant: "destructive"
      });
      return;
    }

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
      const socialLinks: Record<string, string> = {};
      if (formData.linkedin) socialLinks.linkedin = formData.linkedin;
      if (formData.twitter) socialLinks.twitter = formData.twitter;
      if (formData.facebook) socialLinks.facebook = formData.facebook;
      if (formData.instagram) socialLinks.instagram = formData.instagram;
      if (formData.website) socialLinks.website = formData.website;

      // Upload logo first if selected
      let logoUrl: string | null = null;
      if (logoFile && user?.id) {
        setIsUploadingLogo(true);
        try {
          const uploadResult = await uploadApi.uploadPhoto(user.id, logoFile);
          logoUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Logo upload failed:", uploadError);
          toast({
            title: "Logo upload failed",
            description: "Profile will be created without logo. You can add it later.",
            variant: "destructive"
          });
        } finally {
          setIsUploadingLogo(false);
        }
      }

      await profileApi.create({
        user_id: user?.id,
        name: formData.name.trim(),
        title: formData.companySize || null, // Use company size as title
        industry: formData.industry.trim(), // Required
        niche: formData.niche.trim(), // Required
        city: formData.city, // Required
        country: formData.country, // Required
        phone: formData.phone.trim(), // Required
        bio: formData.bio.trim() || null,
        avatar_url: logoUrl,
        follower_total: 0, // Brands don't have followers
        collaboration_types: [], // Brands don't have collaboration types
        video_intro_url: null,
        social_links: socialLinks,
        role: 'organization', // Brand role
        status: 'pending',
        profile_completion: calculateCompletion(),
      });

      toast({
        title: "Brand profile submitted!",
        description: "Your brand profile is pending review. We'll notify you once approved.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error creating brand profile:", error);
      toast({
        title: "Error",
        description: "Failed to create brand profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateCompletion = () => {
    let score = 0;
    if (formData.name && !errors.name) score += 15;
    if (formData.industry && !errors.industry) score += 12; // Required
    if (formData.niche && !errors.niche) score += 12; // Required
    if (formData.phone && !errors.phone) score += 10; // Required
    if (formData.city && formData.country && !errors.city && !errors.country) score += 10; // Required
    if (formData.companySize) score += 8;
    if (formData.website && !errors.website) score += 8;
    if (formData.bio) score += 15;
    if (formData.linkedin || formData.twitter || formData.facebook || formData.instagram) score += 10;
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
                    <CardTitle className="text-2xl">Brand Profile Under Review</CardTitle>
                  </>
                )}
                {existingProfile.status === 'approved' && (
                  <>
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <CardTitle className="text-2xl">Brand Profile Approved!</CardTitle>
                  </>
                )}
                {existingProfile.status === 'rejected' && (
                  <>
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <CardTitle className="text-2xl">Brand Profile Needs Updates</CardTitle>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {existingProfile.status === 'pending' && (
                  <>
                    <p className="text-muted-foreground">
                      Your brand profile is currently being reviewed by our team.
                      You'll receive a notification once it's approved.
                    </p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Brand: {existingProfile.name}</p>
                      <p className="text-xs text-muted-foreground">Submitted on {new Date(existingProfile.created_at).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
                {existingProfile.status === 'approved' && (
                  <>
                    <p className="text-muted-foreground">
                      Congratulations! Your brand profile is now live and visible to creators.
                    </p>
                    <Button onClick={() => navigate(`/creator/${existingProfile.id}`)}>
                      View My Brand Profile
                    </Button>
                  </>
                )}
                {existingProfile.status === 'rejected' && (
                  <>
                    <p className="text-muted-foreground">
                      Your brand profile wasn't approved. Please update your information and resubmit.
                    </p>
                    <Button onClick={() => {
                      setFormData({
                        name: existingProfile.name,
                        industry: existingProfile.industry || "",
                        niche: existingProfile.niche || "",
                        city: existingProfile.city || "",
                        country: existingProfile.country || "",
                        phone: existingProfile.phone || "",
                        companySize: existingProfile.title || "",
                        website: existingProfile.social_links?.website || "",
                        bio: existingProfile.bio || "",
                        linkedin: existingProfile.social_links?.linkedin || "",
                        twitter: existingProfile.social_links?.twitter || "",
                        facebook: existingProfile.social_links?.facebook || "",
                        instagram: existingProfile.social_links?.instagram || "",
                        agreedToTerms: false,
                      });
                      setExistingProfile(null);
                    }}>
                      Edit Brand Profile
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
              Create Your Brand Profile
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
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company/Organization Name *</Label>
                  <Input
                    id="company-name"
                    placeholder="Your company or organization name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => {
                      const validation = validateName(formData.name);
                      if (!validation.isValid) {
                        setErrors(prev => ({ ...prev, name: validation.error || '' }));
                      }
                    }}
                    required
                    className={errors.name ? "border-red-500" : ""}
                    data-testid="input-company-name"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Letters only, no numbers allowed
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Technology, Fashion, Food, Education"
                      value={formData.industry}
                      onChange={(e) => handleFieldChange('industry', e.target.value)}
                      onBlur={() => {
                        const validation = validateIndustry(formData.industry);
                        if (!validation.isValid) {
                          setErrors(prev => ({ ...prev, industry: validation.error || '' }));
                        }
                      }}
                      required
                      className={errors.industry ? "border-red-500" : ""}
                      data-testid="input-industry"
                    />
                    {errors.industry && (
                      <p className="text-xs text-red-500">{errors.industry}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="niche">Niche *</Label>
                    <Input
                      id="niche"
                      placeholder="e.g., SaaS, Streetwear, Fine Dining, EdTech"
                      value={formData.niche}
                      onChange={(e) => handleFieldChange('niche', e.target.value)}
                      onBlur={() => {
                        const validation = validateNiche(formData.niche);
                        if (!validation.isValid) {
                          setErrors(prev => ({ ...prev, niche: validation.error || '' }));
                        }
                      }}
                      required
                      className={errors.niche ? "border-red-500" : ""}
                      data-testid="input-niche"
                    />
                    {errors.niche && (
                      <p className="text-xs text-red-500">{errors.niche}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-size">Company Size</Label>
                  <Select value={formData.companySize} onValueChange={(value) => setFormData({ ...formData, companySize: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                      <SelectItem value="small">Small (11-50 employees)</SelectItem>
                      <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                      <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <CountrySelect
                      value={formData.country}
                      onValueChange={(value) => {
                        handleFieldChange('country', value);
                        setFormData(prev => ({ ...prev, city: "" }));
                        setErrors(prev => ({ ...prev, city: '' }));
                      }}
                      placeholder="Select country..."
                    />
                    {errors.country && (
                      <p className="text-xs text-red-500">{errors.country}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <CitySelect
                      value={formData.city}
                      countryCode={formData.country}
                      onValueChange={(value) => handleFieldChange('city', value)}
                      placeholder={formData.country ? "Select city..." : "Select country first"}
                      disabled={!formData.country}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+92 300 1234567 or 0300-1234567"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    onBlur={() => {
                      const validation = validatePhone(formData.phone);
                      if (!validation.isValid) {
                        setErrors(prev => ({ ...prev, phone: validation.error || '' }));
                      }
                    }}
                    required
                    className={errors.phone ? "border-red-500" : ""}
                    data-testid="input-phone"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +92 for Pakistan)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Company Description *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your company, what you do, and what makes you unique..."
                    rows={6}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    data-testid="textarea-bio"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Logo Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload your company logo
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                    data-testid="input-logo"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="border-2 border-dashed rounded-md p-8 text-center hover:bg-muted/50 cursor-pointer block transition-colors"
                  >
                    {logoPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="w-32 h-32 object-contain mb-3"
                        />
                        <p className="text-sm font-medium text-green-600">Logo selected!</p>
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
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Online Presence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourcompany.com"
                    value={formData.website}
                    onChange={(e) => handleFieldChange('website', e.target.value)}
                    onBlur={() => {
                      const validation = validateUrl(formData.website, "Website URL");
                      if (!validation.isValid) {
                        setErrors(prev => ({ ...prev, website: validation.error || '' }));
                      }
                    }}
                    className={errors.website ? "border-red-500" : ""}
                    data-testid="input-website"
                  />
                  {errors.website && (
                    <p className="text-xs text-red-500">{errors.website}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/company/yourcompany"
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
                      placeholder="https://twitter.com/yourcompany"
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

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      placeholder="https://facebook.com/yourcompany"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      data-testid="input-facebook"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="https://instagram.com/yourcompany"
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
                    <h3 className="font-semibold mb-2">Brand Profile Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Review your information before submitting for approval
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Company Name</p>
                      <p className="font-medium">{formData.name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Company Size</p>
                      <p className="font-medium">{formData.companySize || "Not provided"}</p>
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
                          ? `${formData.city}, ${formData.country}`
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{formData.phone || "Not provided"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="font-medium text-sm">{formData.bio || "Not provided"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Profile Completion</p>
                      <p className="font-medium">{calculateCompletion()}%</p>
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
