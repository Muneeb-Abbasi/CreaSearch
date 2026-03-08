import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { collaborationApi, profileApi, type Collaboration, type Profile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabValue = 'awaiting_mine' | 'awaiting_partner' | 'pending_admin' | 'approved' | 'rejected';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending_confirmation: { label: 'Awaiting Confirmation', variant: 'secondary' },
    pending_admin: { label: 'Pending Admin Review', variant: 'outline' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

function CollabCard({
    collab,
    myProfileIds,
    profileMap,
    isAwaitingMyConfirmation,
    onConfirm,
    onReject,
}: {
    collab: Collaboration;
    myProfileIds: string[];
    profileMap: Map<string, Profile>;
    isAwaitingMyConfirmation: boolean;
    onConfirm: (id: string) => void;
    onReject: (id: string) => void;
}) {
    const requesterProfile = profileMap.get(collab.requester_profile_id);
    const partnerProfile = collab.partner_profile_id ? profileMap.get(collab.partner_profile_id) : null;
    const isRequester = myProfileIds.includes(collab.requester_profile_id);

    const partnerName = collab.is_external
        ? collab.external_partner_name || 'External Partner'
        : partnerProfile?.name || 'Unknown';

    const otherPartyName = isRequester ? partnerName : (requesterProfile?.name || 'Unknown');
    const cfg = statusConfig[collab.status] || { label: collab.status, variant: 'outline' as const };

    return (
        <Card className="mb-4">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                                {collab.title || collab.description.slice(0, 60)}
                            </h3>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                            {collab.is_external && <Badge variant="outline">External</Badge>}
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {isRequester ? 'Partner' : 'Requester'}: <strong>{otherPartyName}</strong>
                        </p>

                        {collab.campaign_name && (
                            <p className="text-sm text-muted-foreground">
                                Campaign: <strong>{collab.campaign_name}</strong>
                            </p>
                        )}

                        {collab.date_range && (
                            <p className="text-sm text-muted-foreground">
                                Period: {collab.date_range}
                            </p>
                        )}

                        <p className="text-sm mt-2">{collab.description}</p>

                        {/* Proof links */}
                        {(collab.proof_urls?.length > 0 || collab.proof_url) && (
                            <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Proof Links:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(collab.proof_urls?.length > 0 ? collab.proof_urls : [collab.proof_url]).filter(Boolean).map((url, i) => (
                                        <a
                                            key={i}
                                            href={url!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Proof {i + 1} ↗
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {collab.admin_notes && (
                            <p className="text-sm mt-2 text-muted-foreground italic">
                                Admin notes: {collab.admin_notes}
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                            Submitted: {new Date(collab.created_at).toLocaleDateString()}
                            {collab.approved_at && ` • Approved: ${new Date(collab.approved_at).toLocaleDateString()}`}
                        </p>
                    </div>

                    {isAwaitingMyConfirmation && (
                        <div className="flex flex-col gap-2 shrink-0">
                            <Button size="sm" onClick={() => onConfirm(collab.id)}>
                                Confirm
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => onReject(collab.id)}>
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function MyCollaborationsPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [collabs, setCollabs] = useState<Collaboration[]>([]);
    const [myProfileIds, setMyProfileIds] = useState<string[]>([]);
    const [profileMap, setProfileMap] = useState<Map<string, Profile>>(new Map());
    const [activeTab, setActiveTab] = useState<TabValue>('awaiting_mine');

    const loadData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                navigate('/login');
                return;
            }

            // Load user's own profiles
            const myProfiles = await profileApi.getAllByUserId(session.user.id);
            const ids = myProfiles.map(p => p.id);
            setMyProfileIds(ids);

            // Load all collaborations for user
            const allCollabs = await collaborationApi.getMyCollaborations();
            setCollabs(allCollabs);

            // Build profile map for display names
            const profileIds = new Set<string>();
            allCollabs.forEach(c => {
                profileIds.add(c.requester_profile_id);
                if (c.partner_profile_id) profileIds.add(c.partner_profile_id);
            });

            const map = new Map<string, Profile>();
            myProfiles.forEach(p => map.set(p.id, p));

            // Fetch any missing profiles
            const missingIds = [...profileIds].filter(id => !map.has(id));
            for (const id of missingIds) {
                try {
                    const profile = await profileApi.getById(id);
                    if (profile) map.set(id, profile);
                } catch { /* profile may be deleted */ }
            }
            setProfileMap(map);
        } catch (err) {
            console.error('Error loading collaborations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [navigate]);

    const handleConfirm = async (id: string) => {
        try {
            await collaborationApi.confirm(id);
            toast({ title: 'Confirmed', description: 'Collaboration confirmed! It is now pending admin review.' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to confirm', variant: 'destructive' });
        }
    };

    const handleReject = async (id: string) => {
        try {
            await collaborationApi.rejectByPartner(id);
            toast({ title: 'Rejected', description: 'Collaboration request rejected.' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to reject', variant: 'destructive' });
        }
    };

    // Categorize collabs
    const awaitingMine = collabs.filter(c =>
        c.status === 'pending_confirmation' && c.partner_profile_id && myProfileIds.includes(c.partner_profile_id)
    );
    const awaitingPartner = collabs.filter(c =>
        c.status === 'pending_confirmation' && myProfileIds.includes(c.requester_profile_id)
    );
    const pendingAdmin = collabs.filter(c => c.status === 'pending_admin');
    const approved = collabs.filter(c => c.status === 'approved');
    const rejected = collabs.filter(c => c.status === 'rejected');

    const tabCounts: Record<TabValue, number> = {
        awaiting_mine: awaitingMine.length,
        awaiting_partner: awaitingPartner.length,
        pending_admin: pendingAdmin.length,
        approved: approved.length,
        rejected: rejected.length,
    };

    const getCollabsForTab = (tab: TabValue): Collaboration[] => {
        switch (tab) {
            case 'awaiting_mine': return awaitingMine;
            case 'awaiting_partner': return awaitingPartner;
            case 'pending_admin': return pendingAdmin;
            case 'approved': return approved;
            case 'rejected': return rejected;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">My Collaborations</h1>
                    <Button onClick={() => navigate('/collaborations/submit')}>
                        + Submit Collaboration
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 mb-6">
                            <TabsTrigger value="awaiting_mine" className="relative">
                                Awaiting My Confirmation
                                {tabCounts.awaiting_mine > 0 && (
                                    <span className="ml-1.5 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                                        {tabCounts.awaiting_mine}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="awaiting_partner">
                                Awaiting Partner
                                {tabCounts.awaiting_partner > 0 && (
                                    <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                        {tabCounts.awaiting_partner}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="pending_admin">
                                Pending Admin
                                {tabCounts.pending_admin > 0 && (
                                    <span className="ml-1.5 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                        {tabCounts.pending_admin}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="approved">Approved ({tabCounts.approved})</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected ({tabCounts.rejected})</TabsTrigger>
                        </TabsList>

                        {(['awaiting_mine', 'awaiting_partner', 'pending_admin', 'approved', 'rejected'] as TabValue[]).map(tab => (
                            <TabsContent key={tab} value={tab}>
                                {getCollabsForTab(tab).length === 0 ? (
                                    <Card>
                                        <CardContent className="py-12 text-center text-muted-foreground">
                                            No collaborations in this category.
                                        </CardContent>
                                    </Card>
                                ) : (
                                    getCollabsForTab(tab).map(collab => (
                                        <CollabCard
                                            key={collab.id}
                                            collab={collab}
                                            myProfileIds={myProfileIds}
                                            profileMap={profileMap}
                                            isAwaitingMyConfirmation={tab === 'awaiting_mine'}
                                            onConfirm={handleConfirm}
                                            onReject={handleReject}
                                        />
                                    ))
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </main>
            <Footer />
        </div>
    );
}
