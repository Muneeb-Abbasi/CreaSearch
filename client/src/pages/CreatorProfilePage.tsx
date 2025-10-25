import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileHeader } from "@/components/ProfileHeader";
import { InquiryModal } from "@/components/InquiryModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star } from "lucide-react";
import creatorImage from "@assets/generated_images/Pakistani_female_creator_headshot_b1688276.png";

export default function CreatorProfilePage() {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ProfileHeader
          name="Ayesha Khan"
          title="Tech Content Creator & Speaker"
          location="Karachi, Pakistan"
          avatarUrl={creatorImage}
          score={85}
          verified={true}
          followerCount={250000}
          completedGigs={47}
          tags={["Tech", "Education", "YouTube", "Podcasts", "Public Speaking"]}
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
                        Hi! I'm Ayesha, a passionate tech content creator and speaker based in Karachi. 
                        I specialize in making complex technology concepts accessible and engaging for 
                        diverse audiences through YouTube videos, podcasts, and live events.
                      </p>
                      <p className="text-foreground leading-relaxed">
                        With over 5 years of experience in content creation and public speaking, I've 
                        collaborated with major tech brands, educational institutions, and startups to 
                        deliver impactful content that resonates with audiences across Pakistan.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Video Introduction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground">Video Player</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Collaboration Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-md">
                          <h4 className="font-semibold mb-2">Video Content</h4>
                          <p className="text-sm text-muted-foreground">
                            Product reviews, tutorials, brand collaborations
                          </p>
                        </div>
                        <div className="p-4 border rounded-md">
                          <h4 className="font-semibold mb-2">Podcasts</h4>
                          <p className="text-sm text-muted-foreground">
                            Guest appearances, hosting, interviews
                          </p>
                        </div>
                        <div className="p-4 border rounded-md">
                          <h4 className="font-semibold mb-2">Events</h4>
                          <p className="text-sm text-muted-foreground">
                            Keynote speaking, panel discussions, workshops
                          </p>
                        </div>
                        <div className="p-4 border rounded-md">
                          <h4 className="font-semibold mb-2">Training</h4>
                          <p className="text-sm text-muted-foreground">
                            Corporate training, educational workshops
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="portfolio" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="aspect-video bg-muted"></div>
                        <CardContent className="pt-4">
                          <h4 className="font-semibold mb-2">Project Title {i}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Brief description of the collaboration and outcomes achieved.
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="secondary">Tech</Badge>
                            <Badge variant="secondary">Video</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6 mt-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">Tech Company {i}</h4>
                            <p className="text-sm text-muted-foreground">2 months ago</p>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-foreground">
                          Outstanding collaboration! Ayesha delivered professional content that 
                          exceeded our expectations. Highly recommended for tech-focused projects.
                        </p>
                      </CardContent>
                    </Card>
                  ))}
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
                      <p className="text-sm text-muted-foreground">Within 2 weeks</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Currently Accepting Inquiries
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Rate</span>
                    <span className="font-semibold">98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Response Time</span>
                    <span className="font-semibold">2 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project Success Rate</span>
                    <span className="font-semibold">100%</span>
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
        creatorName="Ayesha Khan"
      />
    </div>
  );
}
