import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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
    // Deprecated - kept for backward compatibility
    role?: string;
    industry?: string;
    niche?: string;
    location?: string | null;
    social_links?: Record<string, any>;
    verified_socials?: string[];
    gigs_completed?: number;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export interface Niche {
    id: string;
    category_id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

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
}

async function getAuthHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

export const profileApi = {
    // Get current user's profile
    async getMyProfile(userId: string, profileType?: string): Promise<Profile | null> {
        try {
            const authHeaders = await getAuthHeaders();
            let url = `${API_BASE}/profiles/me?user_id=${userId}`;
            if (profileType) url += `&profile_type=${profileType}`;
            const response = await fetch(url, {
                headers: { ...authHeaders }
            });

            if (response.status === 404) {
                return null;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            return response.json();
        } catch (error) {
            console.error('Error fetching my profile:', error);
            return null;
        }
    },

    // Get all profiles for a user (creator + org)
    async getAllByUserId(userId: string): Promise<Profile[]> {
        return fetchWithError<Profile[]>(`${API_BASE}/profiles/user/${userId}`);
    },

    // Get all approved profiles with optional filters
    async getAll(filters: ProfileFilters = {}): Promise<Profile[]> {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.city) params.set('city', filters.city);
        if (filters.country) params.set('country', filters.country);
        if (filters.category_id) params.set('category_id', filters.category_id);
        if (filters.niche_id) params.set('niche_id', filters.niche_id);
        if (filters.profile_type) params.set('profile_type', filters.profile_type);
        if (filters.minFollowers) params.set('minFollowers', filters.minFollowers.toString());
        if (filters.maxFollowers) params.set('maxFollowers', filters.maxFollowers.toString());
        if (filters.collaborationType) params.set('collaborationType', filters.collaborationType);

        const queryString = params.toString();
        const url = `${API_BASE}/profiles${queryString ? `?${queryString}` : ''}`;

        return fetchWithError<Profile[]>(url);
    },

    // Get single profile by ID
    async getById(id: string): Promise<Profile> {
        return fetchWithError<Profile>(`${API_BASE}/profiles/${id}`);
    },

    // Create new profile
    async create(profile: Partial<Profile>): Promise<Profile> {
        return fetchWithError<Profile>(`${API_BASE}/profiles`, {
            method: 'POST',
            body: JSON.stringify(profile),
        });
    },

    // Update profile
    async update(id: string, updates: Partial<Profile>): Promise<Profile> {
        return fetchWithError<Profile>(`${API_BASE}/profiles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },

    // Delete profile
    async delete(id: string): Promise<void> {
        const authHeaders = await getAuthHeaders();
        await fetch(`${API_BASE}/profiles/${id}`, {
            method: 'DELETE',
            headers: { ...authHeaders }
        });
    },
};

export const adminApi = {
    // Get pending profiles
    async getPending(): Promise<Profile[]> {
        return fetchWithError<Profile[]>(`${API_BASE}/admin/pending`);
    },

    // Approve profile
    async approve(id: string): Promise<Profile> {
        return fetchWithError<Profile>(`${API_BASE}/admin/approve/${id}`, {
            method: 'POST',
        });
    },

    // Reject profile
    async reject(id: string): Promise<Profile> {
        return fetchWithError<Profile>(`${API_BASE}/admin/reject/${id}`, {
            method: 'POST',
        });
    },

    // Delete profile
    async delete(id: string): Promise<void> {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${API_BASE}/admin/delete/${id}`, {
            method: 'DELETE',
            headers: { ...authHeaders }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Delete failed' }));
            throw new Error(error.error || 'Failed to delete profile');
        }
    },
};

export interface UploadResult {
    success: boolean;
    url: string;
    path: string;
}

export const uploadApi = {
    // Upload profile photo
    async uploadPhoto(userId: string, file: File): Promise<UploadResult> {
        const authHeaders = await getAuthHeaders();
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('user_id', userId);

        const response = await fetch(`${API_BASE}/upload/photo`, {
            method: 'POST',
            body: formData,
            headers: { ...authHeaders } // FormData handles Content-Type boundary
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    },

    // Upload video intro
    async uploadVideo(userId: string, file: File): Promise<UploadResult> {
        const authHeaders = await getAuthHeaders();
        const formData = new FormData();
        formData.append('video', file);
        formData.append('user_id', userId);

        const response = await fetch(`${API_BASE}/upload/video`, {
            method: 'POST',
            body: formData,
            headers: { ...authHeaders }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    },
};

// YouTube verification result interface
export interface YouTubeVerificationResult {
    success: boolean;
    channelId: string | null;
    channelTitle: string | null;
    subscribers: number | null;
    status: 'VERIFIED' | 'HIDDEN' | 'NOT_FOUND' | 'FAILED';
    error?: string;
}

export interface InstagramVerificationResult {
    success: boolean;
    username: string | null;
    followers: number | null;
    status: 'VALIDATED' | 'PRIVATE' | 'PENDING' | 'FAILED';
    error?: string;
}

export interface VerificationStatus {
    youtube: {
        status: string;
        subscribers: number | null;
        lastUpdated: string;
    } | null;
    instagram: {
        status: string;
        followers: number | null;
        lastUpdated: string;
    } | null;
}

export const verificationApi = {
    // Verify YouTube channel
    async verifyYouTube(channelUrl: string, profileId?: string): Promise<YouTubeVerificationResult> {
        return fetchWithError<YouTubeVerificationResult>(`${API_BASE}/verify/youtube`, {
            method: 'POST',
            body: JSON.stringify({ channelUrl, profileId }),
        });
    },

    // Queue Instagram verification (background processing)
    async verifyInstagram(profileUrl: string, profileId?: string): Promise<InstagramVerificationResult> {
        return fetchWithError<InstagramVerificationResult>(`${API_BASE}/verify/instagram`, {
            method: 'POST',
            body: JSON.stringify({ profileUrl, profileId }),
        });
    },

    // Get verification status for a profile
    async getStatus(profileId: string): Promise<VerificationStatus> {
        return fetchWithError<VerificationStatus>(`${API_BASE}/profiles/${profileId}/verifications`);
    },
};

// Review interface
export interface Review {
    id: string;
    profile_id: string;
    reviewer_user_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer_name: string;
    reviewer_avatar: string | null;
}

// Reviews API
export const reviewsApi = {
    // Get all reviews for a profile
    async getByProfileId(profileId: string): Promise<Review[]> {
        return fetchWithError<Review[]>(`${API_BASE}/reviews/${profileId}`);
    },

    // Create a new review (requires auth + approved profile)
    async create(review: { profile_id: string; rating: number; comment?: string }): Promise<Review> {
        return fetchWithError<Review>(`${API_BASE}/reviews`, {
            method: 'POST',
            body: JSON.stringify(review),
        });
    },
};

// ============= CATEGORY API =============
export const categoryApi = {
    async getAll(): Promise<Category[]> {
        return fetchWithError<Category[]>(`${API_BASE}/categories`);
    },

    async getNichesByCategory(categoryId: string): Promise<Niche[]> {
        return fetchWithError<Niche[]>(`${API_BASE}/categories/${categoryId}/niches`);
    },

    async getAllNiches(categoryId?: string): Promise<Niche[]> {
        const url = categoryId
            ? `${API_BASE}/niches?category_id=${categoryId}`
            : `${API_BASE}/niches`;
        return fetchWithError<Niche[]>(url);
    },
};

// ============= SOCIAL ACCOUNT API =============
export const socialAccountApi = {
    async getByProfileId(profileId: string): Promise<SocialAccount[]> {
        return fetchWithError<SocialAccount[]>(`${API_BASE}/profiles/${profileId}/social-accounts`);
    },
};
