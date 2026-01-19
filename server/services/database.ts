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
    role: 'creator' | 'organization' | 'admin';
    name: string;
    title: string | null;
    location: string | null;
    bio: string | null;
    avatar_url: string | null;
    video_intro_url: string | null;
    collaboration_types: string[];
    social_links: Record<string, string>;
    follower_total: number;
    verified_socials: string[];
    profile_completion: number;
    gigs_completed: number;
    rating_score: number;
    creasearch_score: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

// Profile filters
export interface ProfileFilters {
    search?: string;
    city?: string;
    minFollowers?: number;
    maxFollowers?: number;
    collaborationType?: string;
    status?: 'pending' | 'approved' | 'rejected';
}

// Database service for profiles
export const profileService = {
    async getAll(filters: ProfileFilters = {}): Promise<Profile[]> {
        const supabase = getSupabaseClient();
        let query = supabase
            .from('profiles')
            .select('*')
            .eq('status', filters.status || 'approved');

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
        }

        if (filters.city) {
            query = query.ilike('location', `%${filters.city}%`);
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

    async getByUserId(userId: string): Promise<Profile | null> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        // PGRST116 = no rows returned, which is not an error for us
        if (error && error.code !== 'PGRST116') throw error;
        return data;
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
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
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
