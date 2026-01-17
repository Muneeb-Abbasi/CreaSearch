import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Some features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export type Profile = {
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
};

export type Inquiry = {
    id: string;
    from_user_id: string;
    to_profile_id: string;
    message: string;
    collaboration_type: string | null;
    date_range: string | null;
    status: 'new' | 'in_discussion' | 'accepted' | 'declined';
    created_at: string;
};

export type PortfolioItem = {
    id: string;
    profile_id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    tags: string[];
    created_at: string;
};

export type Review = {
    id: string;
    profile_id: string;
    from_user_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
};
