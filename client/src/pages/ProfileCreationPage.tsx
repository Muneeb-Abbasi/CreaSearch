import { useState } from "react";
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
import { Upload, CheckCircle2 } from "lucide-react";

export default function ProfileCreationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    "Basic Info",
    "Media Upload",
    "Social Links",
    "Review & Submit"
  ];

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
                    <Input id="full-name" placeholder="Your full name" data-testid="input-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title *</Label>
                    <Input id="title" placeholder="e.g., Tech Content Creator" data-testid="input-title" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" placeholder="City, Pakistan" data-testid="input-location" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About You *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your experience and what makes you unique..."
                    rows={6}
                    data-testid="textarea-bio"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Collaboration Types *</Label>
                  <div className="space-y-3">
                    {["Video Content", "Podcasts", "Events/Speaking", "Training Sessions"].map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox id={type} data-testid={`checkbox-${type}`} />
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
                  <Label>Profile Photo *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a clear, face-visible photo for verification
                  </p>
                  <div className="border-2 border-dashed rounded-md p-8 text-center hover-elevate cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Video Introduction (30-50 seconds) *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Introduce yourself and your work in a short video
                  </p>
                  <div className="border-2 border-dashed rounded-md p-8 text-center hover-elevate cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, MOV up to 50MB</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Or paste a YouTube/Vimeo link
                  </p>
                  <Input placeholder="https://youtube.com/..." data-testid="input-video-url" />
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
                  Add at least two social media handles for verification
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube Channel</Label>
                    <Input
                      id="youtube"
                      placeholder="https://youtube.com/@username"
                      data-testid="input-youtube"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="https://instagram.com/username"
                      data-testid="input-instagram"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/in/username"
                      data-testid="input-linkedin"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                      placeholder="https://twitter.com/username"
                      data-testid="input-twitter"
                    />
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
                      <p className="font-medium">Your Name Here</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Title</p>
                      <p className="font-medium">Your Title Here</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="font-medium">City, Pakistan</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Collaboration Types</p>
                      <p className="font-medium">Video, Podcasts</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-4 border rounded-md">
                    <Checkbox id="terms" data-testid="checkbox-terms" />
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
                  console.log("Profile submitted");
                }
              }}
              data-testid="button-next"
            >
              {currentStep === totalSteps ? "Submit for Review" : "Next"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
