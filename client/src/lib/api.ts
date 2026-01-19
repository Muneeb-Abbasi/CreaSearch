// API service for frontend to communicate with backend

const API_BASE = '/api';

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

export interface ProfileFilters {
    search?: string;
    city?: string;
    minFollowers?: number;
    maxFollowers?: number;
    collaborationType?: string;
}

async function fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
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
            const response = await fetch(`${API_BASE}/profiles/me?user_id=${userId}`);
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
        await fetch(`${API_BASE}/profiles/${id}`, { method: 'DELETE' });
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
};
