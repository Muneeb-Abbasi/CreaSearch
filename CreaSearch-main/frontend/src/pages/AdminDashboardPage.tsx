import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, CheckCircle2, XCircle, Clock, TrendingUp, DollarSign, Loader2, RefreshCw, Trash2, Eye, AlertCircle, Star, Handshake } from "lucide-react";
import { SiYoutube, SiInstagram, SiFacebook } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, profileApi, featuredProfileApi, collaborationApi, Profile, type Collaboration } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ProfileDetailModal } from "@/components/ProfileDetailModal";
import { AdminCategoriesTab } from "@/components/AdminCategoriesTab";

// Helper to get verification status badge
function getVerificationBadge(platform: 'youtube' | 'instagram' | 'facebook', socialLinks: Record<string, any>) {
  const link = socialLinks?.[platform];
  if (!link) return null;

  const status = typeof link === 'object' ? link.status : null;
  const count = typeof link === 'object' ? (link.subscribers || link.followers) : null;

  if (status === 'VERIFIED' || status === 'VALIDATED') {
    return (
      <Badge variant="default" className="bg-green-500 text-xs">
        {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : platform === 'instagram' ? <SiInstagram className="w-3 h-3 mr-1" /> : <SiFacebook className="w-3 h-3 mr-1" />}
        {count ? `${count >= 1000 ? `${(count / 1000).toFixed(0)}K` : count}` : '✓'}
      </Badge>
    );
  }
  if (status === 'PENDING') {
    return (
      <Badge variant="secondary" className="text-xs">
        {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : platform === 'instagram' ? <SiInstagram className="w-3 h-3 mr-1" /> : <SiFacebook className="w-3 h-3 mr-1" />}
        Pending
      </Badge>
    );
  }
  if (status === 'HIDDEN' || status === 'PRIVATE') {
    return (
      <Badge variant="outline" className="text-xs">
        {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : platform === 'instagram' ? <SiInstagram className="w-3 h-3 mr-1" /> : <SiFacebook className="w-3 h-3 mr-1" />}
        Hidden
      </Badge>
    );
  }
  if (status === 'FAILED' || status === 'NOT_FOUND') {
    return (
      <Badge variant="destructive" className="text-xs">
        {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : platform === 'instagram' ? <SiInstagram className="w-3 h-3 mr-1" /> : <SiFacebook className="w-3 h-3 mr-1" />}
        Failed
      </Badge>
    );
  }
  // Has link but no status (legacy)
  return (
    <Badge variant="outline" className="text-xs">
      {platform === 'youtube' ? <SiYoutube className="w-3 h-3 mr-1" /> : platform === 'instagram' ? <SiInstagram className="w-3 h-3 mr-1" /> : <SiFacebook className="w-3 h-3 mr-1" />}
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
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [featureLoading, setFeatureLoading] = useState<string | null>(null);

  const [pendingCollabs, setPendingCollabs] = useState<Collaboration[]>([]);
  const [allCollabs, setAllCollabs] = useState<Collaboration[]>([]);
  const [collabLoading, setCollabLoading] = useState<string | null>(null);
  const [showAdminCollabForm, setShowAdminCollabForm] = useState(false);
  const [collabFilter, setCollabFilter] = useState<'all' | 'pending_confirmation' | 'pending_admin' | 'approved' | 'rejected'>('all');
  const [adminCollabForm, setAdminCollabForm] = useState({
    requester_profile_id: '',
    title: '',
    campaign_name: '',
    description: '',
    proof_urls: [''],
    is_external: true,
    external_partner_name: '',
    external_partner_url: '',
    auto_approve: true,
  });
  const [adminCollabSubmitting, setAdminCollabSubmitting] = useState(false);

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

  // Fetch featured profile IDs
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchFeaturedIds();
    }
  }, [user, authLoading, isAdmin]);

  const fetchFeaturedIds = async () => {
    try {
      const featured = await featuredProfileApi.getAll();
      setFeaturedIds(new Set(featured.map(f => f.profile_id)));
    } catch {
      // non-critical
    }
  };



  const fetchPendingCollabs = async () => {
    try {
      const collabs = await collaborationApi.getPending();
      setPendingCollabs(collabs);
    } catch {
      // non-critical on initial load
    }
  };

  const fetchAllCollabs = async () => {
    try {
      const collabs = await collaborationApi.getAll();
      setAllCollabs(collabs);
    } catch {
      // non-critical
    }
  };

  const handleApproveCollab = async (collabId: string) => {
    setCollabLoading(collabId);
    try {
      await collaborationApi.approve(collabId);
      toast({ title: "Collaboration Approved", description: "Both profiles' collaboration counts have been incremented." });
      setPendingCollabs(prev => prev.filter(c => c.id !== collabId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to approve collaboration", variant: "destructive" });
    } finally {
      setCollabLoading(null);
    }
  };

  const handleRejectCollab = async (collabId: string) => {
    setCollabLoading(collabId);
    try {
      await collaborationApi.reject(collabId);
      toast({ title: "Collaboration Rejected", description: "The collaboration request has been rejected." });
      setPendingCollabs(prev => prev.filter(c => c.id !== collabId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reject collaboration", variant: "destructive" });
    } finally {
      setCollabLoading(null);
    }
  };

  const handleAdminCreateCollab = async () => {
    if (!adminCollabForm.requester_profile_id || !adminCollabForm.description) {
      toast({ title: "Error", description: "Profile and description are required", variant: "destructive" });
      return;
    }
    if (adminCollabForm.is_external && !adminCollabForm.external_partner_name) {
      toast({ title: "Error", description: "External partner name is required", variant: "destructive" });
      return;
    }
    const validProofUrls = adminCollabForm.proof_urls.filter(u => u.trim() !== '');
    setAdminCollabSubmitting(true);
    try {
      await collaborationApi.adminCreate({
        ...adminCollabForm,
        title: adminCollabForm.title || undefined,
        campaign_name: adminCollabForm.campaign_name || undefined,
        proof_urls: validProofUrls.length > 0 ? validProofUrls : undefined,
      });
      toast({
        title: adminCollabForm.auto_approve ? "Collaboration Created & Approved" : "Collaboration Created",
        description: adminCollabForm.auto_approve
          ? "The collaboration has been created and auto-approved. Score updated."
          : "The collaboration has been created and is pending."
      });
      setShowAdminCollabForm(false);
      setAdminCollabForm({
        requester_profile_id: '', title: '', campaign_name: '', description: '', proof_urls: [''],
        is_external: true, external_partner_name: '', external_partner_url: '', auto_approve: true,
      });
      fetchPendingCollabs();
      fetchAllCollabs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create collaboration", variant: "destructive" });
    } finally {
      setAdminCollabSubmitting(false);
    }
  };

  const handleToggleFeatured = async (profileId: string) => {
    setFeatureLoading(profileId);
    try {
      if (featuredIds.has(profileId)) {
        await featuredProfileApi.unfeature(profileId);
        setFeaturedIds(prev => { const s = new Set(prev); s.delete(profileId); return s; });
        toast({ title: "Unfeatured", description: "Profile removed from featured list." });
      } else {
        await featuredProfileApi.feature(profileId);
        setFeaturedIds(prev => new Set(prev).add(profileId));
        toast({ title: "Featured!", description: "Profile added to featured list on homepage." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update featured status", variant: "destructive" });
    } finally {
      setFeatureLoading(null);
    }
  };

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

  // Admin manual Facebook verification
  const handleVerifyFacebook = async (profileId: string) => {
    setVerifyLoading(profileId);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const { data: session } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      const token = session?.session?.access_token;

      const response = await fetch(`${API_BASE}/admin/verify-facebook-now/${profileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Facebook Verified!",
          description: `${result.pageName}: ${result.followers?.toLocaleString()} followers`
        });
        // Refresh profiles to show updated data
        fetchPendingProfiles();
        fetchAllProfiles();
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Could not verify Facebook profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error verifying Facebook:", error);
      toast({
        title: "Error",
        description: "Failed to verify Facebook",
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
                      <p className="text-3xl font-bold" data-testid="text-total-users">{allProfiles.length || "-"}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {allProfiles.length > 0 ? `${allProfiles.length} registered` : "No profiles yet"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Creators</p>
                      <p className="text-3xl font-bold" data-testid="text-active-creators">{allProfiles.filter(p => p.status === 'approved').length || "-"}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {featuredIds.size > 0 ? `${featuredIds.size} featured` : "None featured yet"}
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
                <TabsTrigger value="collaborations" onClick={() => { if (pendingCollabs.length === 0) fetchPendingCollabs(); fetchAllCollabs(); }}>Collaborations</TabsTrigger>

                <TabsTrigger value="categories">Categories</TabsTrigger>
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

                              {/* Verify Facebook Button (if pending or failed) */}
                              {profile.social_links?.facebook && (
                                typeof profile.social_links.facebook !== 'string' &&
                                ['PENDING', 'FAILED', undefined].includes(profile.social_links.facebook.status)
                              ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVerifyFacebook(profile.id)}
                                    disabled={verifyLoading === profile.id}
                                    className="text-xs"
                                  >
                                    {verifyLoading === profile.id ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <SiFacebook className="w-3 h-3 mr-1" />
                                    )}
                                    Verify FB
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
                                onClick={() => handleToggleFeatured(profile.id)}
                                disabled={featureLoading === profile.id}
                                className={featuredIds.has(profile.id) ? "text-yellow-500 hover:text-yellow-600" : ""}
                                title={featuredIds.has(profile.id) ? "Remove from featured" : "Add to featured"}
                              >
                                {featureLoading === profile.id ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Star className={`w-4 h-4 mr-1 ${featuredIds.has(profile.id) ? "fill-yellow-500" : ""}`} />
                                )}
                                {featuredIds.has(profile.id) ? "Unfeature" : "Feature"}
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



              <TabsContent value="collaborations" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Handshake className="w-5 h-5" />
                        Pending Collaborations ({pendingCollabs.length})
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowAdminCollabForm(!showAdminCollabForm)}>
                          {showAdminCollabForm ? 'Cancel' : '+ Add Collab'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={fetchPendingCollabs}>
                          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Admin Collab Creation Form */}
                    {showAdminCollabForm && (
                      <div className="mb-6 p-4 border rounded-md bg-muted/50 space-y-4">
                        <h4 className="font-semibold text-sm">Create Collaboration (Admin)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">User Profile *</label>
                            <select
                              className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                              value={adminCollabForm.requester_profile_id}
                              onChange={(e) => setAdminCollabForm(prev => ({ ...prev, requester_profile_id: e.target.value }))}
                            >
                              <option value="">Select profile...</option>
                              {allProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.title || p.profile_type})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">External Partner Name *</label>
                            <input
                              className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                              placeholder="e.g. Nike Pakistan, @creator_name"
                              value={adminCollabForm.external_partner_name}
                              onChange={(e) => setAdminCollabForm(prev => ({ ...prev, external_partner_name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Title</label>
                            <input
                              className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                              placeholder="e.g. Product Review Video"
                              value={adminCollabForm.title}
                              onChange={(e) => setAdminCollabForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Campaign Name</label>
                            <input
                              className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                              placeholder="e.g. Summer 2026 Campaign"
                              value={adminCollabForm.campaign_name}
                              onChange={(e) => setAdminCollabForm(prev => ({ ...prev, campaign_name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">External Partner URL</label>
                            <input
                              className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                              placeholder="https://instagram.com/partner or website link"
                              value={adminCollabForm.external_partner_url}
                              onChange={(e) => setAdminCollabForm(prev => ({ ...prev, external_partner_url: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Proof URLs</label>
                            {adminCollabForm.proof_urls.map((url, index) => (
                              <div key={index} className="flex gap-2 mt-1">
                                <input
                                  className="flex-1 border rounded-md p-2 text-sm bg-background"
                                  placeholder="https://..."
                                  value={url}
                                  onChange={(e) => {
                                    const updated = [...adminCollabForm.proof_urls];
                                    updated[index] = e.target.value;
                                    setAdminCollabForm(prev => ({ ...prev, proof_urls: updated }));
                                  }}
                                />
                                {adminCollabForm.proof_urls.length > 1 && (
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setAdminCollabForm(prev => ({
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
                              className="mt-1"
                              onClick={() => setAdminCollabForm(prev => ({ ...prev, proof_urls: [...prev.proof_urls, ''] }))}
                            >
                              + Add Link
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description *</label>
                          <textarea
                            className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                            rows={2}
                            placeholder="Describe the collaboration..."
                            value={adminCollabForm.description}
                            onChange={(e) => setAdminCollabForm(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={adminCollabForm.auto_approve}
                              onChange={(e) => setAdminCollabForm(prev => ({ ...prev, auto_approve: e.target.checked }))}
                            />
                            Auto-approve (immediately count towards score)
                          </label>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleAdminCreateCollab}
                          disabled={adminCollabSubmitting}
                        >
                          {adminCollabSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                          {adminCollabForm.auto_approve ? 'Create & Approve' : 'Create (Pending)'}
                        </Button>
                      </div>
                    )}

                    {/* Pending Collaborations List */}
                    {pendingCollabs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Handshake className="w-12 h-12 mx-auto mb-4 opacity-40" />
                        <p>No pending collaboration requests.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingCollabs.map((collab) => (
                          <div key={collab.id} className="p-4 border rounded-md space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {collab.title && <strong>{collab.title} — </strong>}
                                  Requester: <span className="text-muted-foreground">{collab.requester_profile_id.slice(0, 8)}...</span>
                                  {" → "}
                                  {collab.is_external ? (
                                    <span className="text-orange-600 font-semibold">
                                      {collab.external_partner_name || 'External Partner'}
                                      {collab.external_partner_url && (
                                        <a href={collab.external_partner_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 underline text-xs">↗</a>
                                      )}
                                    </span>
                                  ) : (
                                    <>Partner: <span className="text-muted-foreground">{collab.partner_profile_id?.slice(0, 8)}...</span></>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {formatDate(collab.created_at)}
                                  {collab.campaign_name && <> · Campaign: <strong>{collab.campaign_name}</strong></>}
                                  {collab.date_range && <> · {collab.date_range}</>}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {collab.is_external && <Badge variant="outline" className="text-orange-600 border-orange-300">External</Badge>}
                                <Badge variant="secondary">Pending Admin</Badge>
                              </div>
                            </div>
                            <p className="text-sm">{collab.description}</p>
                            {/* Proof links */}
                            {(collab.proof_urls?.length > 0 || collab.proof_url) && (
                              <div className="flex flex-wrap gap-2">
                                {(collab.proof_urls?.length > 0 ? collab.proof_urls : [collab.proof_url]).filter(Boolean).map((url, i) => (
                                  <a key={i} href={url!} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 underline">
                                    Proof {i + 1} ↗
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveCollab(collab.id)}
                                disabled={collabLoading === collab.id}
                              >
                                {collabLoading === collab.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectCollab(collab.id)}
                                disabled={collabLoading === collab.id}
                              >
                                {collabLoading === collab.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* All Collaborations Section */}
                    <div className="mt-8 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">All Collaborations ({allCollabs.length})</h4>
                        <div className="flex gap-1">
                          {(['all', 'pending_confirmation', 'pending_admin', 'approved', 'rejected'] as const).map(filter => (
                            <Button
                              key={filter}
                              size="sm"
                              variant={collabFilter === filter ? 'default' : 'outline'}
                              onClick={() => setCollabFilter(filter)}
                              className="text-xs"
                            >
                              {filter === 'all' ? 'All' : filter === 'pending_confirmation' ? 'Awaiting Confirm' : filter === 'pending_admin' ? 'Pending Admin' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {allCollabs
                        .filter(c => collabFilter === 'all' || c.status === collabFilter)
                        .length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No collaborations found.</p>
                      ) : (
                        <div className="space-y-3">
                          {allCollabs
                            .filter(c => collabFilter === 'all' || c.status === collabFilter)
                            .map(collab => (
                              <div key={collab.id} className="p-3 border rounded-md flex items-center justify-between">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">{collab.title || collab.description.slice(0, 40)}</span>
                                    <Badge
                                      variant={collab.status === 'approved' ? 'default' : collab.status === 'rejected' ? 'destructive' : 'secondary'}
                                      className={`text-xs ${collab.status === 'approved' ? 'bg-green-500' : ''}`}
                                    >
                                      {collab.status.replace('_', ' ')}
                                    </Badge>
                                    {collab.is_external && <Badge variant="outline" className="text-xs">External</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {collab.requester_profile_id.slice(0, 8)}...
                                    {collab.is_external ? ` → ${collab.external_partner_name}` : ` → ${collab.partner_profile_id?.slice(0, 8)}...`}
                                    {collab.campaign_name && <> · {collab.campaign_name}</>}
                                    {" · "}{formatDate(collab.created_at)}
                                  </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  {(collab.proof_urls?.length > 0 || collab.proof_url) && (
                                    <a
                                      href={(collab.proof_urls?.length > 0 ? collab.proof_urls[0] : collab.proof_url) || '#'}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-blue-500 underline"
                                    >
                                      Proof
                                    </a>
                                  )}

                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
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

              <TabsContent value="categories" className="mt-6">
                <AdminCategoriesTab />
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
