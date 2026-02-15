import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let serverClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (!serverClient) {
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase credentials not configured');
        }
        serverClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return serverClient;
}

// Profile type
export interface Profile {
    id: string;
    user_id: string;
    profile_type: 'creator' | 'organization';
    name: string;
    title: string | null;
    category_id: string | null;
    niche_id: string | null;
    city: string;
    country: string;
    phone: string;
    bio: string | null;
    avatar_url: string | null;
    video_intro_url: string | null;
    collaboration_types: string[];
    follower_total: number;
    profile_completion: number;
    rating_score: number;
    creasearch_score: number;
    review_count: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    // Deprecated fields - kept temporarily for backward compatibility
    role?: string;
    industry?: string;
    niche?: string;
    location?: string | null;
    social_links?: Record<string, any>;
    verified_socials?: string[];
    gigs_completed?: number;
    // Joined data (populated by queries)
    category?: Category;
    niche_data?: Niche;
    social_accounts?: SocialAccount[];
}

// Category type
export interface Category {
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

// Niche type
export interface Niche {
    id: string;
    category_id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

// Social Account type
export interface SocialAccount {
    id: string;
    profile_id: string;
    platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'facebook' | 'other';
    platform_url: string;
    platform_username: string | null;
    platform_user_id: string | null;
    verification_status: 'unverified' | 'pending' | 'verified' | 'failed';
    follower_count: number;
    following_count: number;
    post_count: number;
    display_name: string | null;
    raw_data: Record<string, any>;
    verified_at: string | null;
    last_refreshed_at: string | null;
    created_at: string;
}

// Profile filters
export interface ProfileFilters {
    search?: string;
    city?: string;
    country?: string;
    category_id?: string;
    niche_id?: string;
    profile_type?: 'creator' | 'organization';
    minFollowers?: number;
    maxFollowers?: number;
    collaborationType?: string;
    status?: 'pending' | 'approved' | 'rejected';
    // Keep old filter names for backward compatibility
    industry?: string;
    niche?: string;
}

// Database service for profiles
export const profileService = {
    async getAll(filters: ProfileFilters = {}): Promise<Profile[]> {
        const supabase = getSupabaseClient();
        let query;

        // Start with RPC if search is present, otherwise standard select
        if (filters.search) {
            query = supabase.rpc('search_profiles', { query_text: filters.search });
        } else {
            query = supabase.from('profiles').select('*');
        }

        // Apply filters to the result (RPC returns SETOF profiles, so chaining works)
        query = query.eq('status', filters.status || 'approved');

        // Reuse existing filter logic (filters.search is already handled above/ignored here)
        // if (filters.search) { ... } -> Removed manual ilike search

        if (filters.country) {
            query = query.eq('country', filters.country);
        }

        if (filters.city) {
            query = query.eq('city', filters.city);
        }

        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id);
        }

        if (filters.niche_id) {
            query = query.eq('niche_id', filters.niche_id);
        }

        if (filters.profile_type) {
            query = query.eq('profile_type', filters.profile_type);
        }

        if (filters.minFollowers) {
            query = query.gte('follower_total', filters.minFollowers);
        }

        if (filters.maxFollowers) {
            query = query.lte('follower_total', filters.maxFollowers);
        }

        if (filters.collaborationType) {
            query = query.contains('collaboration_types', [filters.collaborationType]);
        }

        const { data, error } = await query.order('creasearch_score', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Profile | null> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async getByUserId(userId: string, profileType?: string): Promise<Profile | null> {
        const supabase = getSupabaseClient();
        let query = supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId);

        if (profileType) {
            query = query.eq('profile_type', profileType);
        }

        // Order by status to prioritize approved profiles when user has multiple
        const { data, error } = await query
            .order('status', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getAllByUserId(userId: string): Promise<Profile[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async create(profile: Partial<Profile>): Promise<Profile> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('profiles')
            .insert(profile)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Profile>): Promise<Profile> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const supabase = getSupabaseClient();
        console.log(`[DB] Deleting profile with id: ${id}`);

        const { data, error, count } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)
            .select();

        console.log(`[DB] Delete result - data:`, data, `error:`, error);

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log(`[DB] Warning: No rows were deleted for id: ${id}`);
        }
    },

