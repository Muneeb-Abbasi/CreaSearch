import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, CheckCircle2, XCircle, Clock, TrendingUp, DollarSign, Loader2, RefreshCw, Trash2, Eye, AlertCircle } from "lucide-react";
import { SiYoutube, SiInstagram } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, profileApi, Profile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ProfileDetailModal } from "@/components/ProfileDetailModal";

// Helper to get verification status badge
function getVerificationBadge(platform: 'youtube' | 'instagram', socialLinks: Record<string, any>) {
  const link = socialLinks?.[platform];
  if (!link) return null;

  const status = typeof link === 'object' ? link.status : null;
  const count = typeof link === 'object' ? (link.subscribers || link.followers) : null;

  if (status === 'VERIFIED' || status === 'VALIDATED') {
    return (
      <Badge variant="default" className="bg-green-500 text-xs">
        {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : <SiInstagram className="w-3 h-3 mr-1" />}
        {count ? `${count >= 1000 ? `${(count / 1000).toFixed(0)}K` : count}` : '✓'}
      </Badge>
    );
  }
  if (status === 'PENDING') {
    return (
      <Badge variant="secondary" className="text-xs">
        {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : <SiInstagram className="w-3 h-3 mr-1" />}
        Pending
      </Badge>
    );
  }
  if (status === 'HIDDEN' || status === 'PRIVATE') {
    return (
      <Badge variant="outline" className="text-xs">
        {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : <SiInstagram className="w-3 h-3 mr-1" />}
        Hidden
      </Badge>
    );
  }
  if (status === 'FAILED' || status === 'NOT_FOUND') {
    return (
      <Badge variant="destructive" className="text-xs">
        {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : <SiInstagram className="w-3 h-3 mr-1" />}
        Failed
      </Badge>
    );
  }
  // Has link but no status (legacy)
  return (
    <Badge variant="outline" className="text-xs">
      {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : <SiInstagram className="w-3 h-3 mr-1" />}
      Unverified
    </Badge>
  );
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hardcoded admin emails (can access admin dashboard)
  const ADMIN_EMAILS = [
    'muneeb.abbasi13@gmail.com',
    'ceo@pakistanrecruitment.com'
  ];

  // Check if current user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user?.id) return;

      // Check if email is in admin list first
      if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        setIsAdmin(true);
        return;
      }

      // Otherwise check profile role
      try {
        const profile = await profileApi.getMyProfile(user.id);
        setCurrentUserProfile(profile);
        setIsAdmin(profile?.role === 'admin');
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    }
    if (!authLoading && user) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  // Redirect if not admin
  useEffect(() => {
    if (isAdmin === false) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [isAdmin, navigate, toast]);

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

  // Fetch all approved profiles
  const fetchAllProfiles = async () => {
    try {
      const profiles = await profileApi.getAll();
      setAllProfiles(profiles);
    } catch (error) {
      console.error("Error fetching all profiles:", error);
    }
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchPendingProfiles();
      fetchAllProfiles();
    }
  }, [user, authLoading, isAdmin]);

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

  const handleDelete = async (profileId: string) => {
    if (!confirm("Are you sure you want to permanently delete this profile?")) {
      return;
    }
    setActionLoading(profileId);
    try {
      await adminApi.delete(profileId);
      toast({
        title: "Profile Deleted",
        description: "The profile has been permanently deleted."
      });
      setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
      setAllProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Error",
        description: "Failed to delete profile",
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

  // Admin manual Instagram verification
  const handleVerifyInstagram = async (profileId: string) => {
    setVerifyLoading(profileId);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const { data: session } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      const token = session?.session?.access_token;

      const response = await fetch(`${API_BASE}/admin/verify-instagram-now/${profileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Instagram Verified!",
          description: `${result.username}: ${result.followers?.toLocaleString()} followers`
        });
        // Refresh profiles to show updated data
        fetchPendingProfiles();
        fetchAllProfiles();
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Could not verify Instagram profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error verifying Instagram:", error);
      toast({
        title: "Error",
        description: "Failed to verify Instagram",
        variant: "destructive"
      });
    } finally {
      setVerifyLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
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
                <TabsTrigger value="users">All Profiles</TabsTrigger>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Verification Status Badges */}
                              {profile.social_links?.youtube && getVerificationBadge('youtube', profile.social_links)}
                              {profile.social_links?.instagram && getVerificationBadge('instagram', profile.social_links)}

                              {/* Verify Instagram Button (if pending or failed) */}
                              {profile.social_links?.instagram && (
                                typeof profile.social_links.instagram !== 'string' &&
                                ['PENDING', 'FAILED', undefined].includes(profile.social_links.instagram.status)
                              ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVerifyInstagram(profile.id)}
                                    disabled={verifyLoading === profile.id}
                                    className="text-xs"
                                  >
                                    {verifyLoading === profile.id ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <SiInstagram className="w-3 h-3 mr-1" />
                                    )}
                                    Verify IG
                                  </Button>
                                )}

                              <Badge variant="secondary">Pending Review</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProfile(profile);
                                  setIsModalOpen(true);
                                }}
                                data-testid="button-view-details"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
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
                    <CardTitle>All Approved Profiles ({allProfiles.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allProfiles.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No approved profiles yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {allProfiles.map((profile) => (
                          <div
                            key={profile.id}
                            className="flex items-center justify-between p-4 border rounded-md"
                            data-testid={`all-profile-${profile.id}`}
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
                                  {(profile.follower_total || 0).toLocaleString()} followers
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Verification Status Badges */}
                              {profile.social_links?.youtube && getVerificationBadge('youtube', profile.social_links)}
                              {profile.social_links?.instagram && getVerificationBadge('instagram', profile.social_links)}

                              <Badge variant="default" className="bg-green-500">Approved</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProfile(profile);
                                  setIsModalOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(profile.id)}
                                disabled={actionLoading === profile.id}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                {actionLoading === profile.id ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-1" />
                                )}
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

      {/* Profile Detail Modal */}
      {
        selectedProfile && (
          <ProfileDetailModal
            profile={selectedProfile}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedProfile(null);
            }}
            onApprove={async (id) => {
              await handleApprove(id);
              setIsModalOpen(false);
              setSelectedProfile(null);
            }}
            onReject={async (id) => {
              await handleReject(id);
              setIsModalOpen(false);
              setSelectedProfile(null);
            }}
            isLoading={actionLoading === selectedProfile.id}
          />
        )
      }
    </>
  );
}
