import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { collaborationApi, profileApi, type Profile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CollaborationSubmitPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [myProfiles, setMyProfiles] = useState<Profile[]>([]);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [isExternal, setIsExternal] = useState(false);

    // Form state
    const [requesterProfileId, setRequesterProfileId] = useState('');
    const [partnerProfileId, setPartnerProfileId] = useState('');
    const [title, setTitle] = useState('');
    const [campaignName, setCampaignName] = useState('');
    const [dateRange, setDateRange] = useState('');
    const [description, setDescription] = useState('');
    const [proofUrls, setProofUrls] = useState<string[]>(['']);
    const [externalPartnerName, setExternalPartnerName] = useState('');
    const [externalPartnerUrl, setExternalPartnerUrl] = useState('');

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                navigate('/login');
                return;
            }
            setUserId(session.user.id);

            // Load user's own profiles
            const profiles = await profileApi.getAllByUserId(session.user.id);
            const approvedProfiles = profiles.filter(p => p.status === 'approved');
            setMyProfiles(approvedProfiles);
            if (approvedProfiles.length > 0) {
                setRequesterProfileId(approvedProfiles[0].id);
            }

            // Load all profiles for partner selection
            const all = await profileApi.getAll();
            setAllProfiles(all);
        };
        init();
    }, [navigate]);

    const addProofUrl = () => {
        setProofUrls([...proofUrls, '']);
    };

    const removeProofUrl = (index: number) => {
        if (proofUrls.length > 1) {
            setProofUrls(proofUrls.filter((_, i) => i !== index));
        }
    };

    const updateProofUrl = (index: number, value: string) => {
        const updated = [...proofUrls];
        updated[index] = value;
        setProofUrls(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validProofUrls = proofUrls.filter(url => url.trim() !== '');

        if (validProofUrls.length === 0) {
            toast({ title: 'Error', description: 'At least one proof URL is required', variant: 'destructive' });
            return;
        }

        if (!requesterProfileId) {
            toast({ title: 'Error', description: 'Please select your profile', variant: 'destructive' });
            return;
        }

        if (!isExternal && !partnerProfileId) {
            toast({ title: 'Error', description: 'Please select a collaboration partner', variant: 'destructive' });
            return;
        }

        if (isExternal && !externalPartnerName.trim()) {
            toast({ title: 'Error', description: 'External partner name is required', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            await collaborationApi.create({
                requester_profile_id: requesterProfileId,
                partner_profile_id: isExternal ? undefined : partnerProfileId,
                title: title || undefined,
                campaign_name: campaignName || undefined,
                date_range: dateRange || undefined,
                description,
                proof_urls: validProofUrls,
                is_external: isExternal,
                external_partner_name: isExternal ? externalPartnerName : undefined,
                external_partner_url: isExternal ? externalPartnerUrl : undefined,
            });

            toast({
                title: 'Success!',
                description: isExternal
                    ? 'Collaboration submitted for admin review.'
                    : 'Collaboration request sent to your partner for confirmation.',
            });
            navigate('/collaborations');
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to submit collaboration',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Filter out own profiles from partner list
    const partnerOptions = allProfiles.filter(
        p => !myProfiles.some(mp => mp.id === p.id)
    );

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Submit Collaboration Request</CardTitle>
                        <CardDescription>
                            Provide details and proof of your collaboration. {!isExternal && 'Your partner will need to confirm before admin review.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Your Profile */}
                            <div className="space-y-2">
                                <Label htmlFor="requester-profile">Your Profile</Label>
                                <Select value={requesterProfileId} onValueChange={setRequesterProfileId}>
                                    <SelectTrigger id="requester-profile">
                                        <SelectValue placeholder="Select your profile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myProfiles.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} ({p.profile_type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {myProfiles.length === 0 && (
                                    <p className="text-sm text-destructive">
                                        You need an approved profile to submit collaborations.
                                    </p>
                                )}
                            </div>

                            {/* External toggle */}
                            <div className="flex items-center space-x-3">
                                <Switch
                                    id="external-toggle"
                                    checked={isExternal}
                                    onCheckedChange={setIsExternal}
                                />
                                <Label htmlFor="external-toggle">
                                    Partner is not on Creasearch (external collaboration)
                                </Label>
                            </div>

                            {/* Partner Selection */}
                            {!isExternal ? (
                                <div className="space-y-2">
                                    <Label htmlFor="partner-profile">Collaboration Partner</Label>
                                    <Select value={partnerProfileId} onValueChange={setPartnerProfileId}>
                                        <SelectTrigger id="partner-profile">
                                            <SelectValue placeholder="Search and select partner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {partnerOptions.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} ({p.profile_type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ext-name">External Partner Name *</Label>
                                        <Input
                                            id="ext-name"
                                            value={externalPartnerName}
                                            onChange={e => setExternalPartnerName(e.target.value)}
                                            placeholder="e.g. Nike, Samsung..."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ext-url">External Partner URL (optional)</Label>
                                        <Input
                                            id="ext-url"
                                            value={externalPartnerUrl}
                                            onChange={e => setExternalPartnerUrl(e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="collab-title">Collaboration Title</Label>
                                <Input
                                    id="collab-title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Product Review Video for XYZ Brand"
                                />
                            </div>

                            {/* Campaign Name */}
                            <div className="space-y-2">
                                <Label htmlFor="campaign-name">Campaign / Project Name</Label>
                                <Input
                                    id="campaign-name"
                                    value={campaignName}
                                    onChange={e => setCampaignName(e.target.value)}
                                    placeholder="e.g. Summer 2026 Campaign"
                                />
                            </div>

                            {/* Date Range */}
                            <div className="space-y-2">
                                <Label htmlFor="date-range">Date / Time Period</Label>
                                <Input
                                    id="date-range"
                                    value={dateRange}
                                    onChange={e => setDateRange(e.target.value)}
                                    placeholder="e.g. Jan 2026 - Mar 2026"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Describe the collaboration..."
                                    required
                                    rows={4}
                                />
                            </div>

                            {/* Proof URLs */}
                            <div className="space-y-3">
                                <Label>Proof Links * (YouTube, Google Drive, LinkedIn, Campaign URL, etc.)</Label>
                                {proofUrls.map((url, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={url}
                                            onChange={e => updateProofUrl(index, e.target.value)}
                                            placeholder="https://..."
                                            className="flex-1"
                                        />
                                        {proofUrls.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeProofUrl(index)}
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={addProofUrl}>
                                    + Add Another Proof Link
                                </Button>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading || myProfiles.length === 0}
                                    className="flex-1"
                                >
                                    {loading ? 'Submitting...' : 'Submit Collaboration Request'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/collaborations')}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
