import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, CheckCircle2, XCircle, Clock, TrendingUp, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, profileApi, Profile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch pending profiles
  const fetchPendingProfiles = async () => {
    setIsLoading(true);
    try {
      const profiles = await adminApi.getPending();
      setPendingProfiles(profiles);
    } catch (error) {
      console.error("Error fetching pending profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load pending profiles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchPendingProfiles();
    }
  }, [user, authLoading]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleApprove = async (profileId: string) => {
    setActionLoading(profileId);
    try {
      await adminApi.approve(profileId);
      toast({
        title: "Profile Approved",
        description: "The creator profile has been approved and is now visible."
      });
      setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (error) {
      console.error("Error approving profile:", error);
      toast({
        title: "Error",
        description: "Failed to approve profile",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (profileId: string) => {
    setActionLoading(profileId);
    try {
      await adminApi.reject(profileId);
      toast({
        title: "Profile Rejected",
        description: "The creator has been notified to update their profile."
      });
      setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (error) {
      console.error("Error rejecting profile:", error);
      toast({
        title: "Error",
        description: "Failed to reject profile",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl font-bold" data-testid="text-page-title">
              Admin Dashboard
            </h1>
            <Button variant="outline" onClick={fetchPendingProfiles} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending Verifications</p>
                    <p className="text-3xl font-bold" data-testid="text-pending-count">
                      {pendingProfiles.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {pendingProfiles.length > 0 ? "Requires attention" : "All caught up!"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                    <p className="text-3xl font-bold" data-testid="text-total-users">-</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Stats coming soon
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Creators</p>
                    <p className="text-3xl font-bold" data-testid="text-active-creators">-</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Stats coming soon
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                    <p className="text-3xl font-bold" data-testid="text-revenue">₨0</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Coming soon
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="verifications" className="w-full">
            <TabsList data-testid="tabs-admin">
              <TabsTrigger value="verifications">
                Pending Verifications
                {pendingProfiles.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingProfiles.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="verifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profiles Awaiting Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : pendingProfiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <p>No pending profiles to review!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between p-4 border rounded-md"
                          data-testid={`profile-${profile.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                              <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{profile.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {profile.title || "Creator"} • {profile.location || "Pakistan"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {formatDate(profile.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Pending Review</Badge>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(profile.id)}
                              disabled={actionLoading === profile.id}
                              data-testid="button-approve"
                            >
                              {actionLoading === profile.id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(profile.id)}
                              disabled={actionLoading === profile.id}
                              data-testid="button-reject"
                            >
                              {actionLoading === profile.id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
