/**
 * Instagram Verification Service
 * ===============================
 * Verifies Instagram profile follower counts using Apify API.
 * 
 * Note: Instagram verification should be used sparingly due to Apify quota limits.
 * Recommended: Queue verification for background processing, not real-time.
 * 
 * Usage:
 *   import { verifyInstagramProfile } from './instagram';
 *   const result = await verifyInstagramProfile('https://instagram.com/username');
 */

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN;
const REQUEST_TIMEOUT = 120000; // 120 seconds
import { logger } from '../utils/logger';

export type InstagramStatus = 'VALIDATED' | 'PRIVATE' | 'NOT_FOUND' | 'FAILED' | 'PENDING';

export interface InstagramVerificationResult {
    username: string | null;
    followers: number | null;
    following: number | null;
    posts: number | null;
    fullName: string | null;
    isPrivate: boolean;
    status: InstagramStatus;
    error?: string;
}

/**
 * Extract username from Instagram profile URL
 */
export function extractInstagramUsername(url: string): string | null {
    try {
        const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
        const match = cleanUrl.match(/instagram\.com\/([^/?]+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Run an Apify actor and return results
 */
async function runApifyActor(actorId: string, payload: Record<string, any>): Promise<any[]> {
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${url}?token=${APIFY_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            logger.error(`[Instagram] Apify error: ${response.status} ${response.statusText}`);
            return [];
        }

        return await response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            logger.error('[Instagram] Apify request timed out');
        } else {
            logger.error('[Instagram] Apify error:', error.message);
        }
        return [];
    }
}

/**
 * Verify an Instagram profile and get follower count
 * 
 * Uses Apify's instagram-api-scraper with fallback to instagram-scraper
 * 
 * @param profileUrl - The Instagram profile URL
 * @returns InstagramVerificationResult with follower count and status
 */
export async function verifyInstagramProfile(profileUrl: string): Promise<InstagramVerificationResult> {
    if (!APIFY_TOKEN) {
        logger.error('[Instagram] Apify token not configured');
        return {
            username: null,
            followers: null,
            following: null,
            posts: null,
            fullName: null,
            isPrivate: false,
            status: 'FAILED',
            error: 'Apify token not configured'
        };
    }

    const username = extractInstagramUsername(profileUrl);

    // Primary actor: Instagram API Scraper
    const primaryPayload = {
        directUrls: [profileUrl],
        resultsType: 'details',
        resultsLimit: 1
    };

    let data = await runApifyActor('apify~instagram-api-scraper', primaryPayload);

    if (data.length > 0) {
        const item = data[0];

        if (item.isPrivate) {
            return {
                username: item.username || username,
                followers: null,
                following: null,
                posts: null,
                fullName: item.fullName || null,
                isPrivate: true,
                status: 'PRIVATE',
                error: 'Account is private'
            };
        }

        const followers = item.followersCount || item.followers ||
            item.edge_followed_by?.count || null;

        if (followers !== null) {
            return {
                username: item.username || username,
                followers,
                following: item.followingCount || item.following || null,
                posts: item.postsCount || item.posts || null,
                fullName: item.fullName || null,
                isPrivate: false,
                status: 'VALIDATED'
            };
        }
    }

    // Fallback actor: Instagram Scraper (search by username)
    if (username) {
        const fallbackPayload = {
            search: username,
            resultsLimit: 1
        };

        data = await runApifyActor('apify~instagram-scraper', fallbackPayload);

        if (data.length > 0) {
            const item = data[0];

            if (item.isPrivate) {
                return {
                    username: item.username || username,
                    followers: null,
                    following: null,
                    posts: null,
                    fullName: item.fullName || null,
                    isPrivate: true,
                    status: 'PRIVATE',
                    error: 'Account is private'
                };
            }

            const followers = item.followersCount || item.followers || null;

            if (followers !== null) {
                return {
                    username: item.username || username,
                    followers,
                    following: item.followingCount || item.following || null,
                    posts: item.postsCount || item.posts || null,
                    fullName: item.fullName || null,
                    isPrivate: false,
                    status: 'VALIDATED'
                };
            }
        }
    }

    // Could not retrieve profile data
    return {
        username,
        followers: null,
        following: null,
        posts: null,
        fullName: null,
        isPrivate: false,
        status: 'FAILED',
        error: 'Could not retrieve profile data'
    };
}

/**
 * Queue an Instagram profile for background verification
 * This is the preferred method to avoid blocking and conserve quota
 */
export async function queueInstagramVerification(
    profileId: string,
    profileUrl: string
): Promise<{ queued: boolean; message: string }> {
    try {
        const { verificationQueueService } = await import('./verification-queue');
        await verificationQueueService.enqueue(profileId, 'instagram', profileUrl, 'initial');
        return {
            queued: true,
            message: 'Instagram verification queued. Will be processed within 4 hours.'
        };
    } catch (error: any) {
        logger.error('[Instagram] Failed to enqueue verification:', error.message);
        return {
            queued: false,
            message: `Failed to queue verification: ${error.message}`
        };
    }
}