    async getPending(): Promise<Profile[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async approve(id: string): Promise<Profile> {
        return this.update(id, { status: 'approved' });
    },

    async reject(id: string): Promise<Profile> {
        return this.update(id, { status: 'rejected' });
    }
};

// Review type
export interface Review {
    id: string;
    profile_id: string;
    reviewer_user_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer_name?: string; // Joined from profiles
    reviewer_avatar?: string; // Joined from profiles
}

// Database service for reviews
export const reviewService = {
    async getByProfileId(profileId: string): Promise<Review[]> {
        const supabase = getSupabaseClient();

        // Get reviews and join with profiles to get reviewer info
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get reviewer profiles for display names
        if (reviews && reviews.length > 0) {
            const userIds = [...new Set(reviews.map(r => r.reviewer_user_id))];
            const { data: reviewerProfiles } = await supabase
                .from('profiles')
                .select('user_id, name, avatar_url')
                .in('user_id', userIds);

            const profileMap = new Map(reviewerProfiles?.map(p => [p.user_id, p]) || []);

            return reviews.map(review => ({
                ...review,
                reviewer_name: profileMap.get(review.reviewer_user_id)?.name || 'Anonymous',
                reviewer_avatar: profileMap.get(review.reviewer_user_id)?.avatar_url || null
            }));
        }

        return reviews || [];
    },

    async create(review: { profile_id: string; reviewer_user_id: string; rating: number; comment?: string }): Promise<Review> {
        const supabase = getSupabaseClient();

        // Check if reviewer has an approved profile (verified user)
        const { data: reviewerProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, status')
            .eq('user_id', review.reviewer_user_id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        if (!reviewerProfile || reviewerProfile.status !== 'approved') {
            throw new Error('Only verified users with approved profiles can leave reviews');
        }

        // Check if the user is trying to review their own profile
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', review.profile_id)
            .single();

        if (targetProfile && targetProfile.user_id === review.reviewer_user_id) {
            throw new Error('You cannot review your own profile');
        }

        // Check if user has already reviewed this profile
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('profile_id', review.profile_id)
            .eq('reviewer_user_id', review.reviewer_user_id)
            .single();

        if (existingReview) {
            throw new Error('You have already reviewed this profile');
        }

        // Create the review
        const { data, error } = await supabase
            .from('reviews')
            .insert(review)
            .select()
            .single();

        if (error) throw error;

        // Update profile's average rating
        await this.updateProfileRating(review.profile_id);

        return data;
    },

    async updateProfileRating(profileId: string): Promise<void> {
        const supabase = getSupabaseClient();

        // Calculate average rating
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('rating')
            .eq('profile_id', profileId);

        if (error) throw error;

        if (reviews && reviews.length > 0) {
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            await supabase
                .from('profiles')
                .update({ rating_score: Math.round(avgRating * 100) / 100 })
                .eq('id', profileId);
        }

        // Update Creasearch score after rating change
        await scoringService.updateProfileScore(profileId);
    },

    async delete(reviewId: string, userId: string): Promise<void> {
        const supabase = getSupabaseClient();

        // Only allow the reviewer to delete their own review
        const { data: review, error: fetchError } = await supabase
            .from('reviews')
            .select('reviewer_user_id')
            .eq('id', reviewId)
            .single();

        if (fetchError) throw fetchError;
        if (!review || review.reviewer_user_id !== userId) {
            throw new Error('You can only delete your own reviews');
        }

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) throw error;
    }
};

// Scoring Service - Calculates and updates Creasearch Score
export const scoringService = {
    /**
     * Calculate Creasearch Score (0-100) based on 5 factors:
     * 1. Profile Completion (30 pts)
     * 2. Social Verification (20 pts) - YouTube & Instagram only
     * 3. Follower Count (25 pts) - From verified accounts
     * 4. Reputation (25 pts) - Reviews
     * 5. Collaborations (10 pts bonus) - Approved collaborations
     */
    calculateScore(profile: Profile, socialAccounts: SocialAccount[] = [], reviewCount: number = 0): number {
        let score = 0;

        // 1. Profile Completion (Max 30 points)
        if (profile.name) score += 2;
        if (profile.title) score += 2;
        if (profile.category_id) score += 2;
        if (profile.niche_id) score += 2;
        if (profile.city) score += 1.5;
        if (profile.country) score += 1.5;
        if (profile.phone) score += 2;
        if (profile.bio && profile.bio.length >= 100) score += 5;
        if (profile.avatar_url) score += 6;
        if (profile.video_intro_url) score += 6;

        // 2. Social Verification (Max 20 points) - YouTube & Instagram only
        const youtube = socialAccounts.find(sa => sa.platform === 'youtube');
        const instagram = socialAccounts.find(sa => sa.platform === 'instagram');
        if (youtube?.verification_status === 'verified') score += 10;
        if (instagram?.verification_status === 'verified') score += 10;

        // 3. Follower Count (Max 25 points) - From verified accounts
        const followers = profile.follower_total || 0;
        if (followers >= 500000) score += 25;
        else if (followers >= 100000) score += 20;
        else if (followers >= 50000) score += 15;
        else if (followers >= 10000) score += 10;
        else if (followers >= 1000) score += 5;

        // 4. Reputation (Max 25 points) - Reviews
        const avgRating = profile.rating_score || 0;
        const ratingPoints = Math.min(avgRating * 4, 20); // Max 20 from rating (5 stars × 4)
        const reviewPoints = Math.min(reviewCount / 2, 5); // Max 5 from review count
        score += ratingPoints + reviewPoints;

        // 5. Collaborations (Max 10 bonus points)
        const collabCount = (profile as any).collaboration_count || 0;
        score += Math.min(collabCount * 2, 10); // 2 pts per collab, max 10

        return Math.round(Math.min(score, 100)); // Cap at 100
    },

    async updateProfileScore(profileId: string): Promise<number> {
        const supabase = getSupabaseClient();

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (profileError || !profile) {
            console.error('Error fetching profile for scoring:', profileError);
            return 0;
        }

        // Fetch social accounts for this profile
        const socialAccounts = await socialAccountService.getByProfileId(profileId);

        // Count reviews
        const { count: reviewCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profileId);

        // Calculate score
        const newScore = this.calculateScore(profile, socialAccounts, reviewCount || 0);

        // Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ creasearch_score: newScore })
            .eq('id', profileId);

        if (updateError) {
            console.error('Error updating creasearch score:', updateError);
        }

        return newScore;
    },

    async recalculateAllScores(): Promise<void> {
        const supabase = getSupabaseClient();

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('status', 'approved');

        if (error || !profiles) {
            console.error('Error fetching profiles for recalculation:', error);
            return;
        }

        for (const profile of profiles) {
            await this.updateProfileScore(profile.id);
        }
        console.log(`[Scoring] Recalculated scores for ${profiles.length} profiles`);
    }
};

// ============= CATEGORY SERVICE =============
export const categoryService = {
    async getAll(): Promise<Category[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Category | null> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async getNichesByCategory(categoryId: string): Promise<Niche[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('niches')
            .select('*')
            .eq('category_id', categoryId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getAllNiches(): Promise<Niche[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('niches')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }
};

// ============= SOCIAL ACCOUNT SERVICE =============
export const socialAccountService = {
    async getByProfileId(profileId: string): Promise<SocialAccount[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('profile_id', profileId)
            .order('platform', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async upsert(profileId: string, account: Partial<SocialAccount>): Promise<SocialAccount> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('social_accounts')
            .upsert(
                { ...account, profile_id: profileId },
                { onConflict: 'profile_id,platform' }
            )
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateVerification(
        profileId: string,
        platform: string,
        verificationData: Partial<SocialAccount>
    ): Promise<SocialAccount> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('social_accounts')
            .update({
                ...verificationData,
                last_refreshed_at: new Date().toISOString()
            })
            .eq('profile_id', profileId)
            .eq('platform', platform)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(profileId: string, platform: string): Promise<void> {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('social_accounts')
            .delete()
            .eq('profile_id', profileId)
            .eq('platform', platform);

        if (error) throw error;
    }
};

// ============================================
// Notification types and service
// ============================================

export interface Notification {
    id: string;
    user_id: string;
    type: 'profile_approved' | 'profile_rejected' | 'new_inquiry' | 'new_review' | 'verification_complete' | 'admin_announcement' | 'profile_featured';
    title: string;
    message: string | null;
    metadata: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

export const notificationService = {
    async getByUserId(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    },

    async getUnreadCount(userId: string): Promise<number> {
        const supabase = getSupabaseClient();
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    async markAsRead(notificationId: string, userId: string): Promise<void> {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    async markAllAsRead(userId: string): Promise<void> {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    },

    async create(notification: Omit<Notification, 'id' | 'is_read' | 'created_at'>): Promise<Notification> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ============================================
// Admin Action Log types and service
// ============================================

export interface AdminActionLog {
    id: string;
    admin_user_id: string;
    action: string;
    target_type: 'profile' | 'user' | 'review' | 'category' | 'niche';
    target_id: string;
    details: Record<string, any>;
    created_at: string;
}

export const adminActionLogService = {
    async create(log: Omit<AdminActionLog, 'id' | 'created_at'>): Promise<AdminActionLog> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('admin_action_log')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAll(limit = 50, offset = 0): Promise<AdminActionLog[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('admin_action_log')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    }
};

// ============================================
// Featured Profiles types and service
// ============================================

export interface FeaturedProfile {
    id: string;
    profile_id: string;
    featured_by: string;
    sort_order: number;
    featured_at: string;
    expires_at: string | null;
}

export const featuredProfileService = {
    async getAll(): Promise<FeaturedProfile[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('featured_profiles')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async create(featured: { profile_id: string; featured_by: string; sort_order?: number; expires_at?: string }): Promise<FeaturedProfile> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('featured_profiles')
            .insert(featured)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(profileId: string): Promise<void> {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('featured_profiles')
            .delete()
            .eq('profile_id', profileId);

        if (error) throw error;
    }
};

// ============================================
// Collaboration types and service
// ============================================

export interface Collaboration {
    id: string;
    requester_profile_id: string;
    partner_profile_id: string;
    description: string;
    proof_url: string | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes: string | null;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

export const collaborationService = {
    async create(collab: Omit<Collaboration, 'id' | 'status' | 'admin_notes' | 'approved_by' | 'approved_at' | 'created_at' | 'updated_at'>): Promise<Collaboration> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('collaborations')
            .insert(collab)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getById(id: string): Promise<Collaboration | null> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('collaborations')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getByProfileId(profileId: string): Promise<Collaboration[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('collaborations')
            .select('*')
            .or(`requester_profile_id.eq.${profileId},partner_profile_id.eq.${profileId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getPending(): Promise<Collaboration[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('collaborations')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async approve(id: string, adminUserId: string, adminNotes?: string): Promise<Collaboration> {
        const supabase = getSupabaseClient();

        // Get the collaboration first
        const collab = await this.getById(id);
        if (!collab) throw new Error('Collaboration not found');
        if (collab.status !== 'pending') throw new Error('Collaboration is not pending');

        // Update collaboration status
        const { data, error } = await supabase
            .from('collaborations')
            .update({
                status: 'approved',
                approved_by: adminUserId,
                approved_at: new Date().toISOString(),
                admin_notes: adminNotes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Increment collaboration_count for both profiles
        await supabase.rpc('increment_collab_count', { profile_id_param: collab.requester_profile_id });
        await supabase.rpc('increment_collab_count', { profile_id_param: collab.partner_profile_id });

        return data;
    },

    async reject(id: string, adminUserId: string, adminNotes?: string): Promise<Collaboration> {
        const supabase = getSupabaseClient();

        const collab = await this.getById(id);
        if (!collab) throw new Error('Collaboration not found');
        if (collab.status !== 'pending') throw new Error('Collaboration is not pending');

        const { data, error } = await supabase
            .from('collaborations')
            .update({
                status: 'rejected',
                approved_by: adminUserId,
                admin_notes: adminNotes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
