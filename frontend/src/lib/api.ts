import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface Profile {
    id: string;
    user_id: string;
    role: 'creator' | 'organization' | 'admin';
    name: string;
    title: string | null;
    industry: string; // Required - Primary industry
    niche: string; // Required - Specific niche/specialization
    city: string; // Required - City name
    country: string; // Required - Country code (e.g., 'PK', 'US')
    phone: string; // Required - Phone number with country code
    location: string | null; // Kept for backward compatibility
    bio: string | null;
    avatar_url: string | null;
    video_intro_url: string | null;
    collaboration_types: string[];
    social_links: Record<string, any>; // Can be string URL or verification data object
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

export interface ProfileFilters {
    search?: string;
    city?: string;
    country?: string; // Filter by country code
    industry?: string; // Filter by industry
    niche?: string; // Filter by niche
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
    async getMyProfile(userId: string): Promise<Profile | null> {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await fetch(`${API_BASE}/profiles/me?user_id=${userId}`, {
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

    // Get all approved profiles with optional filters
    async getAll(filters: ProfileFilters = {}): Promise<Profile[]> {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.city) params.set('city', filters.city);
        if (filters.country) params.set('country', filters.country);
        if (filters.industry) params.set('industry', filters.industry);
        if (filters.niche) params.set('niche', filters.niche);
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
    from_user_id: string;
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
