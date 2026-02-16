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
import { socialAccountService, SocialAccount } from './database';
import { logger } from '../utils/logger';

// Track if cron is already initialized
let cronInitialized = false;

/**
 * Refresh YouTube subscriber count for a single social account
 */
async function refreshYouTubeForAccount(account: SocialAccount): Promise<boolean> {
    try {
        const { verifyYouTubeChannel } = await import('./youtube');
        const url = account.platform_url;

        if (!url) return false;

        const result = await verifyYouTubeChannel(url);

        if (result.status === 'VERIFIED') {
            await socialAccountService.updateVerification(account.profile_id, 'youtube', {
                platform_user_id: result.channelId,
                display_name: result.channelTitle,
                follower_count: result.subscribers || 0,
                verification_status: 'verified',
                verified_at: new Date().toISOString(),
                raw_data: {
                    channelId: result.channelId,
                    channelTitle: result.channelTitle,
                    subscribers: result.subscribers,
                    status: result.status,
                    lastUpdated: new Date().toISOString()
                }
            });
            logger.info(`[Cron] Updated YouTube for profile ${account.profile_id}: ${result.subscribers} subscribers`);
            return true;
        }
        return false;
    } catch (error) {
        logger.error(`[Cron] Failed to refresh YouTube for profile ${account.profile_id}:`, error);
        return false;
    }
}

/**
 * Refresh YouTube counts for all profiles with YouTube accounts
 */
async function refreshAllYouTubeProfiles(): Promise<{ updated: number; failed: number; total: number }> {
    logger.info('[Cron] Starting weekly YouTube refresh...');

    const stats = { updated: 0, failed: 0, total: 0 };

    try {
        const { getSupabaseClient } = await import('./database');
        const supabase = getSupabaseClient();

        // Get all YouTube social accounts that are verified
        const { data: youtubeAccounts, error } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('platform', 'youtube')
            .eq('verification_status', 'verified');

        if (error) throw error;

        for (const account of youtubeAccounts || []) {
            stats.total++;

            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

            const success = await refreshYouTubeForAccount(account);
            if (success) {
                stats.updated++;
            } else {
                stats.failed++;
            }
        }

        logger.info(`[Cron] YouTube refresh complete: ${stats.updated}/${stats.total} updated, ${stats.failed} failed`);
    } catch (error) {
        logger.error('[Cron] YouTube refresh job failed:', error);
    }

    return stats;
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
    if (cronInitialized) {
        logger.info('[Cron] Already initialized, skipping...');
        return;
    }

    // Weekly YouTube refresh - Every Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        logger.info('[Cron] Running scheduled YouTube refresh...');
        await refreshAllYouTubeProfiles();
    }, {
        timezone: 'Asia/Karachi' // Pakistan time
    });

    logger.info('[Cron] Scheduled jobs initialized:');
    logger.info('  - YouTube refresh: Weekly (Sunday 3:00 AM PKT)');

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
