import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, CheckCircle2, XCircle, Clock, TrendingUp, DollarSign } from "lucide-react";
import creatorImage1 from "@assets/generated_images/Pakistani_female_creator_headshot_b1688276.png";
import creatorImage2 from "@assets/generated_images/Pakistani_male_creator_headshot_3c6570b2.png";

const pendingProfiles = [
  {
    id: "1",
    name: "Zara Ahmed",
    type: "Creator",
    imageUrl: creatorImage1,
    submittedDate: "2 hours ago",
    status: "pending",
  },
  {
    id: "2",
    name: "Ali Hassan",
    type: "Creator",
    imageUrl: creatorImage2,
    submittedDate: "5 hours ago",
    status: "pending",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <h1 className="font-heading text-3xl font-bold mb-8" data-testid="text-page-title">
            Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                    <p className="text-3xl font-bold" data-testid="text-total-users">3,247</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Creators</p>
                    <p className="text-3xl font-bold" data-testid="text-active-creators">2,156</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending Verifications</p>
                    <p className="text-3xl font-bold" data-testid="text-pending-verifications">24</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                    <p className="text-3xl font-bold" data-testid="text-revenue">₨1.2M</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +15% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="verifications" className="w-full">
            <TabsList data-testid="tabs-admin">
              <TabsTrigger value="verifications">Pending Verifications</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="verifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profiles Awaiting Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                        data-testid={`profile-${profile.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={profile.imageUrl} alt={profile.name} />
                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{profile.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {profile.type} • Submitted {profile.submittedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Pending Review</Badge>
                          <Button variant="outline" size="sm" data-testid="button-review">
                            Review
                          </Button>
                          <Button variant="default" size="sm" data-testid="button-approve">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" data-testid="button-reject">
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">User management interface will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Analytics and reports will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
