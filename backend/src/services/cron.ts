/**
 * Verification Cron Service
 * ==========================
 * Handles scheduled background tasks for social media verification updates.
 * 
 * Schedule:
 * - YouTube: Weekly refresh (every Sunday at 3 AM)
 * - Instagram: Not auto-refreshed (quota-limited)
 */

import cron from 'node-cron';
import { profileService } from './database';

// Track if cron is already initialized
let cronInitialized = false;

/**
 * Refresh YouTube subscriber count for a single profile
 */
async function refreshYouTubeForProfile(profileId: string, youtubeData: any): Promise<boolean> {
    try {
        const { verifyYouTubeChannel } = await import('./youtube');
        const url = typeof youtubeData === 'string' ? youtubeData : youtubeData.url;

        if (!url) return false;

        const result = await verifyYouTubeChannel(url);

        if (result.status === 'VERIFIED') {
            const profile = await profileService.getById(profileId);
            if (profile) {
                const updatedSocialLinks = {
                    ...profile.social_links,
                    youtube: {
                        ...profile.social_links.youtube,
                        url,
                        channelId: result.channelId,
                        channelTitle: result.channelTitle,
                        subscribers: result.subscribers,
                        status: result.status,
                        lastUpdated: new Date().toISOString()
                    }
                };
                await profileService.update(profileId, { social_links: updatedSocialLinks });
                console.log(`[Cron] Updated YouTube for profile ${profileId}: ${result.subscribers} subscribers`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error(`[Cron] Failed to refresh YouTube for profile ${profileId}:`, error);
        return false;
    }
}

/**
 * Refresh YouTube counts for all profiles with YouTube links
 */
async function refreshAllYouTubeProfiles(): Promise<{ updated: number; failed: number; total: number }> {
    console.log('[Cron] Starting weekly YouTube refresh...');

    const stats = { updated: 0, failed: 0, total: 0 };

    try {
        // Get all profiles (approved status)
        const profiles = await profileService.getAll({ status: 'approved' });

        for (const profile of profiles) {
            if (profile.social_links?.youtube) {
                stats.total++;

                // Add delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

                const success = await refreshYouTubeForProfile(profile.id, profile.social_links.youtube);
                if (success) {
                    stats.updated++;
                } else {
                    stats.failed++;
                }
            }
        }

        console.log(`[Cron] YouTube refresh complete: ${stats.updated}/${stats.total} updated, ${stats.failed} failed`);
    } catch (error) {
        console.error('[Cron] YouTube refresh job failed:', error);
    }

    return stats;
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
    if (cronInitialized) {
        console.log('[Cron] Already initialized, skipping...');
        return;
    }

    // Weekly YouTube refresh - Every Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('[Cron] Running scheduled YouTube refresh...');
        await refreshAllYouTubeProfiles();
    }, {
        timezone: 'Asia/Karachi' // Pakistan time
    });

    console.log('[Cron] Scheduled jobs initialized:');
    console.log('  - YouTube refresh: Weekly (Sunday 3:00 AM PKT)');

    cronInitialized = true;
}

/**
 * Manual trigger for YouTube refresh (admin use)
 */
export async function triggerYouTubeRefresh(): Promise<{ updated: number; failed: number; total: number }> {
    return refreshAllYouTubeProfiles();
}

/**
 * Get cron status
 */
export function getCronStatus(): { initialized: boolean; nextYouTubeRun: string } {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(3, 0, 0, 0);

    return {
        initialized: cronInitialized,
        nextYouTubeRun: nextSunday.toISOString()
    };
}
