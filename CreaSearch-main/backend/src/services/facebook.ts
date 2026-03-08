/**
 * Facebook Verification Service
 * ===============================
 * Verifies Facebook profile/page follower counts using Apify API.
 */

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN;
const REQUEST_TIMEOUT = 120000; // 120 seconds
import { logger } from '../utils/logger';

export type FacebookStatus = 'VALIDATED' | 'NOT_FOUND' | 'FAILED' | 'PENDING';

export interface FacebookVerificationResult {
    url: string;
    followers: number | null;
    pageName: string | null;
    status: FacebookStatus;
    error?: string;
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
            logger.error(`[Facebook] Apify error: ${response.status} ${response.statusText}`);
            return [];
        }

        return await response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            logger.error('[Facebook] Apify request timed out');
        } else {
            logger.error('[Facebook] Apify error:', error.message);
        }
        return [];
    }
}

/**
 * Verify a Facebook profile/page and get follower count
 * 
 * Uses Apify's facebook-pages-scraper
 * 
 * @param profileUrl - The Facebook profile/page URL
 * @returns FacebookVerificationResult with follower count and status
 */
export async function verifyFacebookProfile(profileUrl: string): Promise<FacebookVerificationResult> {
    if (!APIFY_TOKEN) {
        logger.error('[Facebook] Apify token not configured');
        return {
            url: profileUrl,
            followers: null,
            pageName: null,
            status: 'FAILED',
            error: 'Apify token not configured'
        };
    }

    const payload = {
        startUrls: [{ url: profileUrl }],
        resultsLimit: 1
    };

    let data = await runApifyActor('apify~facebook-pages-scraper', payload);

    if (data.length > 0) {
        const item = data[0];

        // Based on typical scraping, there might be 'followers' or similar keys
        const followers = item.followers || item.likes || null;
        const pageName = item.title || item.name || null;

        if (followers !== null) {
            return {
                url: profileUrl,
                followers,
                pageName,
                status: 'VALIDATED'
            };
        }
    }

    // Could not retrieve profile data
    return {
        url: profileUrl,
        followers: null,
        pageName: null,
        status: 'FAILED',
        error: 'Could not retrieve profile data'
    };
}

/**
 * Queue a Facebook profile for background verification
 */
export async function queueFacebookVerification(
    profileId: string,
    profileUrl: string
): Promise<{ queued: boolean; message: string }> {
    try {
        const { verificationQueueService } = await import('./verification-queue');
        await verificationQueueService.enqueue(profileId, 'facebook', profileUrl, 'initial');
        return {
            queued: true,
            message: 'Facebook verification queued.'
        };
    } catch (error: any) {
        logger.error('[Facebook] Failed to enqueue verification:', error.message);
        return {
            queued: false,
            message: `Failed to queue verification: ${error.message}`
        };
    }
}
